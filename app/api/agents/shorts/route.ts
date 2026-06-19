import { NextResponse } from 'next/server';
import { AgentPipeline } from '@/lib/ai/orchestrator';

export async function POST(req: Request) {
  const body = await req.json();
  const { topic, duration, tone, music } = body;

  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  const writeEvent = async (status: string, result?: any) => {
    await writer.write(encoder.encode(JSON.stringify({ status, result }) + '\n'));
  };

  const runPipeline = async () => {
    try {
      const pipeline = new AgentPipeline<{
        topic: string;
        duration: string;
        tone: string;
        music: string;
        hooks?: string;
        sound?: string;
        script?: string;
        prompts?: string;
      }>();

      // Step 1: Hooks
      pipeline.addStep({
        name: 'hooks',
        taskType: 'reasoning',
        systemInstruction: 'You are an elite TikTok and Reels strategist. Generate 3 viral hook options. Keep them punchy and controversial or highly curious.',
        prompt: (ctx) => `Topic: ${ctx.topic}\nTone: ${ctx.tone}\nGenerate 3 different spoken hooks (just the text) that will stop the scroll immediately.`
      });

      // Step 2: Sound Design
      pipeline.addStep({
        name: 'sound',
        taskType: 'planning',
        systemInstruction: 'You are a short-form video sound designer.',
        prompt: (ctx) => `Topic: ${ctx.topic}\nUser music preference: ${ctx.music || 'None specified'}\nTone: ${ctx.tone}\nProvide a 2-3 sentence sound design strategy, recommending specific types of trending audio and sound effects.`
      });

      // Step 3: Script & Visuals
      pipeline.addStep({
        name: 'script',
        taskType: 'reasoning',
        systemInstruction: 'You are a viral video scriptwriter. Output a 2-column format (Visuals | Audio/Voiceover) using plain text.',
        prompt: (ctx) => `Topic: ${ctx.topic}\nDuration: ${ctx.duration} seconds.\nTone: ${ctx.tone}\nHooks chosen: ${ctx.hooks}\nWrite a fast-paced scene-by-scene script. Ensure the word count matches the duration (approx 2.5 words per second).`
      });

      // Step 4: Prompts
      pipeline.addStep({
        name: 'prompts',
        taskType: 'extraction',
        systemInstruction: 'You are an AI video and image prompt engineer.',
        prompt: (ctx) => `Script: ${ctx.script}\nBased on the visual directions, write 3 highly detailed AI image/video generation prompts (for Runway Gen-2 or Midjourney) that could be used as B-Roll for this short.`
      });

      const secrets = {
        gemini: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
        nvidia: process.env.NVIDIA_API_KEY
      };
      
      const settings = { routing_weight_gemini: 0.7, routing_weight_nvidia: 0.3 } as any;

      const finalContext = await pipeline.execute(
        { topic, duration, tone, music },
        settings,
        secrets,
        async (stepName) => {
          let readable = "Processing...";
          if (stepName === 'hooks') readable = "Brainstorming viral hooks...";
          if (stepName === 'sound') readable = "Designing soundscape & music...";
          if (stepName === 'script') readable = "Writing scene-by-scene script...";
          if (stepName === 'prompts') readable = "Generating AI B-roll prompts...";
          
          await writeEvent(readable);
        }
      );

      await writeEvent("Completed", {
        hooks: finalContext.hooks,
        sound: finalContext.sound,
        script: finalContext.script,
        prompts: finalContext.prompts
      });
      writer.close();
    } catch (err: any) {
      console.error(err);
      await writeEvent("Failed", null);
      writer.close();
    }
  };

  runPipeline();

  return new NextResponse(stream.readable, {
    headers: {
      'Content-Type': 'application/x-ndjson',
      'Cache-Control': 'no-cache',
    },
  });
}
