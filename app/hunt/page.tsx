"use client";

import { useEffect, useState, useCallback } from 'react';
import { TopNav } from '@/components/layout/TopNav';
import { 
  Users, Mail, Search, Sparkles, Check, Database, Copy, X, Loader2, ExternalLink, MessageSquare, Briefcase
} from 'lucide-react';

interface Lead {
  id: string;
  place_id: string;
  business_name: string;
  website_url: string;
  phone_number: string;
  email: string;
  instagram_handle: string;
  has_email: boolean;
  has_whatsapp: boolean;
  has_instagram: boolean;
  msg_email: string | null;
  msg_whatsapp: string | null;
  msg_instagram: string | null;
  website_text_snippet: string;
  discovery_error: string | null;
  tech_stack: any;
  audit_pain_points: string | null;
  status: string;
  rating: string;
  user_rating_count: number;
  score: number;
  created_at: string;
  updated_at: string;
  replied_at: string | null;
}

export default function HuntCenterPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  const [selected, setSelected] = useState<Lead | null>(null);
  const [enriching, setEnriching] = useState(false);
  const [generatingBrain, setGeneratingBrain] = useState(false);
  
  const [emailEdit, setEmailEdit] = useState("");
  const [copiedText, setCopiedText] = useState(false);

  const fetchLeads = useCallback(async () => {
    try {
      const res = await fetch(`/api/leads?status=${statusFilter}&query=${searchQuery}`);
      const json = await res.json();
      if (json.success) {
        setLeads(json.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchQuery]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const openLeadDetails = (lead: Lead) => {
    setSelected(lead);
    setEmailEdit(lead.msg_email || "");
  };

  const handleEnrich = async (leadId: string) => {
    setEnriching(true);
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_id: leadId, action: 'enrich' })
      });
      const json = await res.json();
      if (json.success) {
        setSelected(json.data);
        await fetchLeads();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setEnriching(false);
    }
  };

  const handleBrain = async (leadId: string) => {
    setGeneratingBrain(true);
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_id: leadId, action: 'brain' })
      });
      const json = await res.json();
      if (json.success) {
        setSelected(json.data);
        setEmailEdit(json.data.msg_email || "");
        await fetchLeads();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingBrain(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(emailEdit);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background relative overflow-hidden">
      <TopNav title="Ultimate Hunt Center" tabs={['Pipeline Roster']} activeTab="Pipeline Roster" />

      <main className="flex-1 overflow-y-auto p-8 lg:p-12">
        <div className="max-w-[1400px] mx-auto space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-on-surface flex items-center gap-3">
                <Users className="text-strategic-violet" size={28} />
                Prospect Intelligence
              </h1>
              <p className="text-on-surface-variant mt-2 text-sm">Discover, enrich, and automatically draft hyper-personalized outreach.</p>
            </div>
            
            <div className="flex items-center gap-3 bg-surface-elevated/40 border border-cyber-border rounded-xl p-2 shadow-sm">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                <input
                  type="text"
                  placeholder="Search accounts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent border-none pl-9 pr-4 py-2 text-sm text-on-surface outline-none w-48 md:w-64 focus:ring-0"
                />
              </div>
              <div className="h-6 w-px bg-cyber-border mx-2" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent border-none py-2 px-3 text-sm text-on-surface-variant outline-none focus:ring-0 cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="ready_to_review">Ready</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          {/* Roster Table */}
          <div className="glass-panel border-surface-border overflow-hidden rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
            {loading ? (
              <div className="divide-y divide-cyber-border/20">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="p-6 animate-pulse flex items-center gap-6">
                    <div className="w-10 h-10 rounded-full bg-surface-elevated shrink-0" />
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-surface-border rounded w-1/4" />
                      <div className="h-3 bg-surface-border rounded w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : leads.length === 0 ? (
              <div className="p-20 text-center flex flex-col items-center">
                <div className="w-16 h-16 rounded-2xl bg-strategic-violet/10 border border-strategic-violet/20 flex items-center justify-center mb-4">
                  <Database className="text-strategic-violet" size={28} />
                </div>
                <h3 className="font-bold text-on-surface text-xl">Pipeline Empty</h3>
                <p className="text-on-surface-variant text-sm mt-2 max-w-sm">No accounts match your current filters. Start a new hunt to discover prospects.</p>
                <button className="mt-6 bg-surface-elevated border border-cyber-border px-6 py-2 rounded-lg text-sm font-medium hover:bg-surface-border transition-colors">
                  Run New Hunt
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                  <thead>
                    <tr className="border-b border-cyber-border/50 bg-surface-container-lowest/50 text-[11px] font-mono text-on-surface-variant uppercase tracking-wider">
                      <th className="py-4 px-6 font-medium">Company</th>
                      <th className="py-4 px-6 font-medium">Tech & Score</th>
                      <th className="py-4 px-6 font-medium">Contact</th>
                      <th className="py-4 px-6 font-medium">Status</th>
                      <th className="py-4 px-6 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cyber-border/30 text-sm">
                    {leads.map((lead) => (
                      <tr key={lead.id} className="hover:bg-surface-elevated/20 transition-colors group">
                        <td className="py-5 px-6">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-surface-elevated border border-cyber-border flex items-center justify-center shrink-0 text-on-surface font-bold">
                              {lead.business_name.substring(0, 1)}
                            </div>
                            <div>
                              <div className="font-semibold text-on-surface flex items-center gap-2">
                                {lead.business_name}
                              </div>
                              <a href={lead.website_url} target="_blank" rel="noopener noreferrer" className="text-xs text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1 mt-1">
                                {lead.website_url.replace(/^https?:\/\//, '')} <ExternalLink size={10} />
                              </a>
                            </div>
                          </div>
                        </td>
                        <td className="py-5 px-6">
                          <div className="flex flex-col gap-1.5">
                            {lead.tech_stack?.platform ? (
                              <span className="inline-flex items-center w-fit bg-surface-elevated border border-cyber-border px-2 py-0.5 rounded text-[10px] font-mono font-medium text-on-surface-variant">
                                {lead.tech_stack.platform}
                              </span>
                            ) : (
                              <span className="text-on-surface-variant/50 font-mono text-xs">—</span>
                            )}
                            <div className="flex items-center gap-1.5 text-xs">
                              <span className={`font-mono font-bold ${lead.score >= 70 ? 'text-primary' : lead.score >= 45 ? 'text-warning' : 'text-on-surface-variant'}`}>
                                {lead.score} / 100
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-5 px-6">
                          <div className="flex gap-2">
                            {lead.email ? (
                              <div className="flex items-center gap-1.5 text-xs text-on-surface bg-surface-elevated px-2 py-1 rounded-md border border-cyber-border">
                                <Mail size={12} className="text-on-surface-variant" /> {lead.email}
                              </div>
                            ) : (
                              <span className="text-on-surface-variant/50 text-xs italic">No email</span>
                            )}
                          </div>
                        </td>
                        <td className="py-5 px-6">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${
                              lead.status === 'ready_to_review' ? 'bg-primary' :
                              lead.status === 'completed' ? 'bg-strategic-violet' :
                              'bg-on-surface-variant/40'
                            }`} />
                            <span className="text-xs text-on-surface capitalize">
                              {lead.status.replace(/_/g, ' ')}
                            </span>
                          </div>
                        </td>
                        <td className="py-5 px-6 text-right">
                          <button 
                            onClick={() => openLeadDetails(lead)}
                            className="text-xs font-medium bg-surface-elevated hover:bg-surface-border text-on-surface px-4 py-2 rounded-lg border border-cyber-border transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                          >
                            Open Profile
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Slide-out Profile Drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-obsidian-deep/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setSelected(null)} />
          <aside className="relative glass-elevated w-full max-w-[600px] h-full flex flex-col animate-in slide-in-from-right duration-300 shadow-[-20px_0_40px_rgba(0,0,0,0.3)] border-l border-cyber-border">
            
            <div className="p-6 border-b border-cyber-border flex items-start justify-between bg-surface-elevated/20">
              <div className="flex gap-4 items-center">
                <div className="w-14 h-14 rounded-2xl bg-surface-elevated border border-cyber-border flex items-center justify-center text-xl font-bold text-on-surface shadow-inner">
                  {selected.business_name.substring(0, 1)}
                </div>
                <div>
                  <h2 className="font-bold text-on-surface text-xl">{selected.business_name}</h2>
                  <a href={selected.website_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1 mt-0.5">
                    {selected.website_url} <ExternalLink size={12} />
                  </a>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="p-2 rounded-full hover:bg-surface-elevated text-on-surface-variant transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-surface-container-lowest/30">
              
              {/* Action Ribbon */}
              <div className="flex gap-3">
                <button
                  onClick={() => handleEnrich(selected.place_id)}
                  disabled={enriching}
                  className="flex-1 py-3 rounded-xl bg-surface-elevated border border-cyber-border hover:border-primary text-on-surface text-sm font-semibold transition-all flex items-center justify-center gap-2"
                >
                  {enriching ? <Loader2 size={16} className="animate-spin" /> : <Database size={16} />}
                  Enrich Data
                </button>
                <button
                  onClick={() => handleBrain(selected.place_id)}
                  disabled={generatingBrain}
                  className="flex-[2] py-3 rounded-xl bg-primary text-on-primary-fixed hover:brightness-110 text-sm font-bold transition-all shadow-[0_0_20px_rgba(var(--primary-rgb),0.2)] flex items-center justify-center gap-2"
                >
                  {generatingBrain ? <Loader2 size={16} className="animate-spin text-black" /> : <Sparkles size={16} className="text-black" />}
                  Generate AI Outreach
                </button>
              </div>

              {/* Intelligence Summary */}
              <div>
                <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-on-surface-variant mb-4 flex items-center gap-2">
                  <Briefcase size={14} /> Intelligence Summary
                </h3>
                <div className="glass-panel p-5 border-surface-border grid grid-cols-2 gap-6">
                  <div>
                    <div className="text-[10px] uppercase font-mono text-on-surface-variant mb-1">Lead Score</div>
                    <div className="text-2xl font-bold text-primary">{selected.score}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-mono text-on-surface-variant mb-1">Tech Stack</div>
                    <div className="text-sm font-medium text-on-surface">{selected.tech_stack?.platform || 'Unknown'}</div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-[10px] uppercase font-mono text-on-surface-variant mb-2">Pain Points Discovered</div>
                    <p className="text-sm text-on-surface-variant leading-relaxed">
                      {selected.audit_pain_points || 'Run AI generation to uncover specific pain points from their digital presence.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* AI Draft */}
              {emailEdit && (
                <div>
                  <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-on-surface-variant mb-4 flex items-center gap-2">
                    <MessageSquare size={14} /> AI Crafted Draft
                  </h3>
                  <div className="glass-panel border-primary/20 overflow-hidden relative group">
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={handleCopy} className="p-2 bg-surface-elevated border border-cyber-border rounded-lg text-on-surface hover:text-primary transition-colors flex items-center gap-2 text-xs font-medium">
                        {copiedText ? <Check size={14} /> : <Copy size={14} />}
                        {copiedText ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <div className="p-5">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="px-2 py-1 bg-primary/10 text-primary text-[10px] font-mono font-bold rounded uppercase border border-primary/20">Hyper-Personalized</span>
                      </div>
                      <textarea
                        value={emailEdit}
                        onChange={(e) => setEmailEdit(e.target.value)}
                        className="w-full bg-transparent border-none text-sm text-on-surface leading-relaxed outline-none resize-none min-h-[250px]"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
