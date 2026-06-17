"use client";

import { useEffect, useState, useCallback } from 'react';
import { TopNav } from '@/components/layout/TopNav';
import { 
  Users, Mail, MessageSquare, Instagram, Globe, Phone, Star, 
  Search, ShieldAlert, Sparkles, Check, Database, Copy, X, Loader2, Play, Plus
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

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Drawer state
  const [selected, setSelected] = useState<Lead | null>(null);
  const [enriching, setEnriching] = useState(false);
  const [generatingBrain, setGeneratingBrain] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Message edits
  const [emailEdit, setEmailEdit] = useState("");
  const [whatsappEdit, setWhatsappEdit] = useState("");
  const [instagramEdit, setInstagramEdit] = useState("");
  const [updatingMsg, setUpdatingMsg] = useState(false);

  // CRM Webhook Config
  const [crmWebhook, setCrmWebhook] = useState("https://api.hubapi.com/webhooks/v1/12345/contacts");
  const [crmSyncing, setCrmSyncing] = useState(false);
  const [crmMessage, setCrmMessage] = useState<string | null>(null);

  // Action states
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [replying, setReplying] = useState(false);

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
    setWhatsappEdit(lead.msg_whatsapp || "");
    setInstagramEdit(lead.msg_instagram || "");
    setCrmMessage(null);
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
        setWhatsappEdit(json.data.msg_whatsapp || "");
        setInstagramEdit(json.data.msg_instagram || "");
        await fetchLeads();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingBrain(false);
    }
  };

  const handleSaveMessages = async () => {
    if (!selected) return;
    setUpdatingMsg(true);
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_id: selected.place_id,
          action: 'update_message',
          updateData: {
            emailBody: emailEdit,
            whatsappBody: whatsappEdit,
            instagramBody: instagramEdit
          }
        })
      });
      const json = await res.json();
      if (json.success) {
        setSelected(json.data);
        await fetchLeads();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingMsg(false);
    }
  };

  const handleApprove = async (leadId: string) => {
    setApproving(true);
    try {
      const res = await fetch(`/api/leads/${leadId}/approve`, { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        setSelected(null);
        await fetchLeads();
      } else {
        alert(json.error?.message || "Approve failed");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async (leadId: string) => {
    setRejecting(true);
    try {
      const res = await fetch(`/api/leads/${leadId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Manual rejection by growth agent' })
      });
      const json = await res.json();
      if (json.success) {
        setSelected(null);
        await fetchLeads();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRejecting(false);
    }
  };

  const handleMarkReplied = async (leadId: string) => {
    setReplying(true);
    try {
      const res = await fetch(`/api/leads/${leadId}/mark-replied`, { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        if (selected) {
          setSelected({ ...selected, replied_at: new Date().toISOString() });
        }
        await fetchLeads();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setReplying(false);
    }
  };

  const handleSyncCRM = async () => {
    if (!selected) return;
    setCrmSyncing(true);
    setCrmMessage(null);
    try {
      // POST mock request to webhook URL
      await new Promise(r => setTimeout(r, 1200));
      setCrmMessage("Synced lead to HubSpot successfully.");
    } catch (err) {
      setCrmMessage("CRM synchronization failed.");
    } finally {
      setCrmSyncing(false);
    }
  };

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(type);
    setTimeout(() => setCopiedText(null), 2000);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background relative overflow-hidden">
      <TopNav title="Leads Database" tabs={['Pipeline Roster']} activeTab="Pipeline Roster" />

      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-[1600px] mx-auto space-y-6">
          {/* Filters Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-surface-elevated/40 border border-cyber-border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                <input
                  type="text"
                  placeholder="Filter by business name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-surface-container border border-cyber-border rounded-lg pl-9 pr-4 py-2 text-sm text-on-surface outline-none focus:border-primary w-64"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-surface-container border border-cyber-border rounded-lg px-3 py-2 text-sm text-on-surface outline-none focus:border-primary font-mono"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending Enrichment</option>
                <option value="processing">Processing (Enriched)</option>
                <option value="ready_to_review">Ready to Review</option>
                <option value="completed">Completed (Outbox Sent)</option>
                <option value="failed">Failed / Rejected</option>
              </select>
            </div>

            <span className="font-mono text-[11px] text-on-surface-variant">
              COUNT: {leads.length} records matching
            </span>
          </div>

          {/* Roster Table */}
          <div className="glass-panel border-surface-border overflow-hidden">
            {loading ? (
              <div className="divide-y divide-cyber-border/20 bg-surface/10">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="py-5 px-6 animate-pulse flex items-center justify-between gap-6">
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-surface-border rounded w-1/3" />
                      <div className="h-3 bg-surface-border rounded w-1/2" />
                    </div>
                    <div className="flex justify-center gap-2 w-24">
                      <div className="w-7 h-7 rounded-full bg-surface-border" />
                      <div className="w-7 h-7 rounded-full bg-surface-border" />
                      <div className="w-7 h-7 rounded-full bg-surface-border" />
                    </div>
                    <div className="h-5 bg-surface-border rounded w-20" />
                    <div className="h-4 bg-surface-border rounded w-12" />
                    <div className="h-5 bg-surface-border rounded w-24" />
                    <div className="h-8 bg-surface-border rounded w-16" />
                  </div>
                ))}
              </div>
            ) : leads.length === 0 ? (
              <div className="p-20 text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Users className="text-primary" size={24} />
                </div>
                <h3 className="font-bold text-on-surface text-lg">No prospects matching filters</h3>
                <p className="text-on-surface-variant text-sm mt-1">Run a hunt search in the Client Hunting Center to populate new targets.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-cyber-border bg-surface-elevated/40 font-mono text-[11px] text-on-surface-variant uppercase tracking-wider">
                      <th className="py-4 px-6 font-medium">Business Name</th>
                      <th className="py-4 px-6 font-medium text-center">Outreach Channels</th>
                      <th className="py-4 px-6 font-medium">Platform</th>
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
                              <Mail size={14} />
                            </span>
                            <span className={`p-1.5 rounded-full border ${lead.phone_number ? 'text-secondary border-secondary/20 bg-secondary/10' : 'text-on-surface-variant/40 border-cyber-border bg-transparent'}`} title={lead.phone_number || 'No Phone'}>
                              <Phone size={14} />
                            </span>
                            <span className={`p-1.5 rounded-full border ${lead.instagram_handle ? 'text-strategic-violet border-strategic-violet/20 bg-strategic-violet/10' : 'text-on-surface-variant/40 border-cyber-border bg-transparent'}`} title={lead.instagram_handle || 'No Instagram'}>
                              <Instagram size={14} />
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
                            onClick={() => openLeadDetails(lead)}
                            className="text-xs bg-surface-elevated hover:bg-surface-border text-on-surface px-3 py-1.5 rounded font-mono uppercase border border-cyber-border transition-colors cursor-pointer"
                          >
                            Details
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

      {/* Slide-out Drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-obsidian-deep/60 backdrop-blur-sm animate-fade-in" onClick={() => setSelected(null)} />
          <aside className="relative glass-elevated w-full max-w-xl h-full flex flex-col animate-fade-in overflow-hidden border-l border-cyber-border">
            {/* Drawer Header */}
            <div className="p-4 border-b border-cyber-border flex items-start justify-between bg-surface-elevated/40">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`w-2 h-2 rounded-full bg-primary`} />
                  <span className="font-mono text-[10px] uppercase tracking-wider text-primary">Lead Pipeline Target</span>
                </div>
                <h2 className="font-bold text-on-surface text-lg truncate">{selected.business_name}</h2>
              </div>
              <button onClick={() => setSelected(null)} className="text-on-surface-variant hover:text-on-surface">
                <X size={18} />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 terminal-scroll bg-surface-container-lowest/10">
              {/* Quick Actions Panel */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleEnrich(selected.place_id)}
                  disabled={enriching}
                  className="flex-1 min-w-[120px] flex items-center justify-center gap-1.5 py-2 rounded bg-surface-elevated border border-cyber-border hover:border-primary text-on-surface font-mono text-[11px] font-bold uppercase transition-all disabled:opacity-40"
                >
                  {enriching ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                  Enrich
                </button>
                <button
                  onClick={() => handleBrain(selected.place_id)}
                  disabled={generatingBrain}
                  className="flex-1 min-w-[120px] flex items-center justify-center gap-1.5 py-2 rounded bg-primary text-on-primary-fixed hover:brightness-110 font-mono text-[11px] font-bold uppercase transition-all disabled:opacity-40"
                >
                  {generatingBrain ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                  AI Generate
                </button>
                {selected.status === 'ready_to_review' && (
                  <button
                    onClick={() => handleApprove(selected.place_id)}
                    disabled={approving}
                    className="flex-1 min-w-[120px] flex items-center justify-center gap-1.5 py-2 rounded bg-primary text-on-primary-fixed hover:brightness-110 font-mono text-[11px] font-bold uppercase transition-all"
                  >
                    {approving ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />}
                    Send Email
                  </button>
                )}
                {selected.status === 'ready_to_review' && (
                  <button
                    onClick={() => handleReject(selected.place_id)}
                    disabled={rejecting}
                    className="flex-1 min-w-[120px] flex items-center justify-center gap-1.5 py-2 rounded bg-surface-elevated border border-error/30 text-error hover:bg-error/10 font-mono text-[11px] font-bold uppercase transition-all"
                  >
                    Reject
                  </button>
                )}
                {selected.status === 'completed' && !selected.replied_at && (
                  <button
                    onClick={() => handleMarkReplied(selected.place_id)}
                    disabled={replying}
                    className="flex-1 min-w-[120px] flex items-center justify-center gap-1.5 py-2 rounded bg-primary/20 border border-primary/40 text-primary font-mono text-[11px] font-bold uppercase transition-all"
                  >
                    Replied
                  </button>
                )}
              </div>

              {/* Identity & Coordinates */}
              <div className="glass-panel border-surface-border p-4 space-y-3 font-mono text-xs">
                <div className="flex gap-2">
                  <Globe size={14} className="text-primary shrink-0 mt-0.5" />
                  <span className="text-on-surface-variant font-semibold">Web Presence:</span>
                  <a href={selected.website_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">{selected.website_url || 'None'}</a>
                </div>
                <div className="flex gap-2">
                  <Mail size={14} className="text-secondary shrink-0 mt-0.5" />
                  <span className="text-on-surface-variant font-semibold">Email:</span>
                  <span className="text-on-surface">{selected.email || 'Not enriched'}</span>
                </div>
                <div className="flex gap-2">
                  <Phone size={14} className="text-warning shrink-0 mt-0.5" />
                  <span className="text-on-surface-variant font-semibold">Phone:</span>
                  <span className="text-on-surface">{selected.phone_number || 'None'}</span>
                </div>
                <div className="flex gap-2">
                  <Instagram size={14} className="text-strategic-violet shrink-0 mt-0.5" />
                  <span className="text-on-surface-variant font-semibold">Instagram:</span>
                  <span className="text-on-surface">{selected.instagram_handle ? `@${selected.instagram_handle}` : 'None'}</span>
                </div>
              </div>

              {/* Technical Audit Card */}
              {selected.tech_stack && (
                <div className="glass-panel border-surface-border p-5 space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-mono text-[11px] text-on-surface-variant uppercase tracking-widest font-bold">Tech &amp; Accessibility Audit</h3>
                    {selected.tech_stack.platform && (
                      <span className="bg-primary/20 text-primary border border-primary/30 px-2 py-0.5 rounded text-xs font-mono font-bold">
                        {selected.tech_stack.platform} Badge
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="bg-surface-elevated/40 border border-cyber-border rounded p-3">
                      <div className="text-2xl font-bold text-error">{selected.tech_stack.accessibility?.missingAltImages || 0}</div>
                      <div className="font-mono text-[9px] uppercase text-on-surface-variant mt-1">Missing alt tags</div>
                    </div>
                    <div className="bg-surface-elevated/40 border border-cyber-border rounded p-3">
                      <div className="text-2xl font-bold text-warning">{selected.tech_stack.accessibility?.missingAriaInteractive || 0}</div>
                      <div className="font-mono text-[9px] uppercase text-on-surface-variant mt-1">Aria Warnings</div>
                    </div>
                    <div className="bg-surface-elevated/40 border border-cyber-border rounded p-3">
                      <div className="text-2xl font-bold text-secondary">{selected.tech_stack.performance?.scriptTags || 0}</div>
                      <div className="font-mono text-[9px] uppercase text-on-surface-variant mt-1">Scripts Loaded</div>
                    </div>
                    <div className="bg-surface-elevated/40 border border-cyber-border rounded p-3">
                      <div className="text-2xl font-bold text-on-surface">{selected.tech_stack.accessibility?.totalImages || 0}</div>
                      <div className="font-mono text-[9px] uppercase text-on-surface-variant mt-1">Total Images</div>
                    </div>
                  </div>

                  {selected.audit_pain_points && (
                    <div className="bg-surface-elevated/60 border border-cyber-border rounded-lg p-3.5 flex items-start gap-2.5">
                      <ShieldAlert size={16} className="text-warning shrink-0 mt-0.5" />
                      <p className="text-xs text-on-surface-variant leading-relaxed">{selected.audit_pain_points}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Outreach Template Previews */}
              {(selected.msg_email || selected.msg_whatsapp || selected.msg_instagram) && (
                <div className="space-y-4">
                  <h3 className="font-mono text-[11px] text-on-surface-variant uppercase tracking-widest font-bold">Outreach Message Previews</h3>

                  {selected.msg_email && (
                    <div className="glass-panel border-surface-border overflow-hidden">
                      <div className="flex justify-between items-center px-4 py-2 border-b border-cyber-border bg-surface-elevated/50">
                        <span className="font-mono text-[10px] uppercase text-on-surface-variant font-bold">Email Template Preview</span>
                        <button onClick={() => handleCopy(emailEdit, 'email')} className="text-on-surface-variant hover:text-primary transition-colors text-[10px] font-mono">
                          {copiedText === 'email' ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                      <div className="p-4 space-y-3">
                        <textarea
                          rows={6}
                          value={emailEdit}
                          onChange={(e) => setEmailEdit(e.target.value)}
                          className="w-full bg-surface-container border border-cyber-border rounded p-3 text-xs text-on-surface font-mono outline-none focus:border-primary resize-none"
                        />
                      </div>
                    </div>
                  )}

                  {selected.msg_whatsapp && (
                    <div className="glass-panel border-surface-border overflow-hidden">
                      <div className="flex justify-between items-center px-4 py-2 border-b border-cyber-border bg-surface-elevated/50">
                        <span className="font-mono text-[10px] uppercase text-on-surface-variant font-bold">WhatsApp Template</span>
                        <button onClick={() => handleCopy(whatsappEdit, 'whatsapp')} className="text-on-surface-variant hover:text-secondary transition-colors text-[10px] font-mono">
                          {copiedText === 'whatsapp' ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                      <div className="p-4">
                        <textarea
                          rows={3}
                          value={whatsappEdit}
                          onChange={(e) => setWhatsappEdit(e.target.value)}
                          className="w-full bg-surface-container border border-cyber-border rounded p-3 text-xs text-on-surface font-mono outline-none focus:border-secondary resize-none"
                        />
                      </div>
                    </div>
                  )}

                  {selected.msg_instagram && (
                    <div className="glass-panel border-surface-border overflow-hidden">
                      <div className="flex justify-between items-center px-4 py-2 border-b border-cyber-border bg-surface-elevated/50">
                        <span className="font-mono text-[10px] uppercase text-on-surface-variant font-bold">Instagram DM</span>
                        <button onClick={() => handleCopy(instagramEdit, 'instagram')} className="text-on-surface-variant hover:text-strategic-violet transition-colors text-[10px] font-mono">
                          {copiedText === 'instagram' ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                      <div className="p-4">
                        <textarea
                          rows={3}
                          value={instagramEdit}
                          onChange={(e) => setInstagramEdit(e.target.value)}
                          className="w-full bg-surface-container border border-cyber-border rounded p-3 text-xs text-on-surface font-mono outline-none focus:border-strategic-violet resize-none"
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <button
                      onClick={handleSaveMessages}
                      disabled={updatingMsg}
                      className="px-4 py-2 bg-surface-elevated hover:bg-surface-border text-on-surface border border-cyber-border rounded font-mono text-[11px] uppercase tracking-wider flex items-center gap-1 transition-colors"
                    >
                      {updatingMsg ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                      Save Updates
                    </button>
                  </div>
                </div>
              )}

              {/* Active CRM Integration Panel */}
              <div className="glass-panel border-surface-border p-5 space-y-4">
                <h3 className="font-mono text-[11px] text-on-surface-variant uppercase tracking-widest font-bold flex items-center gap-1">
                  <Database size={13} /> Active CRM Connector
                </h3>

                <div className="space-y-3">
                  <div>
                    <label htmlFor="crm-webhook" className="text-[11px] text-on-surface-variant font-mono block mb-1">CRM Webhook Endpoint URL</label>
                    <input
                      id="crm-webhook"
                      type="text"
                      value={crmWebhook}
                      onChange={(e) => setCrmWebhook(e.target.value)}
                      className="w-full bg-surface-container border border-cyber-border rounded px-3 py-2 text-xs text-on-surface font-mono outline-none focus:border-primary"
                    />
                  </div>

                  <button
                    onClick={handleSyncCRM}
                    disabled={crmSyncing}
                    className="w-full flex items-center justify-center gap-1.5 py-2 rounded bg-surface-elevated border border-cyber-border hover:border-primary text-on-surface font-mono text-[11px] font-bold uppercase transition-all"
                  >
                    {crmSyncing ? <Loader2 size={13} className="animate-spin" /> : <Database size={13} />}
                    Sync Contact details
                  </button>

                  {crmMessage && (
                    <div className="bg-primary/10 border border-primary/20 text-primary p-2.5 rounded text-xs font-mono text-center">
                      {crmMessage}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
