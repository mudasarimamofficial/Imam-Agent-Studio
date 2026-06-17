"use client";

import { useEffect, useState } from 'react';
import { TopNav } from '@/components/layout/TopNav';
import { Mail, MessageSquare, Instagram, Globe, Check, X, Loader2, ClipboardList } from 'lucide-react';

interface Lead {
  id: string;
  place_id: string;
  business_name: string;
  website_url: string;
  email: string;
  msg_email: string | null;
  msg_whatsapp: string | null;
  msg_instagram: string | null;
  status: string;
  score: number;
}

export default function ReviewQueuePage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  const fetchQueue = async () => {
    try {
      const res = await fetch('/api/leads?status=ready_to_review');
      const json = await res.json();
      if (json.success) {
        setLeads(json.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleApprove = async (leadId: string) => {
    setActionId(leadId);
    try {
      const res = await fetch(`/api/leads/${leadId}/approve`, { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        setLeads(prev => prev.filter(l => l.place_id !== leadId));
      } else {
        alert(json.error?.message || "Delivery outbox failed");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionId(null);
    }
  };

  const handleReject = async (leadId: string) => {
    setActionId(leadId);
    try {
      const res = await fetch(`/api/leads/${leadId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Outreach template rejected by operator' })
      });
      const json = await res.json();
      if (json.success) {
        setLeads(prev => prev.filter(l => l.place_id !== leadId));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background relative overflow-hidden">
      <TopNav title="Review Queue" tabs={['Pending Approvals']} activeTab="Pending Approvals" />

      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-[1200px] mx-auto space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold font-sans tracking-tight text-on-surface">Outbox Approval Queue</h2>
              <p className="text-sm font-mono text-on-surface-variant mt-1">
                Verify and send AI-written outreach drafts matching target speed profiles
              </p>
            </div>
            <span className="font-mono text-xs bg-primary/20 text-primary border border-primary/30 px-2.5 py-1 rounded-full font-bold">
              {leads.length} DRAFTS PENDING
            </span>
          </div>

          {loading ? (
            <div className="p-20 text-center text-on-surface-variant font-mono animate-pulse">
              RETRIEVING_REVIEW_QUEUE...
            </div>
          ) : leads.length === 0 ? (
            <div className="p-16 glass-panel border border-primary/20 text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <ClipboardList className="text-primary" size={28} />
              </div>
              <h3 className="text-lg font-bold text-on-surface">Queue is empty</h3>
              <p className="text-on-surface-variant text-sm mt-1 max-w-sm">No outreach drafts are currently awaiting operator verification.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {leads.map((lead) => {
                const msgEmail = lead.msg_email || "";
                const emailLines = msgEmail.split("\n\n");
                const subject = emailLines[0] || "Quick Speed Observation";
                const body = emailLines.slice(1).join("\n\n") || msgEmail;

                return (
                  <div key={lead.id} className="glass-panel border-surface-border p-6 space-y-4 hover:border-cyber-border-highlight transition-all">
                    {/* Header */}
                    <div className="flex justify-between items-start gap-4 pb-3 border-b border-cyber-border/40">
                      <div>
                        <h3 className="font-bold text-on-surface text-base">{lead.business_name}</h3>
                        <div className="flex items-center gap-3 font-mono text-[11px] text-on-surface-variant mt-1">
                          <span className="flex items-center gap-1"><Globe size={12} /> {lead.website_url || 'No Website'}</span>
                          <span>•</span>
                          <span>SCORE: {lead.score}/100</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleReject(lead.place_id)}
                          disabled={actionId !== null}
                          className="px-3 py-1.5 rounded bg-surface-elevated hover:bg-error/10 hover:border-error/40 border border-cyber-border text-on-surface font-mono text-xs uppercase font-bold transition-all disabled:opacity-40"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => handleApprove(lead.place_id)}
                          disabled={actionId !== null}
                          className="px-4 py-1.5 rounded bg-primary text-on-primary-fixed hover:brightness-110 font-mono text-xs uppercase font-bold transition-all disabled:opacity-40 flex items-center gap-1"
                        >
                          {actionId === lead.place_id ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                          Approve &amp; Send
                        </button>
                      </div>
                    </div>

                    {/* Previews */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      {/* Email block */}
                      <div className="lg:col-span-2 bg-surface-container-low border border-cyber-border rounded-lg p-4 space-y-2">
                        <div className="font-mono text-[10px] uppercase text-primary font-bold flex items-center gap-1">
                          <Mail size={12} /> Email Outreach
                        </div>
                        <div className="font-sans text-xs text-on-surface border-b border-cyber-border/40 pb-2">
                          <span className="font-mono font-bold text-on-surface-variant">Subject:</span> {subject}
                        </div>
                        <pre className="font-sans text-xs text-on-surface-variant whitespace-pre-wrap leading-relaxed pt-1 max-h-48 overflow-y-auto terminal-scroll">
                          {body}
                        </pre>
                      </div>

                      {/* Messaging blocks */}
                      <div className="space-y-4">
                        {lead.msg_whatsapp && (
                          <div className="bg-surface-container-low border border-cyber-border rounded-lg p-4 space-y-2">
                            <div className="font-mono text-[10px] uppercase text-secondary font-bold flex items-center gap-1">
                              <MessageSquare size={12} /> WhatsApp Copy
                            </div>
                            <pre className="font-sans text-xs text-on-surface-variant whitespace-pre-wrap leading-relaxed max-h-24 overflow-y-auto terminal-scroll">
                              {lead.msg_whatsapp}
                            </pre>
                          </div>
                        )}

                        {lead.msg_instagram && (
                          <div className="bg-surface-container-low border border-cyber-border rounded-lg p-4 space-y-2">
                            <div className="font-mono text-[10px] uppercase text-strategic-violet font-bold flex items-center gap-1">
                              <Instagram size={12} /> Instagram DM Copy
                            </div>
                            <pre className="font-sans text-xs text-on-surface-variant whitespace-pre-wrap leading-relaxed max-h-24 overflow-y-auto terminal-scroll">
                              {lead.msg_instagram}
                            </pre>
                          </div>
                        )}
                      </div>
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
