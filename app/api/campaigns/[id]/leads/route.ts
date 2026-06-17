import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase/server';
import { getFallbackCampaignLeads, CampaignLead } from '@/lib/campaign/runner';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, user } = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ success: false, error: { message: "Unauthorized" } }, { status: 401 });
  }

  const { id } = await params;

  try {
    let leads: CampaignLead[] = [];
    try {
      const { data, error } = await supabase
        .from("campaign_leads")
        .select("*")
        .eq("campaign_id", id);
      if (!error && data) {
        leads = data;
      } else {
        leads = getFallbackCampaignLeads(id);
      }
    } catch {
      leads = getFallbackCampaignLeads(id);
    }

    return NextResponse.json({ success: true, data: leads });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  }
}
