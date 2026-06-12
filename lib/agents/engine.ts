import type { SupabaseClient } from "@supabase/supabase-js";
import { routeAI } from '../ai/router';
import { getUserSettings } from '../settings';
import { TaskPayload, ApiResponse, RouterOutput, Agent } from '../types';

export async function executeAgentTask(
  supabase: SupabaseClient,
  userId: string,
  payload: TaskPayload
): Promise<ApiResponse<RouterOutput>> {
  const settings = await getUserSettings(supabase);

  // Enforce the configured concurrency limit: agents currently mid-task count
  // against it, and this task is rejected (not queued) once the limit is hit.
  const { count: runningCount } = await supabase
    .from("agents")
    .select("id", { count: "exact", head: true })
    .eq("status", "running");

  if ((runningCount ?? 0) >= settings.agent_concurrency_limit) {
    return {
      success: false,
      error: {
        message: `Concurrency limit reached: ${runningCount}/${settings.agent_concurrency_limit} agents already running`,
        code: "CONCURRENCY_LIMIT",
      },
    };
  }

  const { data: agent, error: agentErr } = await supabase
    .from("agents")
    .select("*")
    .eq("id", payload.agent_id)
    .single<Agent>();

  if (agentErr || !agent) {
    return { success: false, error: { message: `Agent ${payload.agent_id} not found` } };
  }

  await supabase
    .from("agents")
    .update({ status: "running", last_active_at: new Date().toISOString() })
    .eq("id", agent.id);

  try {
    const routerOutput = await routeAI(
      {
        taskType: payload.task_type,
        systemInstruction: `You are agent ${agent.name}, acting as ${agent.role}. Perform the user task.`,
        messages: [{ role: 'user', content: payload.instruction }]
      },
      { gemini: settings.routing_weight_gemini, nvidia: settings.routing_weight_nvidia }
    );

    await supabase.from("inference_events").insert({
      user_id: userId,
      model_used: routerOutput.model_used,
      task_type: routerOutput.task_type,
      tokens_estimate: routerOutput.tokens_estimate,
      latency_ms: routerOutput.latency_ms,
      source: 'agent',
    });

    await supabase.from("memories").insert({
      user_id: userId,
      agent_id: agent.id,
      agent_label: agent.name,
      type: "output",
      content: routerOutput.result,
    });

    await supabase
      .from("agents")
      .update({
        status: "active",
        tasks_completed: agent.tasks_completed + 1,
        last_active_at: new Date().toISOString(),
      })
      .eq("id", agent.id);

    return { success: true, data: routerOutput };
  } catch (error: unknown) {
    await supabase.from("agents").update({ status: "error" }).eq("id", agent.id);
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: { message } };
  }
}
