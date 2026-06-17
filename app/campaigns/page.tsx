"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { TopNav } from '@/components/layout/TopNav';
import { 
  Megaphone, Plus, Search, Play, Pause, Trash2, Copy, 
  ArrowUpRight, Users, Mail, AlertTriangle
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
  created_at: string;
  leads_total: number;
  leads_sent: number;
  leads_replied: number;
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusTab, setStatusTab] = useState("all");

  const fetchCampaigns = async () => {
    try {
      const res = await fetch(`/api/campaigns?status=${statusTab}&query=${searchQuery}`);
      const json = await res.json();
      if (json.success) {
        setCampaigns(json.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, [statusTab, searchQuery]);

  const toggleStatus = async (id: string, current: string) => {
    const action = current === 'active' ? 'pause' : 'start';
    try {
      const res = await fetch(`/api/campaigns/${id}/${action}`, { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        await fetchCampaigns();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      const res = await fetch(`/api/campaigns/${id}/duplicate`, { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        await fetchCampaigns();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this campaign?")) return;
    try {
      const res = await fetch(`/api/campaigns/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        await fetchCampaigns();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredCampaigns = campaigns.filter(c => {
    if (statusTab !== 'all' && c.status !== statusTab) return false;
    if (searchQuery && !c.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-background relative overflow-hidden">
      <TopNav title="Campaigns Center" tabs={['Overview']} activeTab="Overview" />

      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-[1600px] mx-auto space-y-6">
          {/* Header section */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold font-sans tracking-tight text-on-surface">Prospecting Campaigns</h2>
              <p className="text-sm font-mono text-on-surface-variant mt-1">Deploy automated pipelines to hunt, enrich, and contact local businesses</p>
            </div>
            <Link
              href="/campaigns/new"
              className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary-fixed hover:brightness-110 rounded-md font-mono text-xs uppercase tracking-wider transition-all"
            >
              <Plus size={14} />
              New Campaign
            </Link>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-surface-elevated/40 border border-cyber-border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                <input
                  type="text"
                  placeholder="Search campaigns..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-surface-container border border-cyber-border rounded-lg pl-9 pr-4 py-2 text-sm text-on-surface outline-none focus:border-primary w-64 font-mono"
                />
              </div>

              <div className="flex bg-surface-container border border-cyber-border rounded-lg p-1">
                {['all', 'active', 'paused', 'completed', 'draft'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setStatusTab(tab)}
                    className={`px-3 py-1 rounded-md text-xs font-mono uppercase tracking-wider transition-colors ${
                      statusTab === tab ? 'bg-primary text-on-primary-fixed font-bold' : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Grid list */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="glass-panel border-surface-border p-5 space-y-5 animate-pulse flex flex-col justify-between bg-surface/5">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="h-4 bg-surface-border rounded w-16" />
                      <div className="flex gap-2">
                        <div className="w-6 h-6 rounded bg-surface-border" />
                        <div className="w-6 h-6 rounded bg-surface-border" />
                        <div className="w-6 h-6 rounded bg-surface-border" />
                      </div>
                    </div>
                    <div className="h-5 bg-surface-border rounded w-2/3" />
                    <div className="h-3 bg-surface-border rounded w-full" />
                    <div className="h-3 bg-surface-border rounded w-4/5" />
                  </div>
                  <div className="space-y-2 mt-4">
                    <div className="h-3 bg-surface-border rounded w-1/4" />
                    <div className="w-full bg-surface-border h-1.5 rounded-full" />
                  </div>
                  <div className="border-t border-cyber-border/20 pt-4 grid grid-cols-2 gap-3 mt-6">
                    <div className="h-10 bg-surface-border rounded" />
                    <div className="h-10 bg-surface-border rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredCampaigns.length === 0 ? (
            <div className="p-16 glass-panel border border-primary/20 text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Megaphone className="text-primary" size={28} />
              </div>
              <h3 className="text-lg font-bold text-on-surface">No campaigns found</h3>
              <p className="text-on-surface-variant text-sm mt-1 max-w-sm">Create a campaign to automatically fetch leads, run accessibility audits, and schedule outbound outreach sequences.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCampaigns.map((c) => {
                const percent = c.leads_total > 0 ? Math.round((c.leads_sent / c.leads_total) * 100) : 0;
                const replyRate = c.leads_sent > 0 ? Math.round((c.leads_replied / c.leads_sent) * 100) : 0;

                return (
                  <div key={c.id} className="glass-panel border-surface-border p-5 flex flex-col justify-between hover:border-cyber-border-highlight transition-all">
                    <div>
                      {/* Badge / Status */}
                      <div className="flex justify-between items-center mb-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold border ${
                          c.status === 'active' ? 'text-primary border-primary/20 bg-primary/10' :
                          c.status === 'paused' ? 'text-warning border-warning/20 bg-warning/10' :
                          c.status === 'completed' ? 'text-secondary border-secondary/20 bg-secondary/10' :
                          'text-on-surface-variant border-cyber-border'
                        }`}>
                          {c.status}
                        </span>

                        <div className="flex gap-2">
                          <button
                            onClick={() => toggleStatus(c.id, c.status)}
                            className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded transition-colors"
                            title={c.status === 'active' ? 'Pause Campaign' : 'Resume Campaign'}
                          >
                            {c.status === 'active' ? <Pause size={14} /> : <Play size={14} />}
                          </button>
                          <button
                            onClick={() => handleDuplicate(c.id)}
                            className="p-1.5 text-on-surface-variant hover:text-secondary hover:bg-secondary/10 rounded transition-colors"
                            title="Duplicate Campaign"
                          >
                            <Copy size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(c.id)}
                            className="p-1.5 text-on-surface-variant hover:text-error hover:bg-error/10 rounded transition-colors"
                            title="Delete Campaign"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Content */}
                      <h3 className="font-bold text-on-surface text-base mb-1 line-clamp-1">{c.name}</h3>
                      <p className="text-on-surface-variant text-xs mb-4 line-clamp-2 h-8">{c.description || 'No description provided.'}</p>

                      {/* Progress Bar */}
                      <div className="space-y-1.5 mb-6">
                        <div className="flex justify-between font-mono text-[10px] text-on-surface-variant">
                          <span>Outreach sent</span>
                          <span className="text-primary font-bold">{c.leads_sent} / {c.leads_total} ({percent}%)</span>
                        </div>
                        <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary transition-all"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Stats summary */}
                    <div className="border-t border-cyber-border/40 pt-4 grid grid-cols-2 gap-3 mt-auto">
                      <div className="bg-surface-elevated/40 border border-cyber-border rounded p-2 text-center">
                        <div className="text-xs text-on-surface-variant font-mono uppercase tracking-wider mb-0.5">Replies</div>
                        <div className="text-sm font-mono text-on-surface font-bold">{c.leads_replied} <span className="text-[10px] text-primary">({replyRate}%)</span></div>
                      </div>
                      <Link
                        href={`/campaigns/${c.id}`}
                        className="bg-surface-elevated/40 border border-cyber-border rounded p-2 text-center hover:border-primary transition-all flex flex-col justify-center items-center group cursor-pointer"
                      >
                        <div className="text-xs text-on-surface-variant font-mono uppercase tracking-wider mb-0.5 flex items-center gap-0.5">
                          View details <ArrowUpRight size={11} className="group-hover:translate-x-0.5 transition-transform" />
                        </div>
                        <div className="text-xs font-mono text-primary font-bold">Launch HUD</div>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
