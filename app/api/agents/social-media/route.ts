import { NextResponse } from 'next/server';
import { AgentPipeline } from '@/lib/ai/orchestrator';

// Need to stream output for the UI to see "Researching...", "Writing...", etc.
export async function POST(req: Request) {
  const body = await req.json();
  const { businessName, brandVoice, goals, platforms } = body;

  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  const writeEvent = async (status: string, result?: any) => {
    await writer.write(encoder.encode(JSON.stringify({ status, result }) + '\n'));
  };

  const runPipeline = async () => {
    try {
      const pipeline = new AgentPipeline<{
        businessName: string;
        brandVoice: string;
        goals: string;
        platforms: { linkedin: boolean; twitter: boolean; instagram: boolean };
        research?: string;
        strategy?: string;
        linkedin?: string;
        linkedinImagePrompt?: string;
        twitter?: string;
        instagram?: string;
      }>();

      // Step 1: Strategy
      pipeline.addStep({
        name: 'strategy',
        taskType: 'planning',
        systemInstruction: 'You are an elite marketing strategist. Output a short strategic brief based on the business name, goals, and voice.',
        prompt: (ctx) => `Business: ${ctx.businessName}\nGoals: ${ctx.goals}\nVoice: ${ctx.brandVoice}\nDevelop a 3-point strategy for social media.`
      });

      // Step 2: LinkedIn
      if (platforms.linkedin) {
        pipeline.addStep({
          name: 'linkedin',
          taskType: 'reasoning',
          systemInstruction: 'You are a LinkedIn ghostwriter. Write a highly engaging text-only post based on the strategy. No fluff.',
          prompt: (ctx) => `Strategy: ${ctx.strategy}\nWrite a LinkedIn post. Include line breaks and hashtags.`
        });
        pipeline.addStep({
          name: 'linkedinImagePrompt',
          taskType: 'extraction',
          systemInstruction: 'You are an AI image prompt engineer. Write a prompt to generate an image accompanying the LinkedIn post.',
          prompt: (ctx) => `Post: ${ctx.linkedin}\nWrite a Midjourney prompt describing a professional, modern image to go with this post.`
        });
      }

      // Step 3: Twitter
      if (platforms.twitter) {
        pipeline.addStep({
          name: 'twitter',
          taskType: 'fast_action',
          systemInstruction: 'You are a viral X/Twitter ghostwriter. Write a 3-part thread based on the strategy.',
          prompt: (ctx) => `Strategy: ${ctx.strategy}\nWrite an engaging 3-part thread. Number them 1/3, 2/3, 3/3.`
        });
      }

      // Step 4: Instagram
      if (platforms.instagram) {
        pipeline.addStep({
          name: 'instagram',
          taskType: 'fast_action',
          systemInstruction: 'You are an Instagram expert. Write a punchy caption with emojis and 10 relevant hashtags.',
          prompt: (ctx) => `Strategy: ${ctx.strategy}\nWrite the caption.`
        });
      }

      const secrets = {
        gemini: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
        nvidia: process.env.NVIDIA_API_KEY
      };
      
      const settings = { routing_weight_gemini: 0.8, routing_weight_nvidia: 0.2 } as any;

      const finalContext = await pipeline.execute(
        { businessName, brandVoice, goals, platforms },
        settings,
        secrets,
        async (stepName) => {
          let readable = "Processing...";
          if (stepName === 'strategy') readable = "Planning marketing strategy...";
          if (stepName === 'linkedin') readable = "Drafting LinkedIn content...";
          if (stepName === 'linkedinImagePrompt') readable = "Generating image prompts...";
          if (stepName === 'twitter') readable = "Crafting X/Twitter thread...";
          if (stepName === 'instagram') readable = "Writing Instagram caption...";
          
          await writeEvent(readable);
        }
      );

      await writeEvent("Completed", {
        linkedin: finalContext.linkedin,
        linkedinImagePrompt: finalContext.linkedinImagePrompt,
        twitter: finalContext.twitter,
        instagram: finalContext.instagram
      });
      writer.close();
    } catch (err: any) {
      console.error(err);
      await writeEvent("Failed", null);
      writer.close();
    }
  };

  // Do not await, let it stream
  runPipeline();

  return new NextResponse(stream.readable, {
    headers: {
      'Content-Type': 'application/x-ndjson',
      'Cache-Control': 'no-cache',
    },
  });
}
