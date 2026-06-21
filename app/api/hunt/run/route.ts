import { NextResponse } from 'next/server';
import { processHuntLead } from '@/lib/hunt/enricher';
import { getAuthenticatedUser } from '@/lib/supabase/server';

export async function POST(req: Request) {
  const { supabase, user } = await getAuthenticatedUser();
  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const { domains } = await req.json(); // Array of strings (e.g. ["example.com", "test.com"])
  if (!Array.isArray(domains) || domains.length === 0) {
    return new NextResponse('Bad Request: Need array of domains', { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  const writeEvent = async (event: { status?: string; result?: any; domain?: string; complete?: boolean; error?: string }) => {
    await writer.write(encoder.encode(JSON.stringify(event) + '\n'));
  };

  const runHunts = async () => {
    try {
      const secrets = {
        gemini: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
        nvidia: process.env.NVIDIA_API_KEY
      };
      const settings = { routing_weight_gemini: 0.8, routing_weight_nvidia: 0.2 };

      for (let i = 0; i < domains.length; i++) {
        const domain = domains[i];
        
        await writeEvent({ status: `Initializing hunt for ${domain}`, domain });

        const enriched = await processHuntLead(
          domain, 
          settings, 
          secrets, 
          async (msg) => {
            await writeEvent({ status: msg, domain });
          }
        );

        if (enriched) {
          // Save to Supabase
          const { error } = await supabase.from('hunt_leads').insert({
            user_id: user.id,
            business_name: enriched.businessName,
            website_url: `https://${enriched.domain}`,
            email: enriched.emails[0] || null,
            phone_number: enriched.phones[0] || null,
            instagram_handle: enriched.socials.instagram ? new URL(enriched.socials.instagram).pathname.split('/')[1] : null,
            tech_stack: enriched.techStack,
            audit_pain_points: enriched.painPoints,
            status: 'ready_to_review',
            score: Math.floor(Math.random() * 40) + 60, // Mock score for now based on enrichment depth
            msg_email: enriched.draftEmail,
            msg_whatsapp: null,
            msg_instagram: enriched.draftLinkedIn,
            // new dynamic field if we alter schema, or just pack it:
            website_text_snippet: JSON.stringify({ founders: enriched.founders, industry: enriched.industry, summary: enriched.summary, all_emails: enriched.emails, socials: enriched.socials })
          });

          if (error) {
            console.error('Supabase Insert Error:', error);
            await writeEvent({ error: 'Failed to save to database', domain });
          } else {
            await writeEvent({ status: `Successfully enriched ${domain}`, domain, result: enriched });
          }
        } else {
          await writeEvent({ error: `Could not extract data for ${domain}`, domain });
        }
      }

      await writeEvent({ complete: true });
      writer.close();
    } catch (err: any) {
      console.error('Hunt Run Error:', err);
      await writeEvent({ error: err.message || 'Fatal Pipeline Error', complete: true });
      writer.close();
    }
  };

  runHunts();

  return new NextResponse(stream.readable, {
    headers: {
      'Content-Type': 'application/x-ndjson',
      'Cache-Control': 'no-cache',
    },
  });
}
