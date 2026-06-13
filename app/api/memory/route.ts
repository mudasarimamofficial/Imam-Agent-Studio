import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase/server';
import { ApiResponse, MemoryEntry } from '@/lib/types';
import { logger } from '@/lib/logger';

export async function GET(req: Request) {
  const { supabase, user } = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ success: false, error: { message: "Unauthorized" } }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "100", 10) || 100, 500);
  const q = (searchParams.get("q") || "").trim();
  const agent = (searchParams.get("agent") || "").trim();

  let query = supabase
    .from("memories")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (q) {
    const escaped = q.replace(/[%_]/g, (m) => `\\${m}`);
    query = query.ilike("content", `%${escaped}%`);
  }
  if (agent) {
    query = query.eq("agent_label", agent);
  }

  const { data, error } = await query;

  if (error) {
    logger.error('memory_api', 'GET /api/memory failed', { message: error.message });
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  }

  const res: ApiResponse<MemoryEntry[]> = { success: true, data: data ?? [] };
  return NextResponse.json(res);
}
