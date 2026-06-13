import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase/server';
import { AdminConfig } from '@/lib/types';
import { logger } from '@/lib/logger';

export async function GET() {
  const { supabase, user } = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ success: false, error: { message: "Unauthorized" } }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("settings")
    .select("agent_concurrency_limit, memory_retention_days, routing_weight_gemini, routing_weight_nvidia, gemini_api_key, nvidia_api_key, google_places_api_key")
    .single<AdminConfig & { gemini_api_key: string | null; nvidia_api_key: string | null; google_places_api_key: string | null }>();

  if (error) {
    logger.error('admin_api', 'GET /api/admin failed', { message: error.message });
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  }

  // Never return raw key values — only whether each is configured (user key
  // or, as a fallback indicator, an env key on the server).
  const payload = {
    agent_concurrency_limit: data!.agent_concurrency_limit,
    memory_retention_days: data!.memory_retention_days,
    routing_weight_gemini: data!.routing_weight_gemini,
    routing_weight_nvidia: data!.routing_weight_nvidia,
    keys: {
      gemini: !!(data!.gemini_api_key || process.env.GEMINI_API_KEY),
      nvidia: !!(data!.nvidia_api_key || process.env.NVIDIA_API_KEY),
      places: !!(data!.google_places_api_key || process.env.GOOGLE_PLACES_API_KEY),
      gemini_user: !!data!.gemini_api_key,
      nvidia_user: !!data!.nvidia_api_key,
      places_user: !!data!.google_places_api_key,
    },
  };
  return NextResponse.json({ success: true, data: payload });
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

    // API key writes (write-only). Empty string clears a stored key.
    const keyUpdate: Record<string, string | null> = {};
    const keyMap: Record<string, string> = {
      gemini_api_key: 'gemini_api_key',
      nvidia_api_key: 'nvidia_api_key',
      google_places_api_key: 'google_places_api_key',
    };
    for (const col of Object.keys(keyMap)) {
      if (body[col] !== undefined) {
        if (typeof body[col] !== 'string' || body[col].length > 400) {
          return NextResponse.json({ success: false, error: { message: `${col} must be a string (max 400 chars)` } }, { status: 400 });
        }
        keyUpdate[col] = body[col].trim() === '' ? null : body[col].trim();
      }
    }

    const { error } = await supabase
      .from("settings")
      .update({ ...update, ...keyUpdate, updated_at: new Date().toISOString() })
      .eq("user_id", user.id);

    if (error) {
      return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: { saved: true } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error('admin_api', 'POST /api/admin error', { message });
    return NextResponse.json({ success: false, error: { message } }, { status: 500 });
  }
}
