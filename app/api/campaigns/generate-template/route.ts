import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase/server';
import { routeAI } from '@/lib/ai/router';
import { getUserSettings, getUserSecrets } from '@/lib/settings';

export async function POST(req: Request) {
  const { supabase, user } = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ success: false, error: { message: "Unauthorized" } }, { status: 401 });
  }

  try {
    const { query, location, agencyName } = await req.json();
    if (!query) {
      return NextResponse.json({ success: false, error: { message: "Query is required" } }, { status: 400 });
  }

    const settings = await getUserSettings(supabase);
    const secrets = await getUserSecrets(supabase);

    const prompt = `You are a world-class growth engineer and B2B cold copywriter.
We need to generate a cold outbox sequence template for our growth automation campaigns.

Campaign Details:
- Target Prospect Query/Market: "${query}"
- Target Location: "${location || 'Anywhere'}"
- Our Agency Name: "${agencyName || 'ShuMuz Labs'}"

Instructions:
1. Write a cold email template (subject and body). Use placeholders like "{{business_name}}" and "{{website_url}}" to personalize lead specifics later. Do NOT write generic placeholders like "[Lead Name]" or "[My Name]". Use "{{agent_name}}" for the sender name.
2. The tone should be technical, helpful, and consultative (e.g. audit-based speed, SEO or accessibility reviews).
3. The email body must be extremely concise: 2-3 paragraphs, max 100 words total.
4. Also write a WhatsApp opening snippet (max 50 words) and an Instagram DM greeting (max 30 words) referencing their site or performance issues.

Respond ONLY with a valid, clean JSON block of the following shape, with no backticks or extra text:
{
  "email": {
    "subject": "Quick speed suggestion for {{business_name}} website",
    "body": "Hi,\\n\\nI audited {{website_url}} and noticed some performance suggestions.\\n\\nBest,\\n{{agent_name}}"
  },
  "whatsapp": "Hi, I had a quick speed audit question for {{business_name}}.",
  "instagram": "Hi, checked out your site {{website_url}} and wanted to suggest a performance boost."
}
`;

    const out = await routeAI(
      {
        taskType: 'extraction',
        systemInstruction: 'You are a strict JSON template generator. Output only valid JSON without markdown wrapping.',
        messages: [{ role: 'user', content: prompt }]
      },
      { gemini: settings.routing_weight_gemini, nvidia: settings.routing_weight_nvidia },
      { gemini: secrets.gemini, nvidia: secrets.nvidia }
    );

    let cleanResult = out.result.trim();
    if (cleanResult.startsWith("```")) {
      cleanResult = cleanResult.replace(/^```json\s*|```\s*$/g, '').trim();
    }

    try {
      const parsed = JSON.parse(cleanResult);
      return NextResponse.json({ success: true, data: parsed });
    } catch {
      // Fallback
      return NextResponse.json({
        success: true,
        data: {
          email: {
            subject: `Speed audit observation for {{business_name}}`,
            body: `Hi,\n\nI was looking at {{website_url}} and noticed some speed optimization opportunities that could help you convert more visitors.\n\nBest,\n{{agent_name}}`
          },
          whatsapp: `Hi, I was looking at {{website_url}} and had a quick performance query.`,
          instagram: `Checked out your page {{website_url}} and had a quick site speed tip!`
        }
      });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  }
}
