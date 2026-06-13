import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase/server';
import { executeHunt } from '@/lib/hunt/engine';
import { ApiResponse, HuntResult } from '@/lib/types';
import { persistLog, logger } from '@/lib/logger';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { getUserSecrets } from '@/lib/settings';

export async function POST(req: Request) {
  const { supabase, user } = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ success: false, error: { message: "Unauthorized" } }, { status: 401 });
  }

  const rl = checkRateLimit(user.id, 'hunt', RATE_LIMITS.hunt);
  if (!rl.allowed) {
    return NextResponse.json(
      { success: false, error: { message: `Rate limit exceeded (${RATE_LIMITS.hunt}/min). Retry in ${rl.retryAfterSeconds}s.`, code: 'RATE_LIMIT' } },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } }
    );
  }

  try {
    const { query } = await req.json();
    if (!query || typeof query !== 'string' || query.length > 300) {
      return NextResponse.json(
        { success: false, error: { message: "query must be a string (max 300 chars)" } },
        { status: 400 }
      );
    }

    logger.info('hunt_api', 'POST /api/hunt', { query });
    const secrets = await getUserSecrets(supabase);
    const results = await executeHunt(query, secrets.places);

    if (results.length > 0) {
      const rows = results.map((r) => ({
        user_id: user.id,
        query,
        business_name: r.business_name,
        category: r.category,
        location: r.location,
        rating: r.rating,
        website_uri: r.website_uri ?? null,
        place_id: r.place_id ?? null,
        user_rating_count: r.user_rating_count ?? 0,
        score: r.score ?? 0,
        updated_at: new Date().toISOString(),
      }));
      // Merge-upsert on (user_id, place_id): no duplicates, and re-hunts
      // refresh rating/website/score rather than being silently ignored.
      const { error: leadErr } = await supabase
        .from("hunt_leads")
        .upsert(rows, { onConflict: "user_id,place_id" });
      if (leadErr) logger.warn('hunt_api', 'Failed to persist leads', { message: leadErr.message });
    }

    await supabase.from("memories").insert({
      user_id: user.id,
      agent_label: "HUNT_ENGINE",
      type: "task",
      content: `Hunt "${query}" returned ${results.length} targets.`,
    });

    const res: ApiResponse<HuntResult[]> = { success: true, data: results };
    return NextResponse.json(res);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    await persistLog(supabase, user.id, 'error', 'hunt_api', 'Hunt API failed', { message });
    const res: ApiResponse = { success: false, error: { message } };
    return NextResponse.json(res, { status: 500 });
  }
}
