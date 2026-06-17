import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase/server';
import { 
  getFallbackCampaigns, 
  saveFallbackCampaign, 
  deleteFallbackCampaign, 
  Campaign 
} from '@/lib/campaign/runner';

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

    return NextResponse.json({ success: true, data: campaign });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, user } = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ success: false, error: { message: "Unauthorized" } }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    let campaign: Campaign | undefined;

    // Retrieve original first
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

    // Update keys
    const updatedCampaign: Campaign = {
      ...campaign,
      name: body.name ?? campaign.name,
      description: body.description ?? campaign.description,
      status: body.status ?? campaign.status,
      query: body.query ?? campaign.query,
      location: body.location ?? campaign.location,
      max_leads: body.max_leads ?? campaign.max_leads,
      channels: body.channels ?? campaign.channels,
      auto_approve: body.auto_approve ?? campaign.auto_approve,
      templates: body.templates ?? campaign.templates,
      daily_limits: body.daily_limits ?? campaign.daily_limits,
      send_window: body.send_window ?? campaign.send_window,
    };

    try {
      const { error } = await supabase
        .from("campaigns")
        .update(updatedCampaign)
        .eq("id", id);
      if (error) throw error;
    } catch {
      saveFallbackCampaign(updatedCampaign);
    }

    return NextResponse.json({ success: true, data: updatedCampaign });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, user } = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ success: false, error: { message: "Unauthorized" } }, { status: 401 });
  }

  const { id } = await params;

  try {
    try {
      const { error } = await supabase
        .from("campaigns")
        .delete()
        .eq("id", id);
      if (error) throw error;
    } catch {
      deleteFallbackCampaign(id);
    }

    await supabase.from("memories").insert({
      user_id: user.id,
      agent_label: "CAMPAIGN_RUNNER",
      type: "task",
      content: `Deleted campaign pipeline "${id}"`,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
  }
}
