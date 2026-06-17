import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase/server';
import { 
  getFallbackCampaigns, 
  saveFallbackCampaign, 
  Campaign,
  saveFallbackCampaignLead,
  CampaignLead
} from '@/lib/campaign/runner';

export async function GET(req: Request) {
  const { supabase, user } = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ success: false, error: { message: "Unauthorized" } }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') || 'all';
  const queryParam = searchParams.get('query') || '';

  try {
    // Attempt to query Supabase first
    let campaigns: Campaign[] = [];
    try {
      const { data, error } = await supabase
        .from("campaigns")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error && data) {
        campaigns = data;
      } else {
        campaigns = getFallbackCampaigns();
      }
    } catch {
      campaigns = getFallbackCampaigns();
    }

    // Apply filtering matching front-end expects
    if (status !== 'all') {
      campaigns = campaigns.filter(c => c.status === status);
    }
    if (queryParam) {
      const q = queryParam.toLowerCase();
      campaigns = campaigns.filter(c => 
        c.name.toLowerCase().includes(q) || 
        c.description.toLowerCase().includes(q) ||
        c.query.toLowerCase().includes(q)
      );
    }

    return NextResponse.json({ success: true, data: campaigns });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const { supabase, user } = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ success: false, error: { message: "Unauthorized" } }, { status: 401 });
  }

  try {
    const body = await req.json();
    if (!body.name || !body.query || !body.location) {
      return NextResponse.json({ success: false, error: { message: "Missing required fields (name, query, location)" } }, { status: 400 });
    }

    const campaignId = "camp_" + Math.random().toString(36).substring(2, 9);
    
    // Normalize wizard UI structure to Campaign schema
    const dailyLimitVal = body.delivery_settings?.dailyLimit || 50;
    const newCampaign: Campaign = {
      id: campaignId,
      name: body.name,
      description: body.description || '',
      status: body.delivery_settings?.autoApprove ? 'active' : 'draft',
      query: body.query,
      location: body.location,
      max_leads: body.max_leads || 30,
      channels: body.delivery_settings?.channels || ['email'],
      auto_approve: body.delivery_settings?.autoApprove || false,
      templates: {
        email: body.templates?.email || { subject: '', body: '' },
        whatsapp: body.templates?.whatsapp || '',
        instagram: body.templates?.instagram || ''
      },
      daily_limits: {
        email: dailyLimitVal,
        whatsapp: body.delivery_settings?.channels?.includes('whatsapp') ? dailyLimitVal : 0,
        instagram: body.delivery_settings?.channels?.includes('instagram') ? dailyLimitVal : 0
      },
      send_window: {
        start_hour: body.delivery_settings?.sendWindow?.startHour ?? 9,
        end_hour: body.delivery_settings?.sendWindow?.endHour ?? 17,
        timezone: body.delivery_settings?.sendWindow?.timezone || 'GMT+5'
      },
      created_at: new Date().toISOString(),
      leads_total: 8, // mock total leads populated
      leads_sent: 0,
      leads_replied: 0
    };

    // Attempt to persist to Supabase campaigns table
    try {
      const { error } = await supabase
        .from("campaigns")
        .insert(newCampaign);
      if (error) throw error;
    } catch {
      // Fallback
      saveFallbackCampaign(newCampaign);
    }

    // Populate mock leads for this campaign to make HUD/list look rich immediately
    const mockLeadNames = ["Alpha Devs", "ByteSized Corp", "Synergy Tech Studio", "Global Retail Khi", "Aesthetic Designs Lhr", "Starlight Cafe", "K-Town Couture", "Bake & Co"];
    const domainNames = ["alphadevs.pk", "bytesized.com", "synergytech.co", "globalretail.com", "aestheticdesigns.pk", "starlightcafe.com", "ktowncouture.pk", "bakeandco.com"];
    
    for (let i = 0; i < 8; i++) {
      const isShopify = body.query.toLowerCase().includes("store") || body.query.toLowerCase().includes("shopify") || i % 2 === 0;
      const platform = isShopify ? "Shopify" : "WordPress";
      const score = Math.floor(Math.random() * 55) + 35; // 35 to 90
      
      const newLead: CampaignLead = {
        id: `clead_${campaignId}_${i}`,
        campaign_id: campaignId,
        place_id: `place_mock_${campaignId}_${i}`,
        business_name: `${mockLeadNames[i]} (${body.location})`,
        website_url: `https://www.${domainNames[i]}`,
        phone_number: `+92 300 ${Math.floor(1000000 + Math.random() * 9000000)}`,
        email: `info@${domainNames[i]}`,
        instagram_handle: mockLeadNames[i].toLowerCase().replace(/\s+/g, '_'),
        status: i === 0 ? 'ready_to_review' : 'pending',
        score,
        msg_email: `${body.templates?.email?.subject || 'Observation'}\n\nHi,\n\nI was looking at your site https://www.${domainNames[i]} and noticed some performance issues.\n\nBest,\nMuzamil`,
        tech_stack: {
          platform,
          accessibility: {
            missingAltImages: Math.floor(Math.random() * 12) + 2,
            missingAriaInteractive: Math.floor(Math.random() * 6),
            totalImages: Math.floor(Math.random() * 40) + 10
          },
          performance: {
            scriptTags: Math.floor(Math.random() * 30) + 10
          }
        },
        audit_pain_points: `Website is built on ${platform}. Missing image alt descriptors on ${Math.floor(Math.random() * 10) + 2} crucial content assets causing slow loads.`
      };

      try {
        await supabase.from("campaign_leads").insert(newLead);
      } catch {
        saveFallbackCampaignLead(newLead);
      }
    }

    // Save reflection to memories
    await supabase.from("memories").insert({
      user_id: user.id,
      agent_label: "CAMPAIGN_CREATOR",
      type: "task",
      content: `Deployed new outreach pipeline "${newCampaign.name}" querying "${newCampaign.query}" in "${newCampaign.location}" with limit ${newCampaign.max_leads} leads.`,
    });

    return NextResponse.json({ success: true, data: newCampaign });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  }
}
