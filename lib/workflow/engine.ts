import type { SupabaseClient } from "@supabase/supabase-js";
import { routeAI } from '../ai/router';
import { getUserSettings } from '../settings';
import { fetchWithRetry, assertSafeUrl } from '../net';
import { executeTool } from '../tools';
import { WorkflowInstance, WorkflowNode, ApiResponse, AdminConfig } from '../types';

const API_NODE_MAX_RESPONSE_CHARS = 4000;
const MEMORY_NODE_RESULT_LIMIT = 5;

export async function executeWorkflow(
  supabase: SupabaseClient,
  userId: string,
  name: string,
  nodesDef: WorkflowNode[]
): Promise<ApiResponse<WorkflowInstance>> {
  const { data: created, error: createErr } = await supabase
    .from("workflows")
    .insert({
      user_id: userId,
      name,
      status: "running",
      nodes: nodesDef,
      started_at: new Date().toISOString(),
    })
    .select()
    .single<WorkflowInstance>();

  if (createErr || !created) {
    return { success: false, error: { message: createErr?.message ?? "Failed to create workflow" } };
  }

  const nodes = created.nodes;
  const settings = await getUserSettings(supabase);

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    node.status = "running";
    await supabase.from("workflows").update({ nodes }).eq("id", created.id);

    const previousNode = nodes[i - 1];
    const upstreamOutput =
      previousNode && previousNode.status === "completed" ? previousNode.output : "";

    try {
      node.output = await executeNode(supabase, userId, settings, node, upstreamOutput);
      node.status = "completed";
    } catch (error: unknown) {
      // Graceful halt: mark this node + workflow failed, persist the stack,
      // leave remaining nodes pending, and return a clean error response.
      node.status = "failed";
      const message = error instanceof Error ? error.message : "Unknown error";
      const stack = error instanceof Error ? error.stack ?? null : null;
      node.output = `ERROR: ${message}`;

      await supabase
        .from("workflows")
        .update({ status: "failed", error: message, nodes })
        .eq("id", created.id);

      await supabase.from("logs").insert({
        user_id: userId,
        level: "error",
        module: "workflow_engine",
        message: `Workflow "${name}" failed at node ${node.id} (${node.type}): ${message}`,
        data: { workflow_id: created.id, node_id: node.id, node_type: node.type, stack },
      });

      return { success: false, error: { message: `Node ${node.id} (${node.type}) failed: ${message}` } };
    }

    await supabase.from("workflows").update({ nodes }).eq("id", created.id);
    await supabase.from("memories").insert({
      user_id: userId,
      agent_label: "WF_SYSTEM",
      type: "output",
      content: `Workflow Node ${node.id} Output: ${node.output.slice(0, 2000)}`,
    });
  }

  const { data: finished } = await supabase
    .from("workflows")
    .update({ status: "completed", completed_at: new Date().toISOString(), nodes })
    .eq("id", created.id)
    .select()
    .single<WorkflowInstance>();

  return { success: true, data: finished ?? { ...created, status: "completed", nodes } };
}

/** Executes one node for real. Throws on failure — caller handles the halt. */
async function executeNode(
  supabase: SupabaseClient,
  userId: string,
  settings: AdminConfig,
  node: WorkflowNode,
  upstreamOutput: string
): Promise<string> {
  switch (node.type) {
    case "llm": {
      const out = await routeAI(
        {
          taskType: "reasoning",
          messages: [{
            role: 'user',
            content: upstreamOutput
              ? `${node.input}\n\nContext from previous node:\n${upstreamOutput}`
              : node.input,
          }]
        },
        { gemini: settings.routing_weight_gemini, nvidia: settings.routing_weight_nvidia }
      );

      await supabase.from("inference_events").insert({
        user_id: userId,
        model_used: out.model_used,
        task_type: out.task_type,
        tokens_estimate: out.tokens_estimate,
        latency_ms: out.latency_ms,
        source: 'workflow',
      });

      return out.result;
    }

    case "api": {
      // input = URL to GET. Guarded against private/internal targets.
      const url = assertSafeUrl(node.input);
      const res = await fetchWithRetry(url.toString(), {
        method: "GET",
        headers: { "Accept": "application/json, text/plain;q=0.9, */*;q=0.1" },
      });
      if (!res.ok) {
        throw new Error(`API node received HTTP ${res.status} from ${url.hostname}`);
      }
      const text = await res.text();
      return text.length > API_NODE_MAX_RESPONSE_CHARS
        ? `${text.slice(0, API_NODE_MAX_RESPONSE_CHARS)}\n...[truncated ${text.length - API_NODE_MAX_RESPONSE_CHARS} chars]`
        : text;
    }

    case "memory": {
      // input = keyword query against the user's memory store (RLS-scoped).
      const query = node.input.trim();
      if (!query) throw new Error("Memory node requires a search query as input");
      const escaped = query.replace(/[%_]/g, (m) => `\\${m}`);
      const { data, error } = await supabase
        .from("memories")
        .select("agent_label, type, content, created_at")
        .ilike("content", `%${escaped}%`)
        .order("created_at", { ascending: false })
        .limit(MEMORY_NODE_RESULT_LIMIT);
      if (error) throw new Error(`Memory search failed: ${error.message}`);
      if (!data || data.length === 0) return `No memories matched "${query}".`;
      return data
        .map((m) => `[${m.created_at}] ${m.agent_label} (${m.type}): ${m.content.slice(0, 400)}`)
        .join("\n---\n");
    }

    case "tool": {
      // input = "<tool>: <args>" — runs in the sandboxed registry (no eval).
      return executeTool(node.input);
    }

    default:
      throw new Error(`Unknown node type: ${node.type}`);
  }
}
