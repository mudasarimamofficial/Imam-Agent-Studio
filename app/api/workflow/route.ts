import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase/server';
import { executeWorkflow } from '@/lib/workflow/engine';
import { ApiResponse, WorkflowNode } from '@/lib/types';
import { logger, persistLog } from '@/lib/logger';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

const VALID_NODE_TYPES = ['llm', 'api', 'memory', 'tool'];
const MAX_NODES = 20;
const MAX_INPUT_LENGTH = 8000;

export async function POST(req: Request) {
  const { supabase, user } = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ success: false, error: { message: "Unauthorized" } }, { status: 401 });
  }

  const rl = checkRateLimit(user.id, 'workflow', RATE_LIMITS.workflow);
  if (!rl.allowed) {
    return NextResponse.json(
      { success: false, error: { message: `Rate limit exceeded (${RATE_LIMITS.workflow}/min). Retry in ${rl.retryAfterSeconds}s.`, code: 'RATE_LIMIT' } },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } }
    );
  }

  try {
    const { name, nodes } = await req.json();

    if (!Array.isArray(nodes) || nodes.length === 0 || nodes.length > MAX_NODES) {
      return NextResponse.json(
        { success: false, error: { message: `nodes must be a non-empty array (max ${MAX_NODES})` } },
        { status: 400 }
      );
    }
    for (const node of nodes) {
      if (!node || typeof node.id !== 'string' || !VALID_NODE_TYPES.includes(node.type) ||
          typeof node.input !== 'string' || node.input.length > MAX_INPUT_LENGTH) {
        return NextResponse.json(
          { success: false, error: { message: "each node requires id (string), type (llm|api|memory|tool), input (string, max 8000 chars)" } },
          { status: 400 }
        );
      }
    }

    const nodesDef: WorkflowNode[] = nodes.map((n: WorkflowNode) => ({
      id: n.id,
      type: n.type,
      input: n.input,
      output: '',
      status: 'pending',
    }));

    logger.info('workflow_api', 'POST /api/workflow - executing', { name });
    const result = await executeWorkflow(
      supabase,
      user.id,
      typeof name === 'string' && name ? name.slice(0, 120) : 'Untitled Workflow',
      nodesDef
    );

    if (!result.success) {
      await persistLog(supabase, user.id, 'error', 'workflow_api', 'Workflow execution failed', { message: result.error?.message });
      return NextResponse.json(result, { status: 500 });
    }
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    await persistLog(supabase, user.id, 'error', 'workflow_api', 'WF Execution crashed', { message });
    const res: ApiResponse = { success: false, error: { message } };
    return NextResponse.json(res, { status: 500 });
  }
}
