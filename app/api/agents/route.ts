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

const ALLOWED_MODELS = [
  'gemini-2.5-pro',
  'gemini-2.5-flash',
  'meta/llama-3.3-70b-instruct',
  'meta/llama-3.1-70b-instruct',
];
const MAX_AGENTS_PER_USER = 24;

// Create (spawn) a new agent for the authenticated user.
export async function PUT(req: Request) {
  const { supabase, user } = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ success: false, error: { message: "Unauthorized" } }, { status: 401 });
  }

  try {
    const { name, role, model } = await req.json();

    if (!name || typeof name !== 'string' || name.trim().length < 2 || name.length > 60) {
      return NextResponse.json({ success: false, error: { message: "name must be 2-60 characters" } }, { status: 400 });
    }
    if (role && (typeof role !== 'string' || role.length > 80)) {
      return NextResponse.json({ success: false, error: { message: "role must be a string (max 80 chars)" } }, { status: 400 });
    }
    if (model && !ALLOWED_MODELS.includes(model)) {
      return NextResponse.json({ success: false, error: { message: `model must be one of: ${ALLOWED_MODELS.join(', ')}` } }, { status: 400 });
    }

    const { count } = await supabase.from("agents").select("id", { count: "exact", head: true });
    if ((count ?? 0) >= MAX_AGENTS_PER_USER) {
      return NextResponse.json({ success: false, error: { message: `Agent limit reached (${MAX_AGENTS_PER_USER})` } }, { status: 409 });
    }

    const { data, error } = await supabase
      .from("agents")
      .insert({
        user_id: user.id,
        name: name.trim(),
        role: (role || 'General Purpose').trim(),
        model: model || 'gemini-2.5-flash',
        status: 'idle',
      })
      .select()
      .single<Agent>();

    if (error) {
      return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
    }
    logger.info('agents_api', 'Spawned agent', { id: data.id, name: data.name });
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: { message } }, { status: 500 });
  }
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
