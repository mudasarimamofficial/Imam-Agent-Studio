import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

export interface SystemStats {
  tokens: { lifetime: number; today: number };
  inferences: { lifetime: number; avg_latency_ms: number | null; last_model: string | null };
  memories: { total: number };
  workflows: {
    total: number;
    running: number;
    completed: number;
    failed: number;
    recent: Array<{ id: string; name: string; status: string; created_at: string; completed_at: string | null }>;
  };
  agents: { total: number; active: number; running: number; error: number; limit: number };
  errors_24h: number;
  hunt: { leads_total: number; leads_today: number; with_website: number; hunts_run: number };
}

export async function GET() {
  const { supabase, user } = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ success: false, error: { message: "Unauthorized" } }, { status: 401 });
  }

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  try {
    const [
      inferenceRows,
      memoriesCount,
      workflowCounts,
      recentWorkflows,
      agentRows,
      settingsRow,
      errorCount,
      leadRows,
      huntsRun,
    ] = await Promise.all([
      supabase.from("inference_events").select("tokens_estimate, latency_ms, model_used, created_at").order("created_at", { ascending: false }).limit(1000),
      supabase.from("memories").select("id", { count: "exact", head: true }),
      supabase.from("workflows").select("status"),
      supabase.from("workflows").select("id, name, status, created_at, completed_at").order("created_at", { ascending: false }).limit(5),
      supabase.from("agents").select("status"),
      supabase.from("settings").select("agent_concurrency_limit").single(),
      supabase.from("logs").select("id", { count: "exact", head: true }).eq("level", "error").gte("created_at", dayAgo),
      supabase.from("hunt_leads").select("website_uri, created_at"),
      supabase.from("memories").select("id", { count: "exact", head: true }).eq("agent_label", "HUNT_ENGINE"),
    ]);

    const events = inferenceRows.data ?? [];
    const latencies = events.filter(e => e.latency_ms != null);
    const wfs = workflowCounts.data ?? [];
    const agents = agentRows.data ?? [];
    const leads = leadRows.data ?? [];

    const stats: SystemStats = {
      tokens: {
        lifetime: events.reduce((s, e) => s + (e.tokens_estimate ?? 0), 0),
        today: events
          .filter(e => new Date(e.created_at) >= startOfToday)
          .reduce((s, e) => s + (e.tokens_estimate ?? 0), 0),
      },
      inferences: {
        lifetime: events.length,
        avg_latency_ms: latencies.length
          ? Math.round(latencies.reduce((s, e) => s + (e.latency_ms ?? 0), 0) / latencies.length)
          : null,
        last_model: events[0]?.model_used ?? null,
      },
      memories: { total: memoriesCount.count ?? 0 },
      workflows: {
        total: wfs.length,
        running: wfs.filter(w => w.status === 'running').length,
        completed: wfs.filter(w => w.status === 'completed').length,
        failed: wfs.filter(w => w.status === 'failed').length,
        recent: recentWorkflows.data ?? [],
      },
      agents: {
        total: agents.length,
        active: agents.filter(a => a.status === 'active').length,
        running: agents.filter(a => a.status === 'running').length,
        error: agents.filter(a => a.status === 'error').length,
        limit: settingsRow.data?.agent_concurrency_limit ?? 10,
      },
      errors_24h: errorCount.count ?? 0,
      hunt: {
        leads_total: leads.length,
        leads_today: leads.filter(l => new Date(l.created_at) >= startOfToday).length,
        with_website: leads.filter(l => l.website_uri && l.website_uri !== 'No website found').length,
        hunts_run: huntsRun.count ?? 0,
      },
    };

    return NextResponse.json({ success: true, data: stats });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error('stats_api', 'GET /api/stats failed', { message });
    return NextResponse.json({ success: false, error: { message } }, { status: 500 });
  }
}
