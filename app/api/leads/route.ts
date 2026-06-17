import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase/server';
import { enrichWebsite } from '@/lib/hunt/enricher';
import { generateLeadMessages } from '@/lib/hunt/brain';

export async function GET(req: Request) {
  const { supabase, user } = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ success: false, error: { message: "Unauthorized" } }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') || 'all';
  const queryParam = searchParams.get('query') || '';
  const limit = parseInt(searchParams.get('limit') || '50', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);

  try {
    let query = supabase
      .from("hunt_leads")
      .select("*", { count: "exact" })
      .order("updated_at", { ascending: false });

    // Apply query filters
    const { data: rawLeads, error } = await query;
    if (error) throw error;

    let leads = rawLeads || [];

    // Map columns dynamically to support both leads schema & hunt_leads schema
    leads = leads.map((l: any) => ({
      id: l.id || l.place_id,
      place_id: l.place_id,
      business_name: l.business_name,
      website_url: l.website_uri || l.website_url || '',
      phone_number: l.phone_number || '',
      email: l.email || '',
      instagram_handle: l.instagram_handle || '',
      has_email: !!l.email || l.has_email || false,
      has_whatsapp: l.has_whatsapp || !!l.phone_number || false,
      has_instagram: l.has_instagram || !!l.instagram_handle || false,
      msg_email: l.msg_email || l.msgEmail || null,
      msg_whatsapp: l.msg_whatsapp || l.msgWhatsapp || null,
      msg_instagram: l.msg_instagram || l.msgInstagram || null,
      website_text_snippet: l.website_text_snippet || '',
      discovery_error: l.discovery_error || null,
      tech_stack: l.tech_stack || null,
      audit_pain_points: l.audit_pain_points || null,
      status: l.status || 'pending',
      rating: l.rating || 'N/A',
      user_rating_count: l.user_rating_count || 0,
      score: l.score || 0,
      created_at: l.created_at,
      updated_at: l.updated_at,
      replied_at: l.replied_at || null,
    }));

    // Perform filter programmatically to ensure it works across custom schema
    if (status !== 'all') {
      leads = leads.filter(l => l.status === status);
    }
    if (queryParam) {
      const q = queryParam.toLowerCase();
      leads = leads.filter(l => 
        l.business_name.toLowerCase().includes(q) || 
        (l.email && l.email.toLowerCase().includes(q))
      );
    }

    const total = leads.length;
    const paginated = leads.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      data: paginated,
      total,
      limit,
      offset
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  }
}

// Support updating lead details / triggers (e.g. per-lead enrich, AI brain messages)
export async function POST(req: Request) {
  const { supabase, user } = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ success: false, error: { message: "Unauthorized" } }, { status: 401 });
  }

  try {
    const { lead_id, action, updateData } = await req.json();
    if (!lead_id) {
      return NextResponse.json({ success: false, error: { message: "lead_id is required" } }, { status: 400 });
    }

    // Read the lead
    const { data: leadRaw, error: readErr } = await supabase
      .from("hunt_leads")
      .select("*")
      .eq("place_id", lead_id)
      .single();

    if (readErr || !leadRaw) {
      return NextResponse.json({ success: false, error: { message: "Lead not found" } }, { status: 404 });
    }

    if (action === 'enrich') {
      // Run enrichment sequence
      const enriched = await enrichWebsite(leadRaw.website_uri, leadRaw.phone_number);
      const updatePayload = {
        email: enriched.email,
        instagram_handle: enriched.instagram_handle,
        has_email: enriched.has_email,
        has_whatsapp: enriched.has_whatsapp,
        has_instagram: enriched.has_instagram,
        website_text_snippet: enriched.website_text_snippet,
        discovery_error: enriched.discovery_error,
        tech_stack: enriched.tech_stack,
        audit_pain_points: enriched.audit_pain_points,
        status: enriched.tech_stack ? 'processing' : 'failed',
        updated_at: new Date().toISOString()
      };

      const { error: updErr } = await supabase
        .from("hunt_leads")
        .update(updatePayload)
        .eq("place_id", lead_id);
      
      if (updErr) throw updErr;

      return NextResponse.json({ success: true, data: { ...leadRaw, ...updatePayload } });

    } else if (action === 'brain') {
      // Run AI generation sequence
      const settings = {
        agent_concurrency_limit: 10,
        memory_retention_days: 30,
        routing_weight_gemini: 0.5,
        routing_weight_nvidia: 0.5
      }; // mock/load settings if needed
      
      const secrets = {
        gemini: process.env.GEMINI_API_KEY || null,
        nvidia: process.env.NVIDIA_API_KEY || null
      };

      const messages = await generateLeadMessages(settings, secrets, {
        business_name: leadRaw.business_name,
        website_url: leadRaw.website_uri,
        website_text_snippet: leadRaw.website_text_snippet,
        tech_stack: leadRaw.tech_stack,
        audit_pain_points: leadRaw.audit_pain_points
      });

      const updatePayload = {
        msg_email: messages.email.subject + "\n\n" + messages.email.body,
        msg_whatsapp: messages.whatsapp,
        msg_instagram: messages.instagram,
        status: 'ready_to_review',
        updated_at: new Date().toISOString()
      };

      const { error: updErr } = await supabase
        .from("hunt_leads")
        .update(updatePayload)
        .eq("place_id", lead_id);
      
      if (updErr) throw updErr;

      return NextResponse.json({ success: true, data: { ...leadRaw, ...updatePayload } });

    } else if (action === 'update_message') {
      const { emailBody, whatsappBody, instagramBody } = updateData || {};
      const updatePayload = {
        msg_email: emailBody,
        msg_whatsapp: whatsappBody,
        msg_instagram: instagramBody,
        updated_at: new Date().toISOString()
      };
      
      const { error: updErr } = await supabase
        .from("hunt_leads")
        .update(updatePayload)
        .eq("place_id", lead_id);
      
      if (updErr) throw updErr;
      return NextResponse.json({ success: true, data: { ...leadRaw, ...updatePayload } });
    }

    return NextResponse.json({ success: false, error: { message: "Invalid action" } }, { status: 400 });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  }
}
