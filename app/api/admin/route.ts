import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase/server';
import { ApiResponse, AdminConfig } from '@/lib/types';
import { logger } from '@/lib/logger';

export async function GET() {
  const { supabase, user } = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ success: false, error: { message: "Unauthorized" } }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("settings")
    .select("agent_concurrency_limit, memory_retention_days, routing_weight_gemini, routing_weight_nvidia")
    .single<AdminConfig>();

  if (error) {
    logger.error('admin_api', 'GET /api/admin failed', { message: error.message });
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  }

  const res: ApiResponse<AdminConfig> = { success: true, data };
  return NextResponse.json(res);
}

export async function POST(req: Request) {
  const { supabase, user } = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ success: false, error: { message: "Unauthorized" } }, { status: 401 });
  }

  try {
    const body = await req.json();
    const update: Partial<AdminConfig> = {};

    if (body.agent_concurrency_limit !== undefined) {
      const v = Number(body.agent_concurrency_limit);
      if (!Number.isInteger(v) || v < 1 || v > 100) {
        return NextResponse.json({ success: false, error: { message: "agent_concurrency_limit must be an integer 1-100" } }, { status: 400 });
      }
      update.agent_concurrency_limit = v;
    }
    if (body.memory_retention_days !== undefined) {
      const v = Number(body.memory_retention_days);
      if (!Number.isInteger(v) || v < 1 || v > 365) {
        return NextResponse.json({ success: false, error: { message: "memory_retention_days must be an integer 1-365" } }, { status: 400 });
      }
      update.memory_retention_days = v;
    }
    for (const key of ["routing_weight_gemini", "routing_weight_nvidia"] as const) {
      if (body[key] !== undefined) {
        const v = Number(body[key]);
        if (Number.isNaN(v) || v < 0 || v > 1) {
          return NextResponse.json({ success: false, error: { message: `${key} must be between 0 and 1` } }, { status: 400 });
        }
        update[key] = v;
      }
    }

    const { data, error } = await supabase
      .from("settings")
      .update({ ...update, updated_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .select("agent_concurrency_limit, memory_retention_days, routing_weight_gemini, routing_weight_nvidia")
      .single<AdminConfig>();

    if (error) {
      return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
    }

    const res: ApiResponse<AdminConfig> = { success: true, data };
    return NextResponse.json(res);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error('admin_api', 'POST /api/admin error', { message });
    return NextResponse.json({ success: false, error: { message } }, { status: 500 });
  }
}
