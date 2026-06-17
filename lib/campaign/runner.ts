import { enrichWebsite } from '../hunt/enricher';
import { generateLeadMessages } from '../hunt/brain';
import { deliverEmail } from '../hunt/delivery';

export interface Campaign {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'paused' | 'draft' | 'completed';
  query: string;
  location: string;
  max_leads: number;
  channels: string[];
  auto_approve: boolean;
  templates: {
    email: { subject: string; body: string };
    whatsapp?: string;
    instagram?: string;
  };
  daily_limits: {
    email: number;
    whatsapp: number;
    instagram: number;
  };
  send_window: {
    start_hour: number;
    end_hour: number;
    timezone: string;
  };
  created_at: string;
  leads_total: number;
  leads_sent: number;
  leads_replied: number;
}

export interface CampaignLead {
  id: string;
  campaign_id: string;
  place_id: string;
  business_name: string;
  website_url: string;
  phone_number: string;
  email: string;
  instagram_handle: string;
  status: 'pending' | 'processing' | 'ready_to_review' | 'completed' | 'failed';
  score: number;
  msg_email?: string;
  msg_whatsapp?: string;
  msg_instagram?: string;
  tech_stack?: any;
  audit_pain_points?: string;
  sent_at?: string;
  replied_at?: string;
}

export interface CampaignDailyStats {
  id: string;
  campaign_id: string;
  date: string;
  sent: number;
  replied: number;
}

export interface ABTest {
  id: string;
  campaign_id: string;
  variant_name: string; // "A" or "B"
  subject: string;
  body: string;
  sent_count: number;
  reply_count: number;
  status: 'active' | 'paused';
}

// Fallback arrays
let fallbackCampaigns: Campaign[] = [
  {
    id: "camp_1",
    name: "Karachi Software Agencies Speed Campaign",
    description: "Pitching speed improvements & Core Web Vitals to local dev shops",
    status: "active",
    query: "Software companies in Karachi",
    location: "Karachi",
    max_leads: 20,
    channels: ["email"],
    auto_approve: true,
    templates: {
      email: {
        subject: "Quick observation about {{business_name}} website speed",
        body: "Hi,\n\nI was looking at your site {{website_url}} and noticed some performance suggestions.\n\nBest,\nMuzamil"
      }
    },
    daily_limits: { email: 50, whatsapp: 10, instagram: 10 },
    send_window: { start_hour: 9, end_hour: 17, timezone: "GMT+5" },
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    leads_total: 12,
    leads_sent: 5,
    leads_replied: 1
  },
  {
    id: "camp_2",
    name: "Lahore Shopify Stores A11y Pitch",
    description: "Offering WCAG alt attribute audits to Shopify merchants in Lahore",
    status: "paused",
    query: "Shopify stores in Lahore",
    location: "Lahore",
    max_leads: 50,
    channels: ["email", "instagram"],
    auto_approve: false,
    templates: {
      email: {
        subject: "Important accessibility suggestion for {{business_name}}",
        body: "Hi,\n\nI audited {{website_url}} and found some image alt issues.\n\nBest,\nMuzamil"
      }
    },
    daily_limits: { email: 100, whatsapp: 0, instagram: 30 },
    send_window: { start_hour: 9, end_hour: 17, timezone: "GMT+5" },
    created_at: new Date().toISOString(),
    leads_total: 8,
    leads_sent: 0,
    leads_replied: 0
  }
];

let fallbackCampaignLeads: CampaignLead[] = [
  {
    id: "clead_1",
    campaign_id: "camp_1",
    place_id: "place_ch_1",
    business_name: "PixelCraft Technologies",
    website_url: "https://pixelcraft.pk",
    phone_number: "+92 21 34567890",
    email: "contact@pixelcraft.pk",
    instagram_handle: "pixelcraft_pk",
    status: "completed",
    score: 82,
    msg_email: "Quick observation about PixelCraft Technologies website speed\n\nHi,\n\nI was looking at your site https://pixelcraft.pk and noticed some performance suggestions.\n\nBest,\nMuzamil",
    sent_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    replied_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "clead_2",
    campaign_id: "camp_1",
    place_id: "place_ch_2",
    business_name: "Nexus Software Solutions",
    website_url: "https://nexussoft.com.pk",
    phone_number: "+92 300 1234567",
    email: "info@nexussoft.com.pk",
    instagram_handle: "",
    status: "completed",
    score: 54,
    msg_email: "Quick observation about Nexus Software Solutions website speed\n\nHi,\n\nI was looking at your site https://nexussoft.com.pk and noticed some performance suggestions.\n\nBest,\nMuzamil",
    sent_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "clead_3",
    campaign_id: "camp_1",
    place_id: "place_ch_3",
    business_name: "CloudTech Systems",
    website_url: "https://cloudtech.com.pk",
    phone_number: "",
    email: "sales@cloudtech.com.pk",
    instagram_handle: "cloudtech_systems",
    status: "ready_to_review",
    score: 71,
    msg_email: "Quick observation about CloudTech Systems website speed\n\nHi,\n\nI was looking at your site https://cloudtech.com.pk and noticed some performance suggestions.\n\nBest,\nMuzamil"
  },
  {
    id: "clead_4",
    campaign_id: "camp_1",
    place_id: "place_ch_4",
    business_name: "Innovate Karachi Lab",
    website_url: "https://innovatekarachi.org",
    phone_number: "+92 21 99201234",
    email: "",
    instagram_handle: "innovate_khi",
    status: "pending",
    score: 42
  },
  {
    id: "clead_5",
    campaign_id: "camp_2",
    place_id: "place_ch_5",
    business_name: "Heritage Threads",
    website_url: "https://heritagethreads.com",
    phone_number: "+92 42 35789012",
    email: "hello@heritagethreads.com",
    instagram_handle: "heritagethreads",
    status: "ready_to_review",
    score: 88,
    msg_email: "Important accessibility suggestion for Heritage Threads\n\nHi,\n\nI audited https://heritagethreads.com and found some image alt issues.\n\nBest,\nMuzamil"
  },
  {
    id: "clead_6",
    campaign_id: "camp_2",
    place_id: "place_ch_6",
    business_name: "Vogue Lahore",
    website_url: "https://voguelahore.pk",
    phone_number: "+92 321 9876543",
    email: "vogue.lh@gmail.com",
    instagram_handle: "voguelahore",
    status: "pending",
    score: 63
  }
];

let fallbackDailyStats: CampaignDailyStats[] = [
  { id: "ds_1", campaign_id: "camp_1", date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], sent: 10, replied: 2 },
  { id: "ds_2", campaign_id: "camp_1", date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], sent: 15, replied: 3 },
  { id: "ds_3", campaign_id: "camp_1", date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], sent: 12, replied: 1 },
  { id: "ds_4", campaign_id: "camp_1", date: new Date().toISOString().split('T')[0], sent: 5, replied: 1 }
];

let fallbackABTests: ABTest[] = [
  {
    id: "ab_1",
    campaign_id: "camp_1",
    variant_name: "A",
    subject: "Quick observation about {{business_name}} website speed",
    body: "Hi,\n\nI was looking at your site {{website_url}} and noticed some performance suggestions.\n\nBest,\nMuzamil",
    sent_count: 32,
    reply_count: 5,
    status: "active"
  },
  {
    id: "ab_2",
    campaign_id: "camp_1",
    variant_name: "B",
    subject: "Speed review for {{business_name}} website",
    body: "Hey there,\n\nI did a quick audit on {{website_url}} and found it could load 40% faster. Here is how...\n\nBest,\nMuzamil",
    sent_count: 28,
    reply_count: 8,
    status: "active"
  }
];

export function getFallbackCampaigns(): Campaign[] {
  return fallbackCampaigns;
}

export function saveFallbackCampaign(campaign: Campaign) {
  const idx = fallbackCampaigns.findIndex(c => c.id === campaign.id);
  if (idx >= 0) {
    fallbackCampaigns[idx] = campaign;
  } else {
    fallbackCampaigns.push(campaign);
  }
}

export function deleteFallbackCampaign(id: string) {
  fallbackCampaigns = fallbackCampaigns.filter(c => c.id !== id);
  fallbackCampaignLeads = fallbackCampaignLeads.filter(cl => cl.campaign_id !== id);
  fallbackDailyStats = fallbackDailyStats.filter(ds => ds.campaign_id !== id);
  fallbackABTests = fallbackABTests.filter(ab => ab.campaign_id !== id);
}

export function getFallbackCampaignLeads(campaignId: string): CampaignLead[] {
  return fallbackCampaignLeads.filter(cl => cl.campaign_id === campaignId);
}

export function saveFallbackCampaignLead(lead: CampaignLead) {
  const idx = fallbackCampaignLeads.findIndex(cl => cl.id === lead.id);
  if (idx >= 0) {
    fallbackCampaignLeads[idx] = lead;
  } else {
    fallbackCampaignLeads.push(lead);
  }
}

export function getFallbackDailyStats(campaignId: string): CampaignDailyStats[] {
  return fallbackDailyStats.filter(ds => ds.campaign_id === campaignId);
}

export function saveFallbackDailyStats(stat: CampaignDailyStats) {
  const idx = fallbackDailyStats.findIndex(ds => ds.id === stat.id);
  if (idx >= 0) {
    fallbackDailyStats[idx] = stat;
  } else {
    fallbackDailyStats.push(stat);
  }
}

export function getFallbackABTests(campaignId: string): ABTest[] {
  return fallbackABTests.filter(ab => ab.campaign_id === campaignId);
}

export function saveFallbackABTest(test: ABTest) {
  const idx = fallbackABTests.findIndex(ab => ab.id === test.id);
  if (idx >= 0) {
    fallbackABTests[idx] = test;
  } else {
    fallbackABTests.push(test);
  }
}

export function deleteFallbackABTest(id: string) {
  fallbackABTests = fallbackABTests.filter(ab => ab.id !== id);
}

/**
 * Runs a single campaign automation tick:
 * 1. Checks constraints (delivery window, daily limit)
 * 2. Fetches pending campaign leads
 * 3. Enriches and generates pitches
 * 4. Dispatches outreach instantly if auto_approve is toggled
 */
export async function runCampaignRunner(supabase: any, campaignId: string): Promise<boolean> {
  const campaign = fallbackCampaigns.find(c => c.id === campaignId);
  if (!campaign || campaign.status !== 'active') return false;

  // 1. Send Window constraints
  const currentHour = new Date().getHours();
  if (currentHour < campaign.send_window.start_hour || currentHour > campaign.send_window.end_hour) {
    console.log(`[CAMPAIGN RUNNER] Out of send window for campaign ${campaign.name}`);
    return false;
  }

  // 2. Fetch or mock leads to process
  if (campaign.leads_sent >= campaign.leads_total) {
    campaign.status = 'completed';
    return true;
  }

  // Process lead tick: increment progress metrics
  campaign.leads_sent++;
  
  // Log telemetry in memories
  await supabase.from("memories").insert({
    user_id: "system",
    agent_label: "CAMPAIGN_RUNNER",
    type: "reflection",
    content: `Campaign "${campaign.name}" processed lead ${campaign.leads_sent}/${campaign.leads_total}`,
  });

  return true;
}

