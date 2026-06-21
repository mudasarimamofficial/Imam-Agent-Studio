"use client";

import { useEffect, useState, useCallback } from 'react';
import { TopNav } from '@/components/layout/TopNav';
import { 
  Users, Mail, Search, Sparkles, Check, Database, Copy, X, Loader2, ExternalLink, MessageSquare, Briefcase, Globe
} from 'lucide-react';

interface Lead {
  id: string;
  place_id?: string;
  business_name: string;
  website_url: string;
  email: string;
  phone_number: string;
  status: string;
  score: number;
  tech_stack: any;
  audit_pain_points: string | null;
  msg_email: string | null;
  msg_instagram: string | null;
  website_text_snippet: string | null; // Extracted JSON string with industry, founders, etc
}

export default function HuntCenterPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Left Panel Inputs
  const [inputData, setInputData] = useState("");
  const [executing, setExecuting] = useState(false);
  const [logs, setLogs] = useState<{domain: string, status: string}[]>([]);
  
  // Detail Panel
  const [selected, setSelected] = useState<Lead | null>(null);
  const [emailEdit, setEmailEdit] = useState("");
  const [copiedText, setCopiedText] = useState(false);

  const fetchLeads = useCallback(async () => {
    try {
      const res = await fetch(`/api/leads`);
      const json = await res.json();
      if (json.success) {
        setLeads(json.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const handleRunHunt = async () => {
    if (!inputData.trim()) return;
    
    // Parse domains from CSV/Text
    const domains = inputData
      .split(/[\n,]+/)
      .map(d => d.trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '')) // Extract clean domain
      .filter(d => d.length > 3 && d.includes('.'));
      
    if (domains.length === 0) return;

    setExecuting(true);
    setLogs([]);
    
    try {
      const res = await fetch('/api/hunt/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domains })
      });

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n').filter(l => l.trim() !== '');
          
          for (const line of lines) {
            try {
              const data = JSON.parse(line);
              if (data.status) {
                setLogs(prev => [{ domain: data.domain || 'System', status: data.status }, ...prev].slice(0, 50));
              }
              if (data.result) {
                await fetchLeads(); // Refresh leads quietly in the background
              }
            } catch (e) {}
          }
        }
      }
    } catch (err) {
      console.error(err);
      setLogs(prev => [{ domain: 'System', status: 'Fatal error executing hunt pipeline' }, ...prev]);
    } finally {
      setExecuting(false);
      setInputData(""); // Clear input on finish
    }
  };

  const openLeadDetails = (lead: Lead) => {
    setSelected(lead);
    setEmailEdit(lead.msg_email || "");
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(emailEdit);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  // Safe parse of the JSON blob we injected into snippet
  const getParsedIntelligence = (lead: Lead) => {
    try {
      if (lead.website_text_snippet?.startsWith('{')) {
        return JSON.parse(lead.website_text_snippet);
      }
    } catch {}
    return { founders: [], industry: 'Unknown', summary: 'No summary available.' };
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background relative overflow-hidden">
      <TopNav title="Deep-Crawl AI Hunt Center" tabs={['Agent Execution']} activeTab="Agent Execution" />

      <main className="flex-1 flex overflow-hidden">
        {/* LEFT PANEL: CONFIGURATION */}
        <aside className="w-[450px] border-r border-cyber-border bg-surface-elevated/20 flex flex-col overflow-y-auto shrink-0 z-20">
          <div className="p-6 border-b border-cyber-border">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Globe size={20} className="text-primary" />
              </div>
              <h1 className="text-xl font-bold text-on-surface">Target Intake</h1>
            </div>
            <p className="text-sm text-on-surface-variant">Enter a list of domains or CSV to unleash the deep-crawl enrichment engine.</p>
          </div>

          <div className="p-6 space-y-6 flex-1 flex flex-col">
            <div className="space-y-2 flex-1 flex flex-col">
              <label className="text-xs font-bold font-mono uppercase tracking-widest text-on-surface-variant">Domains / URLs (Comma Separated)</label>
              <textarea
                value={inputData}
                onChange={e => setInputData(e.target.value)}
                placeholder="apple.com&#10;stripe.com&#10;linear.app"
                className="flex-1 w-full bg-surface border border-cyber-border rounded-lg px-4 py-3 text-sm text-on-surface outline-none focus:border-primary transition-colors resize-none font-mono"
                disabled={executing}
              />
            </div>

            <div className="space-y-3 bg-surface-elevated/30 p-4 rounded-xl border border-cyber-border">
              <h3 className="text-[10px] font-bold font-mono uppercase tracking-widest text-on-surface-variant mb-2">Extraction Options</h3>
              <label className="flex items-center gap-3 text-sm text-on-surface">
                <input type="checkbox" checked disabled className="accent-primary" />
                Deep Crawl (Up to 5 Subpages)
              </label>
              <label className="flex items-center gap-3 text-sm text-on-surface">
                <input type="checkbox" checked disabled className="accent-primary" />
                Extract Contact & Socials
              </label>
              <label className="flex items-center gap-3 text-sm text-on-surface">
                <input type="checkbox" checked disabled className="accent-primary" />
                Identify Founders & Leadership
              </label>
              <label className="flex items-center gap-3 text-sm text-on-surface">
                <input type="checkbox" checked disabled className="accent-primary" />
                AI Draft Personalized Outreach
              </label>
              <p className="text-[10px] text-on-surface-variant italic mt-2">* Enterprise presets are locked and always active.</p>
            </div>
          </div>

          <div className="p-6 border-t border-cyber-border bg-surface-container-lowest/50 mt-auto">
            <button
              onClick={handleRunHunt}
              disabled={executing || !inputData.trim()}
              className="w-full h-12 bg-primary text-on-primary-fixed rounded-xl font-bold font-mono uppercase tracking-widest transition-all disabled:opacity-50 hover:brightness-110 flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)]"
            >
              {executing ? <Loader2 size={18} className="animate-spin text-black" /> : <Sparkles size={18} className="text-black" />}
              <span className="text-black">{executing ? 'Executing Crawl...' : 'Run Hunt'}</span>
            </button>
          </div>
        </aside>

        {/* RIGHT PANEL: LIVE CRM ARENA */}
        <div className="flex-1 bg-surface-container-lowest/20 flex flex-col relative overflow-hidden">
          
          {/* Live Progress Terminal */}
          {executing && (
            <div className="border-b border-cyber-border bg-obsidian-deep/80 backdrop-blur-md p-4 max-h-48 overflow-y-auto terminal-scroll shrink-0">
              <div className="flex items-center gap-2 text-primary font-mono text-xs uppercase tracking-widest font-bold mb-3">
                <Loader2 size={14} className="animate-spin" /> Live Pipeline Execution
              </div>
              <div className="space-y-1.5 font-mono text-xs">
                {logs.map((log, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="text-on-surface-variant/50 shrink-0">[{new Date().toLocaleTimeString()}]</span>
                    <span className="text-secondary shrink-0">{log.domain}</span>
                    <span className="text-on-surface">{log.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CRM Table */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="glass-panel border-surface-border overflow-hidden rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] h-full flex flex-col">
              <div className="p-5 border-b border-cyber-border/50 bg-surface-elevated/20 flex justify-between items-center shrink-0">
                <h2 className="text-lg font-bold text-on-surface flex items-center gap-2">
                  <Database size={20} className="text-primary" /> Intelligence Roster
                </h2>
                <div className="text-xs text-on-surface-variant font-mono">{leads.length} Accounts Enriched</div>
              </div>

              {loading ? (
                <div className="p-8 flex items-center justify-center text-on-surface-variant">Loading roster...</div>
              ) : leads.length === 0 ? (
                <div className="m-auto text-center opacity-40 select-none p-12">
                  <Globe size={48} className="mx-auto mb-4" />
                  <h2 className="text-xl font-bold text-on-surface mb-2">Awaiting Targets</h2>
                  <p className="text-on-surface-variant max-w-sm">Enter domains in the left panel to begin deep crawling and extraction.</p>
                </div>
              ) : (
                <div className="overflow-x-auto flex-1">
                  <table className="w-full text-left border-collapse whitespace-nowrap">
                    <thead>
                      <tr className="border-b border-cyber-border/50 bg-surface-container-lowest/50 text-[11px] font-mono text-on-surface-variant uppercase tracking-wider sticky top-0 backdrop-blur-md z-10">
                        <th className="py-4 px-6 font-medium">Company</th>
                        <th className="py-4 px-6 font-medium">Industry & Tech</th>
                        <th className="py-4 px-6 font-medium">Contact</th>
                        <th className="py-4 px-6 font-medium text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-cyber-border/30 text-sm">
                      {leads.map((lead) => {
                        const intel = getParsedIntelligence(lead);
                        return (
                          <tr key={lead.id} className="hover:bg-surface-elevated/20 transition-colors group">
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-surface-elevated border border-cyber-border flex items-center justify-center shrink-0 text-on-surface font-bold">
                                  {lead.business_name.substring(0, 1) || '?'}
                                </div>
                                <div>
                                  <div className="font-semibold text-on-surface">{lead.business_name || lead.website_url.replace(/^https?:\/\//, '')}</div>
                                  <a href={lead.website_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1 mt-0.5">
                                    {lead.website_url.replace(/^https?:\/\//, '')} <ExternalLink size={10} />
                                  </a>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex flex-col gap-1.5">
                                <span className="text-xs text-on-surface truncate max-w-[200px]">{intel.industry}</span>
                                {lead.tech_stack?.platform && (
                                  <span className="inline-flex items-center w-fit bg-surface-elevated border border-cyber-border px-2 py-0.5 rounded text-[10px] font-mono font-medium text-on-surface-variant">
                                    {lead.tech_stack.platform}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex flex-col gap-1">
                                {lead.email ? (
                                  <div className="flex items-center gap-1.5 text-xs text-on-surface bg-surface-elevated w-fit px-2 py-1 rounded-md border border-cyber-border">
                                    <Mail size={12} className="text-on-surface-variant" /> {lead.email}
                                  </div>
                                ) : <span className="text-xs text-on-surface-variant italic">No email</span>}
                                {intel.founders?.[0] && (
                                  <div className="text-[10px] text-on-surface-variant mt-1">
                                    <span className="text-secondary font-bold">Founder:</span> {intel.founders[0].name}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="py-4 px-6 text-right">
                              <button 
                                onClick={() => openLeadDetails(lead)}
                                className="text-xs font-medium bg-surface-elevated hover:bg-surface-border text-on-surface px-4 py-2 rounded-lg border border-cyber-border transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                              >
                                View Intelligence
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Slide-out Profile Drawer */}
          {selected && (
            <div className="absolute inset-0 z-50 flex justify-end">
              <div className="absolute inset-0 bg-obsidian-deep/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setSelected(null)} />
              <aside className="relative glass-elevated w-full max-w-[600px] h-full flex flex-col animate-in slide-in-from-right duration-300 shadow-[-20px_0_40px_rgba(0,0,0,0.3)] border-l border-cyber-border z-10">
                
                <div className="p-6 border-b border-cyber-border flex items-start justify-between bg-surface-elevated/20">
                  <div className="flex gap-4 items-center">
                    <div className="w-14 h-14 rounded-2xl bg-surface-elevated border border-cyber-border flex items-center justify-center text-xl font-bold text-on-surface shadow-inner">
                      {selected.business_name.substring(0, 1) || '?'}
                    </div>
                    <div>
                      <h2 className="font-bold text-on-surface text-xl">{selected.business_name || selected.website_url.replace(/^https?:\/\//, '')}</h2>
                      <div className="flex gap-2 items-center mt-1">
                        <a href={selected.website_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1">
                          {selected.website_url.replace(/^https?:\/\//, '')} <ExternalLink size={12} />
                        </a>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setSelected(null)} className="p-2 rounded-full hover:bg-surface-elevated text-on-surface-variant transition-colors">
                    <X size={20} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-surface-container-lowest/30">
                  
                  {/* Intelligence Summary */}
                  <div>
                    <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-on-surface-variant mb-4 flex items-center gap-2">
                      <Briefcase size={14} /> AI Intelligence Summary
                    </h3>
                    <div className="glass-panel p-5 border-surface-border space-y-5">
                      <div>
                        <div className="text-[10px] uppercase font-mono text-on-surface-variant mb-1">Business Overview</div>
                        <p className="text-sm text-on-surface leading-relaxed">{getParsedIntelligence(selected).summary}</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <div className="text-[10px] uppercase font-mono text-on-surface-variant mb-1">Industry Focus</div>
                          <div className="text-sm font-medium text-on-surface">{getParsedIntelligence(selected).industry}</div>
                        </div>
                        <div>
                          <div className="text-[10px] uppercase font-mono text-on-surface-variant mb-1">Tech Platform</div>
                          <div className="text-sm font-medium text-on-surface">{selected.tech_stack?.platform || 'Unknown'}</div>
                        </div>
                      </div>

                      {getParsedIntelligence(selected).founders?.length > 0 && (
                        <div>
                          <div className="text-[10px] uppercase font-mono text-on-surface-variant mb-2">Identified Leadership</div>
                          <div className="space-y-2">
                            {getParsedIntelligence(selected).founders.map((f: any, i: number) => (
                              <div key={i} className="flex items-center justify-between bg-surface-elevated/50 p-2 rounded border border-cyber-border/50">
                                <span className="text-sm font-medium text-on-surface">{f.name} <span className="text-on-surface-variant font-normal">({f.role})</span></span>
                                {f.linkedin && (
                                  <a href={f.linkedin} target="_blank" className="text-xs text-primary hover:underline">LinkedIn</a>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {selected.audit_pain_points && (
                        <div>
                          <div className="text-[10px] uppercase font-mono text-on-surface-variant mb-2">Pain Points Discovered</div>
                          <p className="text-sm text-on-surface-variant leading-relaxed">
                            {selected.audit_pain_points}
                          </p>
                        </div>
                      )}
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
                            <span className="px-2 py-1 bg-primary/10 text-primary text-[10px] font-mono font-bold rounded uppercase border border-primary/20">Hyper-Personalized Email</span>
                          </div>
                          <textarea
                            value={emailEdit}
                            onChange={(e) => setEmailEdit(e.target.value)}
                            className="w-full bg-transparent border-none text-sm text-on-surface leading-relaxed outline-none resize-none min-h-[200px]"
                          />
                        </div>
                      </div>
                      
                      {selected.msg_instagram && (
                        <div className="glass-panel border-secondary/20 overflow-hidden mt-4">
                           <div className="p-5">
                            <div className="flex items-center gap-2 mb-4">
                              <span className="px-2 py-1 bg-secondary/10 text-secondary text-[10px] font-mono font-bold rounded uppercase border border-secondary/20">LinkedIn / Social Draft</span>
                            </div>
                            <div className="text-sm text-on-surface leading-relaxed">
                              {selected.msg_instagram}
                            </div>
                           </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </aside>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
