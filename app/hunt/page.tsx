"use client";

import { useCallback, useEffect, useState } from 'react';
import { TopNav } from '@/components/layout/TopNav';
import {
  Radar,
  MapPin,
  Globe,
  Database,
  Search,
  X,
  Sparkles,
  Loader2,
  Copy,
  Check,
  Star,
  Users
} from 'lucide-react';
import { HuntResult } from '@/lib/types';
import type { SystemStats } from '@/app/api/stats/route';

function scoreColor(score: number): string {
  if (score >= 70) return 'text-primary';
  if (score >= 45) return 'text-warning';
  return 'text-on-surface-variant';
}

export default function HuntPage() {
  const [query, setQuery] = useState("Software companies in Karachi");
  const [results, setResults] = useState<HuntResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [huntStats, setHuntStats] = useState<SystemStats['hunt'] | null>(null);

  // Live Terminal Logs
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    "> initialize_core_systems()",
    "> ready for tasking."
  ]);

  // Lead detail / outreach panel
  const [selected, setSelected] = useState<HuntResult | null>(null);
  const [pitch, setPitch] = useState<string | null>(null);
  const [pitchLoading, setPitchLoading] = useState(false);
  const [pitchError, setPitchError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const openLead = (lead: HuntResult) => {
    setSelected(lead);
    setPitch(null);
    setPitchError(null);
    setCopied(false);
  };

  const generatePitch = async () => {
    if (!selected || pitchLoading) return;
    setPitchLoading(true);
    setPitchError(null);
    setPitch(null);
    setTerminalLogs(prev => [...prev, `> init_pitch_sequence(target="${selected.business_name}")`]);
    
    try {
      const res = await fetch('/api/hunt/pitch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selected),
      });

      if (!res.body) throw new Error("No response body");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.type === 'log') {
                  setTerminalLogs(prev => [...prev, `> ${data.msg}`]);
                } else if (data.type === 'result') {
                  setPitch(data.pitch);
                } else if (data.type === 'error') {
                  setPitchError(data.msg);
                }
              } catch (e) {
                // partial chunk or invalid json, safe to ignore in this simple parser
              }
            }
          }
        }
      }
    } catch {
      setPitchError('Network error generating pitch');
      setTerminalLogs(prev => [...prev, '> [ERROR] Network failure during stream.']);
    } finally {
      setPitchLoading(false);
    }
  };

  const copyPitch = async () => {
    if (!pitch) return;
    try {
      await navigator.clipboard.writeText(pitch);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard unavailable */ }
  };

  const refreshStats = useCallback(async () => {
    try {
      const res = await fetch('/api/stats');
      const json = await res.json();
      if (json.data?.hunt) setHuntStats(json.data.hunt);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => { refreshStats(); }, [refreshStats]);

  const performSearch = async () => {
    setLoading(true);
    setTerminalLogs(prev => [...prev, `> execute_hunt(query="${query}")`, '> [WORKING] Calling Google Places API...']);
    try {
      const res = await fetch('/api/hunt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      const data = await res.json();
      const extracted = data.data || [];
      setResults(extracted);
      setTerminalLogs(prev => [...prev, `> [SUCCESS] Extracted ${extracted.length} new profiles.`]);
    } catch (e) {
      console.error(e);
      setTerminalLogs(prev => [...prev, '> [ERROR] Search execution failed.']);
    } finally {
      setLoading(false);
      refreshStats();
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background relative overflow-hidden">
      <TopNav 
        title="Imam Agent Studio" 
        tabs={['Research', 'Engineering', 'Design', 'QA']} 
      />

      <div className="flex-1 overflow-y-auto p-6 md:p-8 terminal-scroll">
        <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-agent-active-glow animate-pulse"></span>
              <span className="font-mono text-[12px] text-agent-active-glow">REV_OPS_ACTIVE</span>
              <span className="font-mono text-[12px] text-on-surface-variant mx-2">|</span>
              <span className="font-mono text-[12px] text-on-surface-variant">NODE: REALTIME_HUNT</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-on-surface">Client Hunting Center</h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
               <div className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
                 <Search size={14} />
               </div>
               <input 
                 type="text" 
                 value={query}
                 onChange={(e) => setQuery(e.target.value)}
                 onKeyDown={(e) => e.key === 'Enter' && performSearch()}
                 placeholder="Search businesses..." 
                 className="w-full md:w-64 bg-surface-elevated border border-surface-border pl-9 pr-4 py-1.5 rounded text-[13px] text-on-surface font-mono outline-none focus:border-primary transition-colors" 
               />
            </div>
            <button onClick={performSearch} className="px-3 py-1.5 bg-primary text-background font-mono text-[12px] rounded hover:brightness-110 uppercase tracking-wider">
              {loading ? 'Searching...' : 'Hunt'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-[calc(100vh-180px)]">
          {/* Left Column: Live Hunt Feed */}
          <div className="md:col-span-4 glass-panel rounded-xl flex flex-col overflow-hidden">
            <div className="p-3 border-b border-cyber-border flex justify-between items-center bg-surface/50">
              <h3 className="font-mono text-[12px] text-on-surface font-bold flex items-center gap-2">
                <Radar size={16} className="text-secondary" />
                LIVE HUNT FEED
              </h3>
              <span className="font-mono text-[11px] text-on-surface-variant">{loading ? 'SCRAPING_ACTIVE' : 'IDLE'}</span>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-3 data-stream relative terminal-scroll">
              
              {results.length === 0 && !loading && (
                <div className="text-center text-on-surface-variant text-sm font-mono mt-10">
                  Execute Hunt to populate target list...
                </div>
              )}

              {loading && (
                 <div className="text-center text-secondary text-sm font-mono mt-10 animate-pulse">
                   Querying Google Places API...
                 </div>
              )}

              {results.map((r, i) => (
                <button
                  key={r.place_id || i}
                  onClick={() => openLead(r)}
                  className={`w-full text-left border rounded-lg bg-surface/40 p-3 hover-lift group cursor-pointer ${selected?.place_id === r.place_id ? 'border-primary/50' : 'border-cyber-border'}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-mono text-[11px] text-agent-active-glow bg-agent-active-glow/10 px-1.5 py-0.5 rounded">NEW_TARGET</span>
                    <div className="flex items-center gap-1" title="Predictive lead score (0-100)">
                      <span className={`font-mono text-sm font-bold ${scoreColor(r.score ?? 0)}`}>{r.score ?? 0}</span>
                      <span className="font-mono text-[9px] text-on-surface-variant">/100</span>
                    </div>
                  </div>
                  <h4 className="font-bold text-on-surface mb-1 truncate">{r.business_name}</h4>
                  <p className="text-[13px] text-on-surface-variant mb-3 truncate" title={r.location}>{r.category.replace(/_/g, ' ')} • {r.location}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 font-mono text-[10px] text-on-surface-variant">
                      <span className="flex items-center gap-1"><Star size={11} className="text-warning" /> {r.rating}</span>
                      <span className="flex items-center gap-1"><Users size={11} /> {r.user_rating_count ?? 0}</span>
                    </div>
                    {r.website_uri && r.website_uri !== "No website found" ? (
                      <span className="flex items-center gap-1 text-primary font-mono text-[10px]"><Globe size={11} /> SITE</span>
                    ) : (
                      <span className="font-mono text-[10px] text-on-surface-variant/50">NO SITE</span>
                    )}
                  </div>
                </button>
              ))}

            </div>
          </div>

          {/* Middle Column */}
          <div className="md:col-span-5 flex flex-col gap-6">
            <div className="glass-panel rounded-xl flex-1 relative overflow-hidden flex flex-col">
              <div className="p-3 border-b border-cyber-border flex justify-between items-center bg-surface/80 absolute top-0 w-full z-10">
                <h3 className="font-mono text-[12px] text-on-surface font-bold flex items-center gap-2">
                  <MapPin size={16} className="text-strategic-violet" />
                  GEO_TARGET: SYSTEM ACTIVE
                </h3>
                <div className="w-2 h-2 rounded-full bg-strategic-violet animate-pulse"></div>
              </div>
              <div className="absolute inset-0 bg-surface-container-low/50">
                <div className="absolute top-1/2 left-1/2 w-32 h-32 -translate-x-1/2 -translate-y-1/2 border border-strategic-violet/30 rounded-full animate-[ping_3s_infinite]"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-strategic-violet rounded-full shadow-[0_0_18px_-2px_var(--color-strategic-violet)]"></div>
              </div>
            </div>

            <div className="glass-panel rounded-xl h-48 flex flex-col">
              <div className="p-3 border-b border-cyber-border flex justify-between items-center bg-surface/50">
                <h3 className="font-mono text-[12px] text-on-surface font-bold flex items-center gap-2">
                  <Database size={16} className="text-primary" />
                  LEAD PIPELINE
                </h3>
                <span className="font-mono text-[11px] text-on-surface-variant">{huntStats ? `${huntStats.hunts_run} HUNTS RUN` : 'LOADING'}</span>
              </div>
              <div className="flex-1 p-4 flex flex-col justify-center gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center border border-primary/50">
                    <Globe size={16} className="text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between font-mono text-[11px] mb-1">
                      <span className="text-on-surface">CONTACTABLE (HAS WEBSITE)</span>
                      <span className="text-primary">{huntStats ? `${huntStats.with_website}/${huntStats.leads_total}` : '—'}</span>
                    </div>
                    <div className="w-full h-1.5 bg-surface-container-high rounded overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: huntStats && huntStats.leads_total > 0 ? `${Math.round((huntStats.with_website / huntStats.leads_total) * 100)}%` : '0%' }}
                      ></div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded bg-telemetry-blue/20 flex items-center justify-center border border-telemetry-blue/50">
                    <Radar size={16} className="text-telemetry-blue" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between font-mono text-[11px] mb-1">
                      <span className="text-on-surface">CAPTURED TODAY</span>
                      <span className="text-telemetry-blue">{huntStats ? `${huntStats.leads_today} LEADS` : '—'}</span>
                    </div>
                    <div className="w-full h-1.5 bg-surface-container-high rounded overflow-hidden">
                      <div
                        className="h-full bg-telemetry-blue transition-all"
                        style={{ width: huntStats && huntStats.leads_total > 0 ? `${Math.round((huntStats.leads_today / huntStats.leads_total) * 100)}%` : '0%' }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="md:col-span-3 flex flex-col gap-6">
            <div className="glass-panel rounded-xl p-3 grid grid-cols-2 gap-3">
              <div className="col-span-2 border border-cyber-border rounded bg-surface-container-low p-3 pulse-border">
                <div className="font-mono text-[11px] text-on-surface-variant mb-1">LEADS CAPTURED (ALL TIME)</div>
                <div className="text-4xl font-bold text-agent-active-glow leading-none">{huntStats?.leads_total ?? '—'}</div>
                <div className="font-mono text-[11px] text-primary mt-1">{huntStats ? `+${huntStats.leads_today} today` : ''}</div>
              </div>
              <div className="border border-cyber-border rounded bg-surface-container-low p-3">
                <div className="font-mono text-[11px] text-on-surface-variant mb-1">THIS HUNT</div>
                <div className="text-3xl font-bold text-on-surface leading-none">{results.length}</div>
              </div>
              <div className="border border-cyber-border rounded bg-surface-container-low p-3">
                <div className="font-mono text-[11px] text-on-surface-variant mb-1">WITH WEBSITE</div>
                <div className="text-3xl font-bold text-secondary leading-none">
                  {huntStats && huntStats.leads_total > 0 ? `${Math.round((huntStats.with_website / huntStats.leads_total) * 100)}%` : '—'}
                </div>
              </div>
            </div>

            <div className="glass-panel rounded-xl flex-1 flex flex-col overflow-hidden">
              <div className="p-3 border-b border-cyber-border flex justify-between items-center bg-surface/50">
                <h3 className="font-mono text-[12px] text-on-surface font-bold">TERMINAL LOG</h3>
                <span className="w-2 h-2 rounded bg-primary"></span>
              </div>
              <div className="flex-1 p-3 bg-obsidian-deep font-mono text-[11px] text-on-surface-variant overflow-y-auto space-y-1 terminal-scroll flex flex-col justify-end">
                <div>
                  {terminalLogs.map((log, i) => (
                    <div 
                      key={i} 
                      className={log.includes('[ERROR]') ? 'text-error' : log.includes('[SUCCESS]') || log.includes('[LLM]') ? 'text-primary' : 'text-on-surface-variant'}
                    >
                      {log}
                    </div>
                  ))}
                  <div className="animate-pulse">&gt; _</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lead detail / outreach slide-out */}
      {selected && (
        <div className="fixed inset-0 z-[60] flex justify-end" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-obsidian-deep/60 backdrop-blur-sm animate-fade-in" onClick={() => setSelected(null)} />
          <aside className="relative glass-elevated w-full max-w-md h-full flex flex-col animate-fade-in overflow-hidden">
            <div className="p-4 border-b border-cyber-border flex items-start justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_var(--color-primary)]" />
                  <span className="font-mono text-[11px] uppercase tracking-wider text-primary">Lead Target</span>
                </div>
                <h2 className="font-bold text-on-surface text-lg truncate">{selected.business_name}</h2>
              </div>
              <button onClick={() => setSelected(null)} aria-label="Close" className="text-on-surface-variant hover:text-on-surface mt-1">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-5 terminal-scroll">
              {/* Score + signals */}
              <div className="grid grid-cols-3 gap-3">
                <div className="glass-panel rounded-lg p-3 text-center">
                  <div className={`text-2xl font-bold ${scoreColor(selected.score ?? 0)}`}>{selected.score ?? 0}</div>
                  <div className="font-mono text-[9px] uppercase tracking-wider text-on-surface-variant mt-1">Lead Score</div>
                </div>
                <div className="glass-panel rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-on-surface">{selected.rating}</div>
                  <div className="font-mono text-[9px] uppercase tracking-wider text-on-surface-variant mt-1">Rating</div>
                </div>
                <div className="glass-panel rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-on-surface">{selected.user_rating_count ?? 0}</div>
                  <div className="font-mono text-[9px] uppercase tracking-wider text-on-surface-variant mt-1">Reviews</div>
                </div>
              </div>

              <div className="space-y-2 font-mono text-[12px]">
                <div className="flex gap-2"><MapPin size={14} className="text-strategic-violet shrink-0 mt-0.5" /><span className="text-on-surface-variant">{selected.location}</span></div>
                <div className="flex gap-2"><Database size={14} className="text-telemetry-blue shrink-0 mt-0.5" /><span className="text-on-surface-variant">{selected.category.replace(/_/g, ' ')}</span></div>
                <div className="flex gap-2">
                  <Globe size={14} className="text-primary shrink-0 mt-0.5" />
                  {selected.website_uri && selected.website_uri !== 'No website found' ? (
                    <a href={selected.website_uri} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">{selected.website_uri}</a>
                  ) : (
                    <span className="text-on-surface-variant/60">No website found — strong opening angle</span>
                  )}
                </div>
              </div>

              {/* Outreach */}
              <div>
                <button
                  onClick={generatePitch}
                  disabled={pitchLoading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary text-on-primary-fixed font-mono text-[12px] font-bold uppercase tracking-wider hover:brightness-110 transition-all disabled:opacity-50"
                >
                  {pitchLoading ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
                  {pitchLoading ? 'Generating...' : pitch ? 'Regenerate Pitch' : 'Generate Pitch'}
                </button>

                {pitchError && (
                  <div role="alert" className="mt-3 text-[12px] rounded-lg px-3 py-2 border border-error/30 bg-error/10 text-error font-mono">{pitchError}</div>
                )}

                {pitch && (
                  <div className="mt-3 glass-panel rounded-lg overflow-hidden">
                    <div className="flex items-center justify-between px-3 py-2 border-b border-cyber-border">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-on-surface-variant">Generated Outreach</span>
                      <button onClick={copyPitch} className="flex items-center gap-1 text-on-surface-variant hover:text-primary transition-colors font-mono text-[10px]">
                        {copied ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
                      </button>
                    </div>
                    <pre className="p-3 text-[12px] text-on-surface whitespace-pre-wrap font-sans leading-relaxed max-h-80 overflow-y-auto terminal-scroll">{pitch}</pre>
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
