"use client";

import { useCallback, useEffect, useState } from 'react';
import { TopNav } from '@/components/layout/TopNav';
import {
  Radar,
  MapPin,
  Globe,
  Database,
  Search
} from 'lucide-react';
import { HuntResult } from '@/lib/types';
import type { SystemStats } from '@/app/api/stats/route';

export default function HuntPage() {
  const [query, setQuery] = useState("Software companies in Karachi");
  const [results, setResults] = useState<HuntResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [huntStats, setHuntStats] = useState<SystemStats['hunt'] | null>(null);

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
    try {
      const res = await fetch('/api/hunt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      const data = await res.json();
      setResults(data.data || []);
    } catch (e) {
      console.error(e);
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
                <div key={r.place_id || i} className="border border-cyber-border rounded-lg bg-surface/40 p-3 hover-lift group cursor-pointer">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-mono text-[11px] text-agent-active-glow bg-agent-active-glow/10 px-1.5 py-0.5 rounded">NEW_TARGET</span>
                    <span className="font-mono text-[11px] text-on-surface-variant">Just now</span>
                  </div>
                  <h4 className="font-bold text-on-surface mb-1 truncate">{r.business_name}</h4>
                  <p className="text-[13px] text-on-surface-variant mb-3 truncate" title={r.location}>{r.category} • {r.location}</p>
                  <p className="text-[11px] text-secondary font-mono mb-2 truncate">Rating: {r.rating}</p>
                  <div className="flex justify-between items-end">
                    <div className="w-full">
                      <div className="font-mono text-[11px] text-on-surface-variant mb-1">RATING</div>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1 bg-surface-container-high rounded overflow-hidden">
                          <div className="h-full bg-primary" style={{ width: `${r.rating !== 'N/A' ? (parseFloat(r.rating) / 5) * 100 : 0}%` }}></div>
                        </div>
                        <span className="font-mono text-[10px] text-on-surface-variant">{r.rating}</span>
                      </div>
                    </div>
                    {r.website_uri && r.website_uri !== "No website found" && (
                       <a href={r.website_uri} target="_blank" rel="noopener noreferrer" className="text-primary font-mono text-[10px] hover:underline whitespace-nowrap">WEBSITE</a>
                    )}
                  </div>
                </div>
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
              <div className="flex-1 p-3 bg-obsidian-deep font-mono text-[11px] text-on-surface-variant overflow-y-auto space-y-1 terminal-scroll">
                <div className="opacity-50">&gt; initialize_hunter_agent(query=&quot;{query}&quot;)</div>
                {loading && <div className="text-secondary">&gt; [WORKING] Calling Google Places API...</div>}
                {!loading && results.length > 0 && <div className="text-primary">&gt; [SUCCESS] Extracted {results.length} new profiles.</div>}
                <div className="animate-pulse">&gt; _</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
