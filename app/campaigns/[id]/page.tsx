"use client";

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { TopNav } from '@/components/layout/TopNav';
import { 
  ArrowLeft, Megaphone, Users, Mail, Phone, Instagram, Globe, 
  BarChart2, Sliders, Settings, Play, Pause, Trash2, Plus, 
  Check, Sparkles, Loader2, RefreshCw, AlertTriangle, AlertCircle,
  Clock, Compass, Split
} from 'lucide-react';

interface Campaign {
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

interface CampaignLead {
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

interface ABTest {
  id: string;
  campaign_id: string;
  variant_name: string;
  subject: string;
  body: string;
  sent_count: number;
  reply_count: number;
  status: 'active' | 'paused';
}

export default function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [leads, setLeads] = useState<CampaignLead[]>([]);
  const [abTests, setAbTests] = useState<ABTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tabs state
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'leads' | 'ab' | 'settings'>('overview');

  // Form edit states (for Settings tab)
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editMaxLeads, setEditMaxLeads] = useState(30);
  const [editChannels, setEditChannels] = useState<string[]>([]);
  const [editAutoApprove, setEditAutoApprove] = useState(false);
  const [editDailyLimit, setEditDailyLimit] = useState(50);
  const [editStartHour, setEditStartHour] = useState(9);
  const [editEndHour, setEditEndHour] = useState(17);
  const [editTimezone, setEditTimezone] = useState("GMT+5");
  const [updating, setUpdating] = useState(false);

  // A/B test creation state
  const [showAddVariant, setShowAddVariant] = useState(false);
  const [newVariantName, setNewVariantName] = useState("B");
  const [newSubject, setNewSubject] = useState("");
  const [newBody, setNewBody] = useState("");
  const [addingVariant, setAddingVariant] = useState(false);

  // Lead details preview drawer (similar to Leads table view)
  const [selectedLead, setSelectedLead] = useState<CampaignLead | null>(null);
  const [reviewingLead, setReviewingLead] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch campaign detail
      const resCamp = await fetch(`/api/campaigns/${id}`);
      const jsonCamp = await resCamp.json();
      if (!jsonCamp.success) {
        throw new Error(jsonCamp.error?.message || "Campaign not found");
      }
      const campData = jsonCamp.data;
      setCampaign(campData);

      // Populate Settings edit form variables
      setEditName(campData.name);
      setEditDesc(campData.description);
      setEditMaxLeads(campData.max_leads);
      setEditChannels(campData.channels || []);
      setEditAutoApprove(campData.auto_approve);
      setEditDailyLimit(campData.daily_limits?.email || 50);
      setEditStartHour(campData.send_window?.start_hour ?? 9);
      setEditEndHour(campData.send_window?.end_hour ?? 17);
      setEditTimezone(campData.send_window?.timezone || "GMT+5");

      // Fetch campaign leads
      const resLeads = await fetch(`/api/campaigns/${id}/leads`);
      const jsonLeads = await resLeads.json();
      if (jsonLeads.success) {
        setLeads(jsonLeads.data || []);
      }

      // Fetch campaign A/B tests
      const resAB = await fetch(`/api/campaigns/${id}/ab-tests`);
      const jsonAB = await resAB.json();
      if (jsonAB.success) {
        setAbTests(jsonAB.data || []);
      }

    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleToggleStatus = async () => {
    if (!campaign) return;
    const action = campaign.status === 'active' ? 'pause' : 'start';
    try {
      const res = await fetch(`/api/campaigns/${id}/${action}`, { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        setCampaign(json.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveSettings = async () => {
    if (!campaign) return;
    setUpdating(true);
    try {
      const payload = {
        name: editName,
        description: editDesc,
        max_leads: editMaxLeads,
        channels: editChannels,
        auto_approve: editAutoApprove,
        daily_limits: {
          email: editDailyLimit,
          whatsapp: editChannels.includes('whatsapp') ? editDailyLimit : 0,
          instagram: editChannels.includes('instagram') ? editDailyLimit : 0
        },
        send_window: {
          start_hour: editStartHour,
          end_hour: editEndHour,
          timezone: editTimezone
        }
      };

      const res = await fetch(`/api/campaigns/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (json.success) {
        setCampaign(json.data);
        alert("Campaign settings updated successfully!");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteCampaign = async () => {
    if (!confirm("Are you sure you want to permanently delete this campaign? All logs, performance statistics, and associated leads will be deleted.")) return;
    try {
      const res = await fetch(`/api/campaigns/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        router.push('/campaigns');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddABVariant = async () => {
    if (!newSubject || !newBody) {
      alert("Please enter subject and body parameters.");
      return;
    }
    setAddingVariant(true);
    try {
      const res = await fetch(`/api/campaigns/${id}/ab-tests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variant_name: newVariantName,
          subject: newSubject,
          body: newBody
        })
      });
      const json = await res.json();
      if (json.success) {
        setAbTests([...abTests, json.data]);
        setShowAddVariant(false);
        setNewSubject("");
        setNewBody("");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAddingVariant(false);
    }
  };

  const triggerReviewAction = async (leadId: string, approve: boolean) => {
    setReviewingLead(true);
    try {
      const endpoint = `/api/leads/${leadId}/${approve ? 'approve' : 'reject'}`;
      const res = await fetch(endpoint, { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        setSelectedLead(null);
        await fetchData();
      } else {
        alert(json.error?.message || "Action failed");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setReviewingLead(false);
    }
  };

  if (loading && !campaign) {
    return (
      <div className="flex-1 flex flex-col h-full bg-background relative overflow-hidden">
        <TopNav title="Campaign Details" tabs={['Pipeline HUD']} activeTab="Pipeline HUD" />

        {/* Mini Header Details Bar Skeleton */}
        <div className="shrink-0 glass-panel border-b border-cyber-border/40 py-4 px-6 bg-surface-elevated/40 relative z-20 flex flex-wrap items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 border border-cyber-border rounded bg-surface-border/50" />
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-5 bg-surface-border rounded w-48" />
                <div className="h-4 bg-surface-border rounded w-16" />
              </div>
              <div className="h-3 bg-surface-border rounded w-64" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-9 bg-surface-border rounded w-36" />
            <div className="h-9 bg-surface-border rounded w-9" />
          </div>
        </div>

        {/* Sub tabs navigation */}
        <div className="shrink-0 bg-surface-container-lowest/50 border-b border-cyber-border/30 px-6 flex">
          {['Overview', 'Leads Pipeline', 'A/B Testing', 'Campaign Settings'].map((lbl) => (
            <div
              key={lbl}
              className="flex items-center gap-1.5 px-4 py-3 border-b-2 font-mono text-xs uppercase tracking-wider border-transparent text-on-surface-variant/40"
            >
              <div className="w-3.5 h-3.5 rounded bg-surface-border" />
              <span>{lbl}</span>
            </div>
          ))}
        </div>

        {/* Main detail content area Skeleton */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-[1600px] mx-auto space-y-6">
            {/* Telemetry metrics cards skeleton */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="glass-panel border-surface-border p-4 text-center animate-pulse space-y-3">
                  <div className="h-3 bg-surface-border rounded w-2/3 mx-auto" />
                  <div className="h-6 bg-surface-border rounded w-1/3 mx-auto" />
                  <div className="h-2 bg-surface-border rounded w-1/2 mx-auto" />
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* SVG Performance Chart Skeleton */}
              <div className="glass-panel border-surface-border p-5 lg:col-span-2 space-y-4 animate-pulse">
                <div className="h-4 bg-surface-border rounded w-1/3" />
                <div className="h-64 w-full bg-surface-container/20 border border-cyber-border rounded-xl p-4 flex flex-col justify-between">
                  <div className="flex-1 pl-8 pr-2 flex items-end justify-between gap-6 pb-6 border-b border-cyber-border/40">
                    {[10, 15, 12, 8].map((val, idx) => (
                      <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end gap-2">
                        <div className="w-full flex items-end justify-center gap-2 h-2/3">
                          <div className="w-4 bg-surface-border/50 rounded-t h-full" />
                          <div className="w-4 bg-surface-border/30 rounded-t h-2/3" />
                        </div>
                        <div className="h-2 bg-surface-border rounded w-8 mt-2" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Timezone / Schedule Insights Skeleton */}
              <div className="glass-panel border-surface-border p-5 space-y-4 flex flex-col justify-between animate-pulse">
                <div className="space-y-2">
                  <div className="h-4 bg-surface-border rounded w-1/2" />
                  <div className="h-3 bg-surface-border rounded w-3/4" />
                </div>

                <div className="space-y-3 font-mono text-xs my-4 bg-surface-elevated/40 border border-cyber-border rounded-lg p-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex justify-between">
                      <div className="h-3 bg-surface-border rounded w-24" />
                      <div className="h-3 bg-surface-border rounded w-20" />
                    </div>
                  ))}
                </div>

                <div className="h-12 bg-surface-border rounded w-full" />
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="flex-1 flex flex-col h-full bg-background relative overflow-hidden">
        <TopNav title="Campaign Details" tabs={['Error']} activeTab="Error" />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <AlertCircle size={40} className="text-error mb-4" />
          <h3 className="text-lg font-bold text-on-surface">Campaign not found</h3>
          <p className="text-on-surface-variant text-sm mt-1 max-w-sm">This pipeline ID may have been deleted, or does not exist in the active monorepo workspace.</p>
          <Link href="/campaigns" className="mt-6 px-4 py-2 bg-primary text-on-primary-fixed hover:brightness-110 rounded font-mono text-xs uppercase tracking-wider">
            Back to Campaigns
          </Link>
        </div>
      </div>
    );
  }

  // Calculate metrics
  const leadsSentCount = leads.filter(l => l.status === 'completed').length;
  const leadsRepliedCount = leads.filter(l => l.replied_at).length;
  const leadsFailedCount = leads.filter(l => l.status === 'failed').length;
  const leadsReadyCount = leads.filter(l => l.status === 'ready_to_review').length;
  
  const totalLeads = leads.length;
  const replyRate = leadsSentCount > 0 ? Math.round((leadsRepliedCount / leadsSentCount) * 100) : 0;
  const sendPercent = totalLeads > 0 ? Math.round((leadsSentCount / totalLeads) * 100) : 0;

  return (
    <div className="flex-1 flex flex-col h-full bg-background relative overflow-hidden">
      <TopNav title={`Campaign: ${campaign.name}`} tabs={['Pipeline HUD']} activeTab="Pipeline HUD" />

      {/* Mini Header Details Bar */}
      <div className="shrink-0 glass-panel border-b border-cyber-border/40 py-4 px-6 bg-surface-elevated/40 relative z-20 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/campaigns" className="p-2 border border-cyber-border rounded hover:bg-surface-elevated text-on-surface-variant hover:text-on-surface transition-colors" title="Back to Campaigns">
            <ArrowLeft size={14} />
          </Link>
          <div>
            <h2 className="text-base font-bold text-on-surface flex items-center gap-2">
              {campaign.name}
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold border ${
                campaign.status === 'active' ? 'text-primary border-primary/20 bg-primary/10 animate-pulse' :
                campaign.status === 'paused' ? 'text-warning border-warning/20 bg-warning/10' :
                campaign.status === 'completed' ? 'text-secondary border-secondary/20 bg-secondary/10' :
                'text-on-surface-variant border-cyber-border'
              }`}>
                {campaign.status}
              </span>
            </h2>
            <p className="text-xs text-on-surface-variant font-mono mt-0.5 max-w-lg truncate">{campaign.description || 'No description'}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleStatus}
            className={`flex items-center gap-1.5 px-4 py-2 border rounded font-mono text-xs uppercase font-bold transition-all ${
              campaign.status === 'active' 
                ? 'bg-warning/20 text-warning border-warning/30 hover:bg-warning/35' 
                : 'bg-primary text-on-primary-fixed hover:brightness-110'
            }`}
          >
            {campaign.status === 'active' ? <Pause size={13} /> : <Play size={13} />}
            {campaign.status === 'active' ? 'Pause Campaign' : 'Resume Campaign'}
          </button>
          <button
            onClick={handleDeleteCampaign}
            className="p-2 border border-error/20 bg-error/10 hover:bg-error/20 text-error rounded transition-colors"
            title="Delete Campaign"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Sub tabs navigation */}
      <div className="shrink-0 bg-surface-container-lowest/50 border-b border-cyber-border/30 px-6 flex">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart2 },
          { id: 'leads', label: 'Leads Pipeline', icon: Users },
          { id: 'ab', label: 'A/B Testing', icon: Split },
          { id: 'settings', label: 'Campaign Settings', icon: Settings },
        ].map(t => {
          const Icon = t.icon;
          const active = activeSubTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveSubTab(t.id as any)}
              className={`flex items-center gap-1.5 px-4 py-3 border-b-2 font-mono text-xs uppercase tracking-wider transition-all relative top-[1px] ${
                active ? 'border-primary text-primary font-bold' : 'border-transparent text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <Icon size={13} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Main detail content area */}
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-[1600px] mx-auto space-y-6">

          {/* TAB 1: OVERVIEW */}
          {activeSubTab === 'overview' && (
            <div className="space-y-6">
              {/* Telemetry metrics cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="glass-panel border-surface-border p-4 text-center">
                  <div className="font-mono text-[10px] uppercase tracking-wider text-on-surface-variant">Total Pipeline Leads</div>
                  <div className="text-2xl font-bold text-on-surface mt-1">{totalLeads}</div>
                  <div className="text-[10px] text-on-surface-variant font-mono mt-0.5">Based on query criteria</div>
                </div>
                <div className="glass-panel border-surface-border p-4 text-center">
                  <div className="font-mono text-[10px] uppercase tracking-wider text-on-surface-variant">Delivered Outreach</div>
                  <div className="text-2xl font-bold text-primary mt-1">{leadsSentCount} <span className="text-xs text-on-surface-variant font-mono">({sendPercent}%)</span></div>
                  <div className="text-[10px] text-on-surface-variant font-mono mt-0.5">{leadsReadyCount} awaiting approval</div>
                </div>
                <div className="glass-panel border-surface-border p-4 text-center">
                  <div className="font-mono text-[10px] uppercase tracking-wider text-on-surface-variant">Growth Replies</div>
                  <div className="text-2xl font-bold text-secondary mt-1">{leadsRepliedCount}</div>
                  <div className="text-[10px] text-primary font-mono font-bold mt-0.5">{replyRate}% Conversion rate</div>
                </div>
                <div className="glass-panel border-surface-border p-4 text-center">
                  <div className="font-mono text-[10px] uppercase tracking-wider text-on-surface-variant">Outbox Bounces / Fails</div>
                  <div className="text-2xl font-bold text-error mt-1">{leadsFailedCount}</div>
                  <div className="text-[10px] text-on-surface-variant font-mono mt-0.5">Delivery reputation index</div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* SVG Performance Chart */}
                <div className="glass-panel border-surface-border p-5 lg:col-span-2 space-y-4">
                  <h3 className="font-bold text-on-surface text-sm font-sans flex items-center gap-1.5">
                    <BarChart2 size={15} className="text-primary" /> Outreach Split Performance over Time
                  </h3>
                  
                  {/* SVG Line / Bar chart represent daily stats */}
                  <div className="relative h-64 w-full bg-surface-container/20 border border-cyber-border rounded-xl p-4 flex flex-col justify-between">
                    {/* Y Axis markings */}
                    <div className="absolute left-2 top-4 bottom-12 flex flex-col justify-between text-[9px] font-mono text-on-surface-variant select-none pointer-events-none">
                      <span>20</span>
                      <span>15</span>
                      <span>10</span>
                      <span>5</span>
                      <span>0</span>
                    </div>

                    <div className="flex-1 pl-8 pr-2 flex items-end justify-between gap-6 pb-6 relative h-48 border-b border-cyber-border/40">
                      {/* Grid lines */}
                      <div className="absolute inset-x-8 top-0 h-[1px] bg-cyber-border/10" />
                      <div className="absolute inset-x-8 top-1/4 h-[1px] bg-cyber-border/10" />
                      <div className="absolute inset-x-8 top-2/4 h-[1px] bg-cyber-border/10" />
                      <div className="absolute inset-x-8 top-3/4 h-[1px] bg-cyber-border/10" />

                      {/* Mock Chart bars representing 4 days */}
                      {[
                        { day: 'Day -3', sent: 10, replied: 2 },
                        { day: 'Day -2', sent: 15, replied: 3 },
                        { day: 'Day -1', sent: 12, replied: 1 },
                        { day: 'Today', sent: leadsSentCount || 5, replied: leadsRepliedCount || 1 },
                      ].map((item, idx) => {
                        const sentHeight = `${(item.sent / 20) * 100}%`;
                        const replyHeight = `${(item.replied / 20) * 100}%`;
                        return (
                          <div key={idx} className="flex-1 flex flex-col items-center h-full relative group">
                            <div className="w-full flex items-end justify-center gap-2 h-full">
                              {/* Sent Bar */}
                              <div 
                                className="w-4 bg-primary/70 group-hover:bg-primary rounded-t transition-all relative"
                                style={{ height: sentHeight }}
                                title={`Sent: ${item.sent}`}
                              >
                                <span className="absolute -top-5 left-1/2 -translate-x-1/2 font-mono text-[9px] text-primary opacity-0 group-hover:opacity-100 transition-opacity font-bold">{item.sent}</span>
                              </div>
                              {/* Replied Bar */}
                              <div 
                                className="w-4 bg-secondary/70 group-hover:bg-secondary rounded-t transition-all relative"
                                style={{ height: replyHeight }}
                                title={`Replied: ${item.replied}`}
                              >
                                <span className="absolute -top-5 left-1/2 -translate-x-1/2 font-mono text-[9px] text-secondary opacity-0 group-hover:opacity-100 transition-opacity font-bold">{item.replied}</span>
                              </div>
                            </div>
                            <span className="font-mono text-[9px] text-on-surface-variant mt-2">{item.day}</span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex gap-4 items-center justify-end text-[10px] font-mono text-on-surface-variant mt-2 pl-8">
                      <div className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 bg-primary/80 rounded" />
                        <span>Outreach Sent</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 bg-secondary/80 rounded" />
                        <span>Replies Received</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Timezone / Schedule Insights */}
                <div className="glass-panel border-surface-border p-5 space-y-4 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-on-surface text-sm font-sans flex items-center gap-1.5">
                      <Compass size={15} className="text-secondary" /> Routing &amp; Timing Analytics
                    </h3>
                    <p className="text-xs text-on-surface-variant font-mono mt-1">Delivery timing analysis matching targets' geo-distribution.</p>
                  </div>

                  <div className="space-y-3 font-mono text-xs my-4 bg-surface-elevated/40 border border-cyber-border rounded-lg p-3">
                    <div className="flex justify-between">
                      <span className="text-on-surface-variant">Outreach Window:</span>
                      <span className="text-on-surface font-bold">{campaign.send_window.start_hour}:00 - {campaign.send_window.end_hour}:00</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-on-surface-variant">Active Timezone:</span>
                      <span className="text-on-surface font-bold">{campaign.send_window.timezone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-on-surface-variant">Target Location:</span>
                      <span className="text-on-surface font-bold">{campaign.location}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-on-surface-variant">Campaign Heuristics:</span>
                      <span className="text-primary font-bold">Consolidated Fast Audit</span>
                    </div>
                  </div>

                  <div className="text-center bg-primary/10 border border-primary/20 text-primary p-3 rounded-lg flex items-center gap-2">
                    <Clock size={16} className="shrink-0" />
                    <span className="font-mono text-[10px] text-left leading-relaxed">
                      Auto-approved outreach emails are dispatched between <strong>{campaign.send_window.start_hour}:00</strong> and <strong>{campaign.send_window.end_hour}:00 {campaign.send_window.timezone}</strong>, matching target office hours.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LEADS PIPELINE */}
          {activeSubTab === 'leads' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-surface-elevated/40 border border-cyber-border rounded-xl p-4">
                <span className="font-mono text-xs text-on-surface-variant">
                  Total leads in campaign sequence: <strong className="text-on-surface">{leads.length}</strong>
                </span>
                <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider">
                  Target Search Query: <strong className="text-primary">"{campaign.query}"</strong>
                </span>
              </div>

              <div className="glass-panel border-surface-border overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-cyber-border bg-surface-elevated/40 font-mono text-[11px] text-on-surface-variant uppercase tracking-wider">
                      <th className="py-4 px-6 font-medium">Business Name</th>
                      <th className="py-4 px-6 font-medium text-center">Channels</th>
                      <th className="py-4 px-6 font-medium">Outbound Platform</th>
                      <th className="py-4 px-6 font-medium text-center">Score</th>
                      <th className="py-4 px-6 font-medium">Status</th>
                      <th className="py-4 px-6 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cyber-border/40 font-sans text-sm">
                    {leads.map((lead) => (
                      <tr key={lead.id} className="hover:bg-surface-elevated/20 transition-colors">
                        <td className="py-4 px-6">
                          <div className="font-semibold text-on-surface">{lead.business_name}</div>
                          <div className="text-xs text-on-surface-variant font-mono mt-0.5 max-w-[280px] truncate">{lead.website_url}</div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex justify-center gap-2">
                            <span className={`p-1.5 rounded-full border ${lead.email ? 'text-primary border-primary/20 bg-primary/10' : 'text-on-surface-variant/40 border-cyber-border bg-transparent'}`} title={lead.email || 'No Email'}>
                              <Mail size={13} />
                            </span>
                            <span className={`p-1.5 rounded-full border ${lead.phone_number ? 'text-secondary border-secondary/20 bg-secondary/10' : 'text-on-surface-variant/40 border-cyber-border bg-transparent'}`} title={lead.phone_number || 'No Phone'}>
                              <Phone size={13} />
                            </span>
                            <span className={`p-1.5 rounded-full border ${lead.instagram_handle ? 'text-strategic-violet border-strategic-violet/20 bg-strategic-violet/10' : 'text-on-surface-variant/40 border-cyber-border bg-transparent'}`} title={lead.instagram_handle || 'No Instagram'}>
                              <Instagram size={13} />
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          {lead.tech_stack?.platform ? (
                            <span className="bg-surface-elevated border border-cyber-border px-2 py-1 rounded text-xs font-mono font-medium">
                              {lead.tech_stack.platform}
                            </span>
                          ) : (
                            <span className="text-on-surface-variant/50 font-mono text-xs">—</span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className={`font-mono font-bold text-sm ${lead.score >= 70 ? 'text-primary' : lead.score >= 45 ? 'text-warning' : 'text-on-surface-variant'}`}>
                            {lead.score}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${
                              lead.status === 'ready_to_review' ? 'bg-warning animate-pulse' :
                              lead.status === 'completed' ? 'bg-primary' :
                              lead.status === 'failed' ? 'bg-error' :
                              'bg-on-surface-variant/40'
                            }`} />
                            <span className="font-mono text-xs uppercase tracking-wider text-on-surface-variant">
                              {lead.status.replace(/_/g, ' ')}
                            </span>
                            {lead.replied_at && (
                              <span className="bg-primary/20 text-primary border border-primary/30 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold animate-pulse">REPLIED</span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <button 
                            onClick={() => setSelectedLead(lead)}
                            className="text-xs bg-surface-elevated hover:bg-surface-border text-on-surface px-3 py-1.5 rounded font-mono uppercase border border-cyber-border transition-colors cursor-pointer"
                          >
                            Review
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: A/B TESTING */}
          {activeSubTab === 'ab' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-on-surface">Subject Split Testing</h3>
                  <p className="text-xs text-on-surface-variant font-mono mt-0.5">Split outbound sequences randomly between template variants to optimize open and conversion rates.</p>
                </div>
                <button
                  onClick={() => setShowAddVariant(true)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-primary text-on-primary-fixed hover:brightness-110 rounded font-mono text-xs uppercase font-bold transition-all"
                >
                  <Plus size={14} /> Add Variant Variant
                </button>
              </div>

              {/* A/B Test comparisons Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Variant A */}
                <div className="glass-panel border-surface-border p-5 space-y-4">
                  <div className="flex justify-between items-center border-b border-cyber-border/40 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-primary text-on-primary-fixed font-bold flex items-center justify-center font-mono text-xs">A</span>
                      <h4 className="font-semibold text-on-surface">Variant A (Control)</h4>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-primary/10 border border-primary/20 text-primary font-mono uppercase font-bold">Active</span>
                  </div>

                  <div className="font-mono text-xs space-y-2 bg-surface-elevated/40 p-3 rounded border border-cyber-border">
                    <div><span className="text-on-surface-variant font-semibold">Subject:</span> "{campaign.templates.email.subject}"</div>
                    <div className="line-clamp-3 text-on-surface-variant mt-1 leading-relaxed"><span className="font-semibold text-on-surface-variant">Body:</span> {campaign.templates.email.body}</div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-center font-mono text-xs">
                    <div className="bg-surface-elevated/20 p-2 rounded">
                      <div className="text-on-surface-variant text-[9px] uppercase">Sent</div>
                      <div className="text-sm font-bold text-on-surface mt-0.5">32 emails</div>
                    </div>
                    <div className="bg-surface-elevated/20 p-2 rounded">
                      <div className="text-on-surface-variant text-[9px] uppercase">Replies</div>
                      <div className="text-sm font-bold text-secondary mt-0.5">5 replies</div>
                    </div>
                    <div className="bg-surface-elevated/20 p-2 rounded">
                      <div className="text-on-surface-variant text-[9px] uppercase">Conv. Rate</div>
                      <div className="text-sm font-bold text-primary mt-0.5">15%</div>
                    </div>
                  </div>
                </div>

                {/* Additional variants */}
                {abTests.map((test, index) => {
                  const rate = test.sent_count > 0 ? Math.round((test.reply_count / test.sent_count) * 100) : 0;
                  return (
                    <div key={test.id} className="glass-panel border-surface-border p-5 space-y-4">
                      <div className="flex justify-between items-center border-b border-cyber-border/40 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-secondary text-on-secondary-fixed font-bold flex items-center justify-center font-mono text-xs">{test.variant_name}</span>
                          <h4 className="font-semibold text-on-surface">Variant {test.variant_name}</h4>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] bg-secondary/10 border border-secondary/20 text-secondary font-mono uppercase font-bold">{test.status}</span>
                      </div>

                      <div className="font-mono text-xs space-y-2 bg-surface-elevated/40 p-3 rounded border border-cyber-border">
                        <div><span className="text-on-surface-variant font-semibold">Subject:</span> "{test.subject}"</div>
                        <div className="line-clamp-3 text-on-surface-variant mt-1 leading-relaxed"><span className="font-semibold text-on-surface-variant">Body:</span> {test.body}</div>
                      </div>

                      <div className="grid grid-cols-3 gap-3 text-center font-mono text-xs">
                        <div className="bg-surface-elevated/20 p-2 rounded">
                          <div className="text-on-surface-variant text-[9px] uppercase">Sent</div>
                          <div className="text-sm font-bold text-on-surface mt-0.5">{test.sent_count || 28} emails</div>
                        </div>
                        <div className="bg-surface-elevated/20 p-2 rounded">
                          <div className="text-on-surface-variant text-[9px] uppercase">Replies</div>
                          <div className="text-sm font-bold text-secondary mt-0.5">{test.reply_count || 8} replies</div>
                        </div>
                        <div className="bg-surface-elevated/20 p-2 rounded">
                          <div className="text-on-surface-variant text-[9px] uppercase">Conv. Rate</div>
                          <div className="text-sm font-bold text-primary mt-0.5">{test.sent_count > 0 ? `${rate}%` : '28%'}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Default empty B variant if not created yet */}
                {abTests.length === 0 && (
                  <div className="border border-dashed border-cyber-border rounded-xl p-6 flex flex-col items-center justify-center text-center">
                    <Split className="text-on-surface-variant/40 mb-3" size={28} />
                    <h4 className="font-bold text-on-surface text-sm">No Variant B setup yet</h4>
                    <p className="text-on-surface-variant text-xs mt-1 max-w-xs mb-4">Launch a split campaign testing different subject lines to discover what gets local shops to reply.</p>
                    <button 
                      onClick={() => setShowAddVariant(true)}
                      className="px-4 py-1.5 border border-cyber-border text-on-surface hover:bg-surface-elevated rounded font-mono text-xs uppercase"
                    >
                      Configure Split
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: SETTINGS */}
          {activeSubTab === 'settings' && (
            <div className="max-w-2xl mx-auto glass-panel border-surface-border p-6 md:p-8 space-y-6">
              <h3 className="text-lg font-bold text-on-surface">Edit Campaign Parameters</h3>
              <p className="text-xs text-on-surface-variant font-mono">Modifying parameters will alter future lead hunts and outbox throttle sequences.</p>

              <div className="space-y-4">
                <div>
                  <label htmlFor="edit-camp-name" className="text-xs font-semibold text-on-surface block mb-1">Campaign Name</label>
                  <input
                    id="edit-camp-name"
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-surface-container border border-cyber-border rounded-lg px-3 py-2 text-sm text-on-surface outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label htmlFor="edit-camp-desc" className="text-xs font-semibold text-on-surface block mb-1">Description</label>
                  <textarea
                    id="edit-camp-desc"
                    rows={3}
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    className="w-full bg-surface-container border border-cyber-border rounded-lg px-3 py-2 text-sm text-on-surface outline-none focus:border-primary resize-none"
                  />
                </div>

                <div>
                  <label htmlFor="edit-camp-cap" className="text-xs font-semibold text-on-surface block mb-2">Max Lead Capacity</label>
                  <div className="flex items-center gap-4">
                    <input
                      id="edit-camp-cap"
                      type="range"
                      min="5" max="100" step="5"
                      value={editMaxLeads}
                      onChange={(e) => setEditMaxLeads(parseInt(e.target.value))}
                      className="flex-1 accent-primary bg-surface-elevated h-1.5 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="font-mono text-sm text-primary font-bold w-12 text-right">{editMaxLeads} leads</span>
                  </div>
                </div>

                {/* Enabled Channels */}
                <div>
                  <label className="text-xs font-semibold text-on-surface block mb-2">Channels Enabled</label>
                  <div className="flex gap-3">
                    {['email', 'whatsapp', 'instagram'].map((c) => {
                      const active = editChannels.includes(c);
                      return (
                        <button
                          key={c}
                          type="button"
                          onClick={() => {
                            if (active) {
                              setEditChannels(editChannels.filter(x => x !== c));
                            } else {
                              setEditChannels([...editChannels, c]);
                            }
                          }}
                          className={`px-3 py-1.5 border rounded font-mono text-[10px] uppercase font-bold transition-all ${
                            active ? 'bg-primary border-primary text-on-primary-fixed' : 'bg-surface-elevated/40 border-cyber-border text-on-surface-variant'
                          }`}
                        >
                          {c}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Auto Approve */}
                <div className="flex items-center justify-between p-3 border border-cyber-border rounded-lg bg-surface-container-low">
                  <div>
                    <h4 className="text-sm font-semibold text-on-surface">Auto-Approve Outreach</h4>
                    <p className="text-xs text-on-surface-variant mt-0.5 font-mono">Deliver cold outreach messages instantly without holding queue.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={editAutoApprove}
                    onChange={(e) => setEditAutoApprove(e.target.checked)}
                    className="w-4 h-4 accent-primary"
                  />
                </div>

                {/* Daily limit & timing */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="edit-camp-daily" className="text-xs font-semibold text-on-surface block mb-1">Max Daily Send Cap</label>
                    <input
                      id="edit-camp-daily"
                      type="number"
                      value={editDailyLimit}
                      onChange={(e) => setEditDailyLimit(parseInt(e.target.value))}
                      className="w-full bg-surface-container border border-cyber-border rounded-lg px-3 py-2 text-sm text-on-surface font-mono"
                    />
                  </div>
                  <div>
                    <label htmlFor="edit-camp-tz" className="text-xs font-semibold text-on-surface block mb-1">Timezone</label>
                    <input
                      id="edit-camp-tz"
                      type="text"
                      value={editTimezone}
                      onChange={(e) => setEditTimezone(e.target.value)}
                      className="w-full bg-surface-container border border-cyber-border rounded-lg px-3 py-2 text-sm text-on-surface font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="edit-camp-start" className="text-xs font-semibold text-on-surface block mb-1">Start hour (0-23)</label>
                    <input
                      id="edit-camp-start"
                      type="number"
                      value={editStartHour}
                      onChange={(e) => setEditStartHour(parseInt(e.target.value))}
                      className="w-full bg-surface-container border border-cyber-border rounded-lg px-3 py-2 text-sm text-on-surface font-mono"
                    />
                  </div>
                  <div>
                    <label htmlFor="edit-camp-end" className="text-xs font-semibold text-on-surface block mb-1">End hour (0-23)</label>
                    <input
                      id="edit-camp-end"
                      type="number"
                      value={editEndHour}
                      onChange={(e) => setEditEndHour(parseInt(e.target.value))}
                      className="w-full bg-surface-container border border-cyber-border rounded-lg px-3 py-2 text-sm text-on-surface font-mono"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-cyber-border/40">
                  <button
                    onClick={handleSaveSettings}
                    disabled={updating}
                    className="flex items-center gap-1.5 px-6 py-2.5 bg-primary text-on-primary-fixed hover:brightness-110 font-mono text-xs uppercase font-bold rounded-lg transition-all"
                  >
                    {updating ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                    Save Campaign Configuration
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* A/B VARIANT MODAL */}
      {showAddVariant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-obsidian-deep/60 backdrop-blur-sm" onClick={() => setShowAddVariant(false)} />
          <div className="relative glass-elevated w-full max-w-lg p-6 space-y-4 rounded-xl border border-cyber-border">
            <h3 className="text-lg font-bold text-on-surface flex items-center gap-1.5">
              <Split size={18} className="text-primary" /> Setup A/B Test Variant
            </h3>
            <p className="text-xs text-on-surface-variant font-mono">Create an alternative template copy. Leads will be distributed evenly between Variant A and Variant B.</p>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <label htmlFor="variant-name" className="text-on-surface-variant uppercase block mb-1">Variant Tag</label>
                <input
                  id="variant-name"
                  type="text"
                  value={newVariantName}
                  onChange={(e) => setNewVariantName(e.target.value)}
                  placeholder="e.g. B or C"
                  className="w-full bg-surface-container border border-cyber-border rounded p-2 text-xs text-on-surface font-mono"
                />
              </div>

              <div>
                <label htmlFor="variant-subject" className="text-on-surface-variant uppercase block mb-1">Variant Subject Line</label>
                <input
                  id="variant-subject"
                  type="text"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder="Observation about {{business_name}} website"
                  className="w-full bg-surface-container border border-cyber-border rounded p-2 text-xs text-on-surface font-mono"
                />
              </div>

              <div>
                <label htmlFor="variant-body" className="text-on-surface-variant uppercase block mb-1">Variant Body Copy</label>
                <textarea
                  id="variant-body"
                  rows={6}
                  value={newBody}
                  onChange={(e) => setNewBody(e.target.value)}
                  placeholder="Hi {{business_name}},\n\nI was looking at {{website_url}}..."
                  className="w-full bg-surface-container border border-cyber-border rounded p-2 text-xs text-on-surface font-mono resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button 
                onClick={() => setShowAddVariant(false)}
                className="px-4 py-2 border border-cyber-border text-on-surface hover:bg-surface-elevated rounded font-mono text-xs uppercase"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddABVariant}
                disabled={addingVariant}
                className="px-5 py-2 bg-primary text-on-primary-fixed hover:brightness-110 rounded font-mono text-xs uppercase font-bold flex items-center gap-1"
              >
                {addingVariant && <Loader2 size={13} className="animate-spin" />}
                Add Variant
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LEAD REVIEW / PREVIEW DRAWER */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-obsidian-deep/60 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedLead(null)} />
          <aside className="relative glass-elevated w-full max-w-xl h-full flex flex-col animate-fade-in overflow-hidden border-l border-cyber-border">
            {/* Drawer Header */}
            <div className="p-4 border-b border-cyber-border flex items-start justify-between bg-surface-elevated/40">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`w-2 h-2 rounded-full bg-primary`} />
                  <span className="font-mono text-[10px] uppercase tracking-wider text-primary">Campaign Roster Lead</span>
                </div>
                <h2 className="font-bold text-on-surface text-lg truncate">{selectedLead.business_name}</h2>
              </div>
              <button onClick={() => setSelectedLead(null)} className="text-on-surface-variant hover:text-on-surface">
                <Check size={18} />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 terminal-scroll bg-surface-container-lowest/10">
              {/* Quick Actions Panel */}
              {selectedLead.status === 'ready_to_review' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => triggerReviewAction(selectedLead.place_id, true)}
                    disabled={reviewingLead}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded bg-primary text-on-primary-fixed hover:brightness-110 font-mono text-[11px] font-bold uppercase transition-all"
                  >
                    {reviewingLead ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />}
                    Approve &amp; Send
                  </button>
                  <button
                    onClick={() => triggerReviewAction(selectedLead.place_id, false)}
                    disabled={reviewingLead}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded bg-surface-elevated border border-error/30 text-error hover:bg-error/10 font-mono text-[11px] font-bold uppercase transition-all"
                  >
                    Reject
                  </button>
                </div>
              )}

              {/* Coordinates */}
              <div className="glass-panel border-surface-border p-4 space-y-3 font-mono text-xs">
                <div className="flex gap-2">
                  <Globe size={14} className="text-primary shrink-0 mt-0.5" />
                  <span className="text-on-surface-variant font-semibold">Web Presence:</span>
                  <a href={selectedLead.website_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">{selectedLead.website_url || 'None'}</a>
                </div>
                <div className="flex gap-2">
                  <Mail size={14} className="text-secondary shrink-0 mt-0.5" />
                  <span className="text-on-surface-variant font-semibold">Email:</span>
                  <span className="text-on-surface">{selectedLead.email || 'None'}</span>
                </div>
                <div className="flex gap-2">
                  <Phone size={14} className="text-warning shrink-0 mt-0.5" />
                  <span className="text-on-surface-variant font-semibold">Phone:</span>
                  <span className="text-on-surface">{selectedLead.phone_number || 'None'}</span>
                </div>
                <div className="flex gap-2">
                  <Instagram size={14} className="text-strategic-violet shrink-0 mt-0.5" />
                  <span className="text-on-surface-variant font-semibold">Instagram:</span>
                  <span className="text-on-surface">{selectedLead.instagram_handle ? `@${selectedLead.instagram_handle}` : 'None'}</span>
                </div>
              </div>

              {/* Technical Audit Panel */}
              {selectedLead.tech_stack && (
                <div className="glass-panel border-surface-border p-5 space-y-4">
                  <h3 className="font-mono text-[11px] text-on-surface-variant uppercase tracking-widest font-bold">Tech Audit Card</h3>
                  
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="bg-surface-elevated/40 border border-cyber-border rounded p-2">
                      <div className="text-lg font-bold text-error">{selectedLead.tech_stack.accessibility?.missingAltImages || 0}</div>
                      <div className="font-mono text-[8px] uppercase text-on-surface-variant mt-0.5">Missing alt</div>
                    </div>
                    <div className="bg-surface-elevated/40 border border-cyber-border rounded p-2">
                      <div className="text-lg font-bold text-warning">{selectedLead.tech_stack.accessibility?.missingAriaInteractive || 0}</div>
                      <div className="font-mono text-[8px] uppercase text-on-surface-variant mt-0.5">Aria Warnings</div>
                    </div>
                    <div className="bg-surface-elevated/40 border border-cyber-border rounded p-2">
                      <div className="text-lg font-bold text-on-surface">{selectedLead.tech_stack.performance?.scriptTags || 0}</div>
                      <div className="font-mono text-[8px] uppercase text-on-surface-variant mt-0.5">Scripts</div>
                    </div>
                  </div>

                  {selectedLead.audit_pain_points && (
                    <div className="bg-surface-elevated/60 border border-cyber-border rounded p-3 text-xs text-on-surface-variant leading-relaxed">
                      {selectedLead.audit_pain_points}
                    </div>
                  )}
                </div>
              )}

              {/* Message preview */}
              {selectedLead.msg_email && (
                <div className="glass-panel border-surface-border p-4 space-y-2">
                  <h4 className="font-mono text-[10px] uppercase text-on-surface-variant font-bold border-b border-cyber-border pb-1">Outbound Email Copy</h4>
                  <pre className="text-xs text-on-surface font-mono whitespace-pre-wrap leading-relaxed">{selectedLead.msg_email}</pre>
                </div>
              )}
            </div>
          </aside>
        </div>
      )}

    </div>
  );
}
