import { routeAI } from '../ai/router';
import { AdminConfig } from '../types';

export interface BrainOutput {
  email: {
    subject: string;
    body: string;
  };
  whatsapp: string | null;
  instagram: string | null;
}

export async function generateLeadMessages(
  settings: AdminConfig,
  secrets: { gemini: string | null; nvidia: string | null },
  lead: {
    business_name: string;
    website_url: string;
    website_text_snippet: string | null;
    tech_stack: any;
    audit_pain_points: string | null;
  }
): Promise<BrainOutput> {
  const agentName = process.env.AGENT_NAME || "Muzamil Imam";
  const agencyName = process.env.AGENCY_NAME || "ShuMuz Labs";
  const agencyWebsite = process.env.AGENCY_WEBSITE_URL || "https://shumuzlabs.com";
  const agencyTagline = process.env.AGENCY_TAGLINE || "Your technical co-founder, on demand";

  const cleanSnippet = lead.website_text_snippet ? lead.website_text_snippet.trim() : "None";
  const cleanPainPoints = lead.audit_pain_points ? lead.audit_pain_points.trim() : "None detected.";

  const prompt = `You are a world-class B2B sales copywriter writing cold outreach on behalf of ${agentName} at ${agencyName} (${agencyWebsite}).
We specialize in e-commerce optimization, WCAG accessibility compliance, and core web vitals speed optimization.

Draft a highly personalized B2B outreach campaign for this prospect:
Business Name: ${lead.business_name}
Website: ${lead.website_url}
Website Content Snippet: "${cleanSnippet}"
Technical Audit Findings: "${cleanPainPoints}"

Technical Outreach Instructions:
1. Cite concrete technical pain points found during the audit (e.g. image alt tag accessibility flaws, script sizes, Shopify speed limits) in a consultative, helpful tone.
2. Position ${agencyName} as an expert in website audit and site performance remediation.
3. Keep the email copy to 3 short paragraphs, under 120 words. No placeholders like "[Your Name]" or "[Insert Business Name]". Write as ${agentName}.
4. Provide short, optional copy for WhatsApp (max 70 words) and Instagram DM (max 40 words) that open with the same consultative speed angle.

Respond ONLY with a valid JSON block of the following shape, without any markdown formatting around it:
{
  "email": {
    "subject": "quick observation about ${lead.business_name} website speed",
    "body": "Hi..."
  },
  "whatsapp": "Hi...",
  "instagram": "Hi..."
}
`;

  try {
    const out = await routeAI(
      {
        taskType: 'extraction',
        systemInstruction: 'You are an expert sales automation brain that strictly outputs JSON matching schemas.',
        messages: [{ role: 'user', content: prompt }]
      },
      { gemini: settings.routing_weight_gemini, nvidia: settings.routing_weight_nvidia },
      { gemini: secrets.gemini, nvidia: secrets.nvidia }
    );

    let cleanResult = out.result.trim();
    // Strip markdown formatting if the model wrapped it
    if (cleanResult.startsWith("```")) {
      cleanResult = cleanResult.replace(/^```json\s*|```\s*$/g, '').trim();
    }

    try {
      const parsed = JSON.parse(cleanResult);
      return {
        email: {
          subject: parsed.email?.subject || `Website speed observation for ${lead.business_name}`,
          body: parsed.email?.body || parsed.email || `Hi, I noticed some performance options on your website...`,
        },
        whatsapp: parsed.whatsapp || null,
        instagram: parsed.instagram || null,
      };
    } catch {
      // Fallback if JSON parse fails
      return {
        email: {
          subject: `Website speed observation for ${lead.business_name}`,
          body: out.result,
        },
        whatsapp: `Hi, I noticed some performance suggestions for ${lead.business_name}'s website: ${lead.website_url}`,
        instagram: `Hi, I had a quick technical suggestion for ${lead.business_name}.`,
      };
    }
  } catch (err: any) {
    throw new Error(`AI brain failed: ${err.message || err}`);
  }
}
