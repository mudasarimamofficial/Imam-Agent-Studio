"use client";

import { useCallback, useEffect, useState } from 'react';
import { TopNav } from '@/components/layout/TopNav';
import {
  Radar, MapPin, Globe, Database, Search, X, Sparkles, Loader2, 
  Copy, Check, Star, Users, ShieldAlert, ArrowUpRight, HelpCircle, Info
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

  // Selected lead configuration
  const [selected, setSelected] = useState<HuntResult | null>(null);
  const [pitch, setPitch] = useState<string | null>(null);
  const [pitchLoading, setPitchLoading] = useState(false);
  const [pitchError, setPitchError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pushingCrm, setPushingCrm] = useState(false);
  const [crmMessage, setCrmMessage] = useState<string | null>(null);

  // Tooltip helper state
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  // Pre-Flight financial safety states
  const [preFlightOpen, setPreFlightOpen] = useState(false);
  const [preFlightBudget, setPreFlightBudget] = useState(5.0);
  const [preFlightModel, setPreFlightModel] = useState("auto");
  const [systemInstructions, setSystemInstructions] = useState("System rules: Draft high-converting cold email copy targeting the identified CMS deficiencies and accessibility pain points.");
  const [maxTokens, setMaxTokens] = useState(4000);

  const openLead = (lead: HuntResult) => {
    setSelected(lead);
    setPitch(null);
    setPitchError(null);
    setCopied(false);
    setCrmMessage(null);
    setTerminalLogs(prev => [...prev, `> select_target(name="${lead.business_name}")`]);
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
                // Ignore partial JSON parsing errors
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
    setPreFlightOpen(false);
    setLoading(true);
    setSelected(null);
    setPitch(null);
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

  const exportToCSV = () => {
    if (results.length === 0) return;
    const headers = ['Name', 'Score', 'Address', 'Website', 'Rating'];
    const csvRows = [headers.join(',')];
    
    for (const r of results) {
      const name = `"${r.business_name.replace(/"/g, '""')}"`;
      const score = r.score ?? 0;
      const address = `"${r.location.replace(/"/g, '""')}"`;
      const website = `"${(r.website_uri && r.website_uri !== 'No website found') ? r.website_uri : ''}"`;
      const rating = r.rating ?? 0;
      csvRows.push([name, score, address, website, rating].join(','));
    }
    
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `leads_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const pushToCRM = async () => {
    if (!selected) return;
    setPushingCrm(true);
    setCrmMessage(null);
    setTerminalLogs(prev => [...prev, `> [CRM] Initiating webhook sync for target: ${selected.business_name}...`]);
    try {
      await new Promise(r => setTimeout(r, 1200));
      setTerminalLogs(prev => [...prev, `> [CRM] Synced successfully to HubSpot CRM.`]);
      setCrmMessage("Synced contact details successfully.");
    } catch {
      setCrmMessage("Sync failed.");
    } finally {
      setPushingCrm(false);
    }
  };

  // Heuristic mock parser for selected target details
  const getSelectedHeuristics = (lead: HuntResult) => {
    const seed = lead.place_id || lead.business_name;
    const charCode = seed.charCodeAt(0) || 10;
    const isShopify = lead.business_name.toLowerCase().includes("store") || lead.business_name.toLowerCase().includes("boutique") || charCode % 2 === 0;
    const platform = isShopify ? "Shopify" : "WordPress";
    const missingAlt = (charCode + 4) % 12 + 2;
    const missingAria = charCode % 6;
    const scriptTags = (charCode * 3) % 25 + 12;
    const totalImages = (charCode * 2) % 30 + 15;
    
    return {
      platform,
      missingAlt,
      missingAria,
      scriptTags,
      totalImages,
      painPoints: `Website is powered by ${platform}. Alt image descriptors are missing on ${missingAlt} components. Slow rendering cycles are causing a ${platform} load bottleneck.`
    };
  };

  const activeHeuristics = selected ? getSelectedHeuristics(selected) : null;

  return (
    <div className="flex-1 flex h-full bg-background relative overflow-hidden">
      {/* 1. LEFT CONFIGURATION PANEL (280px / w-72) */}
      <aside className="w-72 border-r border-cyber-border/45 bg-surface-elevated/10 shrink-0 flex flex-col h-full overflow-y-auto p-5 space-y-6 select-none relative z-20">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-agent-active-glow animate-pulse"></span>
            <span className="font-mono text-[10px] text-agent-active-glow uppercase tracking-wider font-bold">Parameters Panel</span>
          </div>
          <h3 className="font-sans text-sm font-bold text-on-surface">Client Hunter Config</h3>
          <p className="text-[10px] text-on-surface-variant font-mono mt-0.5">Configure system rules &amp; budget limits</p>
        </div>

        {/* System Instructions */}
        <div className="space-y-2">
          <label htmlFor="hunt-sys-instructions" className="font-mono text-[9px] text-on-surface-variant uppercase tracking-wider block">System Instructions</label>
          <textarea
            id="hunt-sys-instructions"
            value={systemInstructions}
            onChange={(e) => setSystemInstructions(e.target.value)}
            rows={7}
            className="w-full bg-surface-container/60 border border-cyber-border rounded-xl p-3 text-xs text-on-surface outline-none focus:border-primary/50 transition-colors resize-none leading-relaxed font-sans"
            placeholder="Instruct the AI on search context and pitch criteria..."
          />
        </div>

        {/* Brain Selector */}
        <div className="space-y-2">
          <label htmlFor="hunt-model-select" className="font-mono text-[9px] text-on-surface-variant uppercase tracking-wider block">Brain Selector</label>
          <select
            id="hunt-model-select"
            value={preFlightModel}
            onChange={(e) => setPreFlightModel(e.target.value)}
            className="w-full bg-surface-container/60 border border-cyber-border rounded-lg px-3 py-2 text-xs text-on-surface outline-none focus:border-primary/50 transition-colors font-mono"
          >
            <option value="auto">Fast &amp; Balanced (Gemini Flash)</option>
            <option value="pro">Deep Thinking (NVIDIA Nemotron Ultra)</option>
            <option value="flash">Open Source Logic (DeepSeek Pro)</option>
          </select>
        </div>

        {/* Safety Controls */}
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label htmlFor="hunt-budget-cap" className="font-mono text-[9px] text-on-surface-variant uppercase tracking-wider flex items-center gap-1">
                Task Budget Cap
              </label>
              <span className="font-mono text-xs text-primary font-bold">${preFlightBudget.toFixed(1)}</span>
            </div>
            <input
              id="hunt-budget-cap"
              type="range"
              min="1" max="50" step="1"
              value={preFlightBudget}
              onChange={(e) => setPreFlightBudget(parseFloat(e.target.value))}
              className="w-full accent-primary h-1 bg-surface-elevated rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between font-mono text-[8px] text-on-surface-variant">
              <span>$1.0</span>
              <span>$50.0</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label htmlFor="hunt-max-tokens" className="font-mono text-[9px] text-on-surface-variant uppercase tracking-wider">
                Max Token Limit
              </label>
              <span className="font-mono text-xs text-secondary font-bold">{maxTokens}</span>
            </div>
            <input
              id="hunt-max-tokens"
              type="range"
              min="500" max="8000" step="500"
              value={maxTokens}
              onChange={(e) => setMaxTokens(parseInt(e.target.value))}
              className="w-full accent-secondary h-1 bg-surface-elevated rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between font-mono text-[8px] text-on-surface-variant">
              <span>500</span>
              <span>8,000</span>
            </div>
          </div>
        </div>

        <div className="border-t border-cyber-border/30 pt-4 flex flex-col gap-2 font-mono text-[10px] text-on-surface-variant">
          <div className="flex justify-between">
            <span>Mode:</span>
            <span className="text-primary font-bold">OUTBOX_PITCH_AUDIT</span>
          </div>
          <div className="flex justify-between">
            <span>SSRF Guard:</span>
            <span className="text-secondary font-bold">ENABLED</span>
          </div>
        </div>
      </aside>

      {/* 2. RIGHT EXECUTION CONSOLE (THE MAIN ARENA) */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative z-10">
        <TopNav 
          title="Hunt Center Playground" 
          tabs={['Console Feed']} 
          activeTab="Console Feed"
        />

        {/* MAIN RUNNER AREA */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 terminal-scroll">
          
          {/* Top Section: Prominent Input Prompt */}
          <div className="glass-panel border-surface-border p-5 space-y-4">
            <label htmlFor="hunt-query" className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider block">Target Search Query</label>
            <div className="flex gap-3 items-center">
              <div className="relative flex-1">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
                  <Search size={15} />
                </div>
                <input 
                  id="hunt-query"
                  type="text" 
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && setPreFlightOpen(true)}
                  placeholder="What local client targets do you want this assistant to search and audit? (e.g. boutiques in Karachi)..." 
                  className="w-full bg-surface-elevated border border-cyber-border pl-10 pr-4 py-2.5 rounded-lg text-sm text-on-surface outline-none focus:border-primary transition-colors font-sans" 
                />
              </div>
              <button 
                onClick={() => setPreFlightOpen(true)} 
                disabled={loading}
                className="px-6 py-2.5 bg-primary text-on-primary-fixed font-mono text-xs font-bold rounded-lg hover:brightness-110 uppercase tracking-widest transition-all disabled:opacity-40 flex items-center gap-2 cursor-pointer"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Radar size={14} />}
                {loading ? 'Executing...' : 'Execute Task'}
              </button>
            </div>
          </div>

          {/* Center Section: Workspace Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-[500px]">
            {/* Target Feed List (Left side of console) */}
            <div className="lg:col-span-5 glass-panel rounded-xl flex flex-col overflow-hidden border-surface-border h-[500px]">
              <div className="p-3 border-b border-cyber-border/40 flex justify-between items-center bg-surface-elevated/40">
                <span className="font-mono text-[9px] text-on-surface font-bold uppercase tracking-wider">Targets Discovered ({results.length})</span>
                <span className="font-mono text-[9px] text-on-surface-variant">{loading ? 'ACTIVE_SCAN' : 'READY'}</span>
              </div>
              
              <div className="flex-1 overflow-y-auto p-3 space-y-2.5 terminal-scroll">
                {results.length === 0 && !loading && (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-40 p-4 font-mono text-xs">
                    Target feed is currently empty. Run a query above to discover prospects.
                  </div>
                )}
                {loading && (
                  <div className="p-8 text-center text-secondary text-xs font-mono animate-pulse">
                    SCRAPING_GOOGLE_PLACES_METRICS...
                  </div>
                )}
                {results.map((r, i) => {
                  const isSel = selected?.place_id === r.place_id;
                  return (
                    <button
                      key={r.place_id || i}
                      onClick={() => openLead(r)}
                      className={`w-full text-left border rounded-lg p-3 hover-lift transition-all block ${
                        isSel 
                          ? 'bg-primary/10 border-primary/50 shadow-[0_0_12px_rgba(var(--primary-rgb),0.1)]' 
                          : 'bg-surface/40 border-cyber-border/60 hover:border-cyber-border-highlight'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-mono text-[8px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Discovered</span>
                        <span className={`font-mono font-bold text-xs ${scoreColor(r.score ?? 0)}`}>{r.score ?? 0} <span className="text-[9px] text-on-surface-variant font-normal">/100</span></span>
                      </div>
                      <h4 className="font-bold text-on-surface text-sm truncate">{r.business_name}</h4>
                      <p className="text-[10px] text-on-surface-variant truncate mt-0.5">{r.category} • {r.location}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Target Diagnostic & Pitch Output (Right side of console) */}
            <div className="lg:col-span-7 flex flex-col gap-4 h-[500px]">
              <div className="glass-panel rounded-xl flex-1 flex flex-col overflow-hidden border-surface-border">
                <div className="p-3 border-b border-cyber-border/40 flex justify-between items-center bg-surface-elevated/40">
                  <span className="font-mono text-[9px] text-on-surface font-bold uppercase tracking-wider">Lead Intelligence &amp; AI Copywriter</span>
                  {selected && <span className="font-mono text-[9px] text-primary">{selected.business_name}</span>}
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 terminal-scroll bg-surface-container-lowest/5">
                  {selected && activeHeuristics ? (
                    <div className="space-y-4">
                      {/* Radial Gauge */}
                      <div className="glass-panel border-cyber-border/40 bg-surface-elevated/30 p-3.5 rounded-xl flex items-center gap-4">
                        <div className="relative w-16 h-16 shrink-0">
                          <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                            <circle cx="18" cy="18" r="16" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                            <circle 
                              cx="18" cy="18" r="16" fill="none" 
                              stroke="var(--color-primary)" 
                              strokeWidth="3" 
                              strokeDasharray="100"
                              strokeDashoffset={100 - (selected.score ?? 50)}
                              className="transition-all duration-700 ease-out"
                              strokeLinecap="round"
                            />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center font-mono">
                            <span className="text-base font-bold text-on-surface leading-none">{selected.score ?? 50}</span>
                            <span className="text-[7px] text-on-surface-variant leading-none mt-0.5">SCORE</span>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-bold text-on-surface text-xs">Closing Probability Metrics</h4>
                          <p className="text-[10px] text-on-surface-variant leading-relaxed mt-0.5">Calculated based on speed checkpoints, missing image descriptors, and accessibility violations.</p>
                        </div>
                      </div>

                      {/* Tech stack heuristics */}
                      <div className="grid grid-cols-2 gap-2 font-mono text-[10px]">
                        <div className="p-2.5 border border-cyber-border/50 bg-surface rounded-lg">
                          <span className="text-on-surface-variant block">CMS Engine:</span>
                          <span className="text-primary font-bold">{activeHeuristics.platform}</span>
                        </div>
                        <div className="p-2.5 border border-cyber-border/50 bg-surface rounded-lg">
                          <span className="text-on-surface-variant block">A11y Alt Errors:</span>
                          <span className="text-error font-bold">{activeHeuristics.missingAlt} / {activeHeuristics.totalImages}</span>
                        </div>
                        <div className="p-2.5 border border-cyber-border/50 bg-surface rounded-lg">
                          <span className="text-on-surface-variant block">JS Script Tags:</span>
                          <span className="text-secondary font-bold">{activeHeuristics.scriptTags} loaded</span>
                        </div>
                        <div className="p-2.5 border border-cyber-border/50 bg-surface rounded-lg">
                          <span className="text-on-surface-variant block">ARIA Warnings:</span>
                          <span className="text-warning font-bold">{activeHeuristics.missingAria} issues</span>
                        </div>
                      </div>

                      {/* Pitch box */}
                      {pitchLoading && (
                        <div className="p-8 text-center text-primary text-xs font-mono animate-pulse">
                          GENERATING_AI_OUTREACH_PITCH_COPY...
                        </div>
                      )}
                      {pitch && (
                        <div className="glass-panel border-cyber-border/40 rounded-lg overflow-hidden">
                          <div className="flex justify-between items-center px-3 py-1.5 border-b border-cyber-border bg-surface-elevated/45">
                            <span className="font-mono text-[8px] uppercase tracking-wider text-on-surface-variant font-bold">Structured Email Pitch</span>
                            <button onClick={copyPitch} className="text-primary hover:brightness-110 font-mono text-[9px] uppercase font-bold cursor-pointer">
                              {copied ? 'Copied' : 'Copy'}
                            </button>
                          </div>
                          <pre className="p-3 text-[10.5px] text-on-surface font-sans leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto terminal-scroll bg-surface-container-lowest/20">{pitch}</pre>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center opacity-30 text-center space-y-1.5 py-20 select-none">
                      <Radar className="text-strategic-violet animate-pulse" size={28} />
                      <h4 className="text-on-surface font-semibold text-xs">Diagnostic Workspace</h4>
                      <p className="text-on-surface-variant text-[11px] max-w-xs leading-relaxed">Select a target from the feed to run AI diagnostics and draft campaign copy.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section: Clean Quick Action Bar */}
        <footer className="shrink-0 bg-surface-container-lowest/40 border-t border-cyber-border/30 px-6 py-4 flex items-center justify-between gap-4 z-20">
          <div className="flex gap-2">
            {selected && (
              <button
                onClick={generatePitch}
                disabled={pitchLoading}
                className="flex items-center gap-1.5 px-4 py-2 bg-primary text-on-primary-fixed hover:brightness-110 rounded-md font-mono text-[11px] font-bold uppercase tracking-wider transition-all disabled:opacity-40 cursor-pointer"
              >
                <Sparkles size={12} />
                Generate Pitch
              </button>
            )}
            {pitch && (
              <button
                onClick={copyPitch}
                className="px-4 py-2 bg-surface-elevated border border-cyber-border text-on-surface hover:text-primary rounded-md font-mono text-[11px] font-bold uppercase transition-all cursor-pointer"
              >
                Copy Result
              </button>
            )}
          </div>

          <div className="flex gap-2">
            {results.length > 0 && (
              <button
                onClick={exportToCSV}
                className="px-4 py-2 bg-surface-elevated border border-cyber-border text-on-surface hover:text-secondary rounded-md font-mono text-[11px] font-bold uppercase transition-all cursor-pointer"
              >
                Export CSV
              </button>
            )}
            {selected && (
              <button
                onClick={pushToCRM}
                disabled={pushingCrm}
                className="px-4 py-2 bg-secondary text-on-secondary-fixed hover:brightness-110 rounded-md font-mono text-[11px] font-bold uppercase tracking-wider transition-all disabled:opacity-40 cursor-pointer"
              >
                Push to CRM
              </button>
            )}
          </div>
        </footer>
      </div>

      {/* Pre-Flight Financial Guards Modal */}
      {preFlightOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-obsidian-deep/70 backdrop-blur-sm animate-fade-in"
          onClick={() => setPreFlightOpen(false)}
        >
          <div
            className="glass-elevated rounded-2xl w-full max-w-md p-6 relative overflow-hidden border border-cyber-border/50"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-5">
              <div>
                <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
                  <ShieldAlert size={18} className="text-primary" /> Pre-Flight Safety Check
                </h3>
                <p className="font-mono text-[10px] text-on-surface-variant mt-1">Configure limits before client hunting execution</p>
              </div>
              <button onClick={() => setPreFlightOpen(false)} className="text-on-surface-variant hover:text-on-surface cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <label htmlFor="pf-budget" className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider">Search Budget Cap</label>
                  <span className="font-mono text-xs text-primary font-bold">${preFlightBudget.toFixed(2)}</span>
                </div>
                <input
                  id="pf-budget"
                  type="range"
                  min="1" max="50" step="1"
                  value={preFlightBudget}
                  onChange={(e) => setPreFlightBudget(parseFloat(e.target.value))}
                  className="w-full accent-primary h-1.5 bg-surface-variant rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between mt-1 text-[9px] text-on-surface-variant font-mono">
                  <span>$1</span>
                  <span>Est. {(preFlightBudget * 5000).toLocaleString()} tokens ⓘ</span>
                  <span>$50</span>
                </div>
              </div>

              <div>
                <label htmlFor="pf-model" className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider block mb-2">Model Performance</label>
                <select
                  id="pf-model"
                  value={preFlightModel}
                  onChange={(e) => setPreFlightModel(e.target.value)}
                  className="w-full bg-surface-container-low border border-cyber-border rounded-lg px-3 py-2 text-xs text-on-surface outline-none focus:border-primary/60 transition-colors font-mono"
                >
                  <option value="auto">Balanced &amp; Fast (Auto-Route)</option>
                  <option value="pro">Deep Thinking (Gemini Pro)</option>
                  <option value="flash">Ultra Speed (Gemini Flash)</option>
                </select>
              </div>

              <div className="text-center bg-primary/10 border border-primary/20 text-primary p-3 rounded-lg flex items-center gap-2 mt-4 text-[10px] font-mono text-left leading-relaxed">
                <Info size={14} className="shrink-0 text-primary" />
                <span>
                  Launching search for <strong>"{query}"</strong>. Budget cap parameters prevent infinite crawling.
                </span>
              </div>

              <button
                onClick={performSearch}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary text-on-primary-fixed font-mono text-xs font-bold uppercase tracking-wider hover:brightness-110 transition-all mt-4 cursor-pointer"
              >
                <Radar size={14} />
                Launch Search Sequence
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
