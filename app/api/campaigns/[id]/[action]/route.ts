import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase/server';
import { 
  getFallbackCampaigns, 
  saveFallbackCampaign, 
  Campaign,
  getFallbackCampaignLeads,
  saveFallbackCampaignLead,
  getFallbackABTests,
  saveFallbackABTest
} from '@/lib/campaign/runner';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; action: string }> }
) {
  const { supabase, user } = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ success: false, error: { message: "Unauthorized" } }, { status: 401 });
  }

  const { id, action } = await params;

  try {
    let campaign: Campaign | undefined;
    try {
      const { data, error } = await supabase
        .from("campaigns")
        .select("*")
        .eq("id", id)
        .single();
      if (!error && data) {
        campaign = data;
      } else {
        campaign = getFallbackCampaigns().find(c => c.id === id);
      }
    } catch {
      campaign = getFallbackCampaigns().find(c => c.id === id);
    }

    if (!campaign) {
      return NextResponse.json({ success: false, error: { message: "Campaign not found" } }, { status: 404 });
    }

    if (action === 'start') {
      campaign.status = 'active';
      try {
        await supabase
          .from("campaigns")
          .update({ status: 'active' })
          .eq("id", id);
      } catch {
        saveFallbackCampaign(campaign);
      }

      await supabase.from("memories").insert({
        user_id: user.id,
        agent_label: "CAMPAIGN_RUNNER",
        type: "task",
        content: `Resumed outreach sequence for campaign "${campaign.name}"`,
      });

      return NextResponse.json({ success: true, data: campaign });

    } else if (action === 'pause') {
      campaign.status = 'paused';
      try {
        await supabase
          .from("campaigns")
          .update({ status: 'paused' })
          .eq("id", id);
      } catch {
        saveFallbackCampaign(campaign);
      }

      await supabase.from("memories").insert({
        user_id: user.id,
        agent_label: "CAMPAIGN_RUNNER",
        type: "task",
        content: `Paused outreach sequence for campaign "${campaign.name}"`,
      });

      return NextResponse.json({ success: true, data: campaign });

    } else if (action === 'duplicate') {
      const duplicateId = "camp_" + Math.random().toString(36).substring(2, 9);
      const duplicatedCampaign: Campaign = {
        ...campaign,
        id: duplicateId,
        name: `${campaign.name} (Copy)`,
        status: 'draft',
        created_at: new Date().toISOString(),
        leads_sent: 0,
        leads_replied: 0
      };

      try {
        const { error } = await supabase
          .from("campaigns")
          .insert(duplicatedCampaign);
        if (error) throw error;
      } catch {
        saveFallbackCampaign(duplicatedCampaign);
      }

      // Also duplicate leads
      let originalLeads = [];
      try {
        const { data } = await supabase
          .from("campaign_leads")
          .select("*")
          .eq("campaign_id", id);
        originalLeads = data || [];
      } catch {
        originalLeads = getFallbackCampaignLeads(id);
      }

      originalLeads.forEach((lead: any, idx: number) => {
        const dupLead = {
          ...lead,
          id: `clead_${duplicateId}_${idx}`,
          campaign_id: duplicateId,
          status: 'pending',
          sent_at: undefined,
          replied_at: undefined
        };
        try {
          supabase.from("campaign_leads").insert(dupLead);
        } catch {
          saveFallbackCampaignLead(dupLead);
        }
      });

      // Also duplicate AB tests
      let originalAB = [];
      try {
        const { data } = await supabase
          .from("ab_tests")
          .select("*")
          .eq("campaign_id", id);
        originalAB = data || [];
      } catch {
        originalAB = getFallbackABTests(id);
      }

      originalAB.forEach((ab: any) => {
        const dupAB = {
          ...ab,
          id: "ab_" + Math.random().toString(36).substring(2, 9),
          campaign_id: duplicateId,
          sent_count: 0,
          reply_count: 0
        };
        try {
          supabase.from("ab_tests").insert(dupAB);
        } catch {
          saveFallbackABTest(dupAB);
        }
      });

      return NextResponse.json({ success: true, data: duplicatedCampaign });
    }

    return NextResponse.json({ success: false, error: { message: "Invalid action" } }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  }
}
