import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase/server';
import { routeAI } from '@/lib/ai/router';
import { getUserSettings, getUserSecrets } from '@/lib/settings';
import { checkRateLimit } from '@/lib/rate-limit';
import { persistLog } from '@/lib/logger';

export async function POST(req: Request) {
  const { supabase, user } = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ success: false, error: { message: "Unauthorized" } }, { status: 401 });
  }

  // Pitch generation is an LLM call — rate-limit it like other inference routes.
  const rl = checkRateLimit(user.id, 'pitch', 8);
  if (!rl.allowed) {
    return NextResponse.json(
      { success: false, error: { message: `Rate limit exceeded. Retry in ${rl.retryAfterSeconds}s.`, code: 'RATE_LIMIT' } },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } }
    );
  }

  try {
    const { business_name, category, location, rating, website_uri, score } = await req.json();
    if (!business_name || typeof business_name !== 'string') {
      return NextResponse.json({ success: false, error: { message: "business_name is required" } }, { status: 400 });
    }

    const hasWebsite = website_uri && website_uri !== 'No website found';
    const settings = await getUserSettings(supabase);
    const secrets = await getUserSecrets(supabase);

    const prompt = `Write a concise, personalized cold outreach email to a prospective client.

Business: ${business_name}
Category: ${String(category || 'business').replace(/_/g, ' ')}
Location: ${location || 'unknown'}
Google rating: ${rating || 'N/A'}
Website: ${hasWebsite ? website_uri : 'NONE FOUND'}
Lead score: ${score ?? 'n/a'}/100

Guidelines:
- 120 words max, professional but warm.
- Open with one specific, genuine observation about the business.
- ${hasWebsite ? 'Reference their web presence and offer a concrete improvement.' : 'Note they appear to have no website and position that as the opening.'}
- Pitch AI-driven growth/automation services from "Imam Agent Studio".
- End with a soft call to action (a short call).
- Output ONLY the email body with a subject line. No preamble.`;

    const out = await routeAI(
      {
        taskType: 'fast_action',
        systemInstruction: 'You are an expert B2B sales copywriter. You write tight, high-converting, non-spammy outreach.',
        messages: [{ role: 'user', content: prompt }],
      },
      { gemini: settings.routing_weight_gemini, nvidia: settings.routing_weight_nvidia },
      { gemini: secrets.gemini, nvidia: secrets.nvidia }
    );

    await supabase.from("inference_events").insert({
      user_id: user.id,
      model_used: out.model_used,
      task_type: out.task_type,
      tokens_estimate: out.tokens_estimate,
      latency_ms: out.latency_ms,
      source: 'command',
    });

    return NextResponse.json({ success: true, data: { pitch: out.result, model_used: out.model_used } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    await persistLog(supabase, user.id, 'error', 'pitch_api', 'Pitch generation failed', { message });
    return NextResponse.json({ success: false, error: { message } }, { status: 500 });
  }
}
