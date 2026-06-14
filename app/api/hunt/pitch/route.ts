import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase/server';
import { routeAI } from '@/lib/ai/router';
import { getUserSettings, getUserSecrets } from '@/lib/settings';
import { checkRateLimit } from '@/lib/rate-limit';
import { persistLog } from '@/lib/logger';

export const maxDuration = 45;

export async function POST(req: Request) {
  const { supabase, user } = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ success: false, error: { message: "Unauthorized" } }, { status: 401 });
  }

  const rl = checkRateLimit(user.id, 'pitch', 8);
  if (!rl.allowed) {
    return NextResponse.json(
      { success: false, error: { message: `Rate limit exceeded. Retry in ${rl.retryAfterSeconds}s.`, code: 'RATE_LIMIT' } },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } }
    );
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: { message: "Invalid JSON" } }, { status: 400 });
  }

  const { business_name, category, location, rating, website_uri, score } = body;
  if (!business_name || typeof business_name !== 'string') {
    return NextResponse.json({ success: false, error: { message: "business_name is required" } }, { status: 400 });
  }

  const stream = new ReadableStream({
    async start(controller) {
      const sendLog = (msg: string) => {
        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ type: 'log', msg })}\n\n`));
      };
      const sendResult = (pitch: string, model_used: string) => {
        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ type: 'result', pitch, model_used })}\n\n`));
      };
      const sendError = (msg: string) => {
        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ type: 'error', msg })}\n\n`));
      };

      try {
        sendLog(`[SYS] Initializing sequence for target: ${business_name}...`);
        await new Promise(r => setTimeout(r, 400));
        
        sendLog("[SYS] Analyzing lead data...");
        const settings = await getUserSettings(supabase);
        const secrets = await getUserSecrets(supabase);
        await new Promise(r => setTimeout(r, 400));

        const hasWebsite = website_uri && website_uri !== 'No website found';
        sendLog(`[SYS] Target context: ${category} in ${location}. Web presence: ${hasWebsite ? 'VERIFIED' : 'NONE'}`);
        await new Promise(r => setTimeout(r, 400));

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

        sendLog("[LLM] Crafting hyper-personalized outreach...");
        
        const out = await routeAI(
          {
            taskType: 'fast_action',
            systemInstruction: 'You are an expert B2B sales copywriter. You write tight, high-converting, non-spammy outreach.',
            messages: [{ role: 'user', content: prompt }],
          },
          { gemini: settings.routing_weight_gemini, nvidia: settings.routing_weight_nvidia },
          { gemini: secrets.gemini, nvidia: secrets.nvidia }
        );

        sendLog(`[SYS] Pitch generation complete via ${out.model_used}. Logging event...`);
        
        await supabase.from("inference_events").insert({
          user_id: user.id,
          model_used: out.model_used,
          task_type: out.task_type,
          tokens_estimate: out.tokens_estimate,
          latency_ms: out.latency_ms,
          source: 'command',
        });

        sendResult(out.result, out.model_used);
        sendLog("[SUCCESS] Sequence concluded.");
      } catch (err: any) {
        const message = err.message || "Unknown error";
        sendError(message);
        sendLog(`[ERROR] ${message}`);
        await persistLog(supabase, user.id, 'error', 'pitch_api', 'Pitch generation failed', { message });
      } finally {
        controller.close();
      }
    }
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
