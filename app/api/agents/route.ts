import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase/server';
import { executeAgentTask } from '@/lib/agents/engine';
import { ApiResponse, Agent } from '@/lib/types';
import { logger, persistLog } from '@/lib/logger';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

export async function GET() {
  const { supabase, user } = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ success: false, error: { message: "Unauthorized" } }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("agents")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    logger.error('agents_api', 'GET /api/agents failed', { message: error.message });
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  }

  const res: ApiResponse<Agent[]> = { success: true, data: data ?? [] };
  return NextResponse.json(res);
}

export async function POST(req: Request) {
  const { supabase, user } = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ success: false, error: { message: "Unauthorized" } }, { status: 401 });
  }

  const rl = checkRateLimit(user.id, 'agents', RATE_LIMITS.agents);
  if (!rl.allowed) {
    return NextResponse.json(
      { success: false, error: { message: `Rate limit exceeded (${RATE_LIMITS.agents}/min). Retry in ${rl.retryAfterSeconds}s.`, code: 'RATE_LIMIT' } },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } }
    );
  }

  try {
    const { agent_id, instruction, task_type } = await req.json();

    if (!agent_id || typeof agent_id !== 'string') {
      return NextResponse.json({ success: false, error: { message: "agent_id is required" } }, { status: 400 });
    }
    if (!instruction || typeof instruction !== 'string' || instruction.length > 8000) {
      return NextResponse.json({ success: false, error: { message: "instruction must be a string (max 8000 chars)" } }, { status: 400 });
    }

    logger.info('agents_api', `POST /api/agents - Task: ${task_type}`, { agent_id });
    const result = await executeAgentTask(supabase, user.id, {
      agent_id,
      task_type: task_type || 'reasoning',
      instruction,
    });

    if (!result.success) {
      const isLimit = result.error?.code === 'CONCURRENCY_LIMIT';
      if (!isLimit) {
        await persistLog(supabase, user.id, 'error', 'agents_api', 'Agent task failed', { message: result.error?.message });
      }
      return NextResponse.json(result, { status: isLimit ? 429 : 500 });
    }
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown Error";
    await persistLog(supabase, user.id, 'error', 'agents_api', 'POST /api/agents crashed', { message });
    return NextResponse.json({ success: false, error: { message } }, { status: 500 });
  }
}
