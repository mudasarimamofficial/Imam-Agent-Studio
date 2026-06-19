import { NextResponse } from 'next/server';
import { AgentPipeline } from '@/lib/ai/orchestrator';

export async function POST(req: Request) {
  const body = await req.json();
  const { topic, targetAudience, videoLength } = body;

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
        targetAudience: string;
        videoLength: string;
        seo?: { title: string; description: string };
        thumbnails?: string;
        chapters?: string;
        script?: string;
      }>();

      // Step 1: SEO & Meta
      pipeline.addStep({
        name: 'seoRaw',
        taskType: 'reasoning',
        systemInstruction: 'You are a YouTube SEO specialist. Given a topic, provide an optimized, highly-clickable title and a description with SEO keywords.',
        prompt: (ctx) => `Topic: ${ctx.topic}\nAudience: ${ctx.targetAudience}\nProvide output in JSON format with "title" and "description" fields.`
      });

      // Parse JSON from previous step manually (orchestrator stores raw strings)
      pipeline.addStep({
        name: 'seoParsed',
        taskType: 'fast_action',
        systemInstruction: 'You are a JSON parser. Ensure the previous output is strictly valid JSON.',
        prompt: (ctx) => `${(ctx as any).seoRaw}\nOutput JSON with "title" and "description".`
      });

      // Step 2: Thumbnails
      pipeline.addStep({
        name: 'thumbnails',
        taskType: 'planning',
        systemInstruction: 'You are an expert YouTube thumbnail designer. Describe 3 highly engaging, high-CTR thumbnail concepts.',
        prompt: (ctx) => `Topic: ${ctx.topic}\nTitle: ${(ctx as any).seoRaw}\nDescribe 3 thumbnail concepts including visual elements, text overlays, and facial expressions.`
      });

      // Step 3: Chapters
      pipeline.addStep({
        name: 'chapters',
        taskType: 'planning',
        systemInstruction: 'You are a YouTube content director. Outline a structured chapter list for a video.',
        prompt: (ctx) => `Topic: ${ctx.topic}\nTarget Length: ${ctx.videoLength} minutes.\nAudience: ${ctx.targetAudience}\nProvide a detailed bulleted list of chapters with estimated timestamps.`
      });

      // Step 4: Script
      pipeline.addStep({
        name: 'script',
        taskType: 'reasoning',
        systemInstruction: 'You are an elite YouTube scriptwriter. Write a full shooting script (A-Roll / B-Roll / Screen Recording).',
        prompt: (ctx) => `Topic: ${ctx.topic}\nLength: ${ctx.videoLength} minutes.\nChapters: ${ctx.chapters}\nWrite the script. Keep the intro under 60 seconds. Use engaging, conversational language suited for ${ctx.targetAudience}.`
      });

      const secrets = {
        gemini: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
        nvidia: process.env.NVIDIA_API_KEY
      };
      
      const settings = { routing_weight_gemini: 0.6, routing_weight_nvidia: 0.4 } as any;

      const finalContext = await pipeline.execute(
        { topic, targetAudience, videoLength },
        settings,
        secrets,
        async (stepName) => {
          let readable = "Processing...";
          if (stepName === 'seoRaw') readable = "Researching SEO and keywords...";
          if (stepName === 'thumbnails') readable = "Designing high-CTR thumbnails...";
          if (stepName === 'chapters') readable = "Structuring video chapters...";
          if (stepName === 'script') readable = "Writing full shooting script...";
          
          if (stepName !== 'seoParsed') await writeEvent(readable);
        }
      );

      let seoResult = { title: "Draft Title", description: "Draft description" };
      try {
        const cleaned = (finalContext as any).seoParsed.replace(/^```json\s*|```\s*$/g, '').trim();
        seoResult = JSON.parse(cleaned);
      } catch (e) {
        // fallback if JSON parse fails
      }

      await writeEvent("Completed", {
        seo: seoResult,
        thumbnails: finalContext.thumbnails,
        chapters: finalContext.chapters,
        script: finalContext.script
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
