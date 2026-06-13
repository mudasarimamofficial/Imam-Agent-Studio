"use client";

import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { TopNav } from '@/components/layout/TopNav';
import { Search, Cpu, X, Database, Filter } from 'lucide-react';
import { MemoryEntry } from '@/lib/types';

const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false });

const PALETTE = ['#a3e635', '#7cc0ff', '#8b8cf8', '#bef264', '#fbbf24', '#f87171'];

export default function MemoryPage() {
  const [memories, setMemories] = useState<MemoryEntry[]>([]);
  const [selectedMemory, setSelectedMemory] = useState<MemoryEntry | null>(null);
  const [search, setSearch] = useState("");
  const [activeAgent, setActiveAgent] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      setDimensions({ width: entries[0].contentRect.width, height: entries[0].contentRect.height });
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const fetchMemory = useCallback(async () => {
    try {
      const params = new URLSearchParams({ limit: '200' });
      if (search.trim()) params.set('q', search.trim());
      const res = await fetch(`/api/memory?${params.toString()}`);
      const json = await res.json();
      setMemories(json.data || []);
    } catch (err) {
      console.error(err);
    }
  }, [search]);

  // Debounce search; poll when idle.
  useEffect(() => {
    const t = setTimeout(fetchMemory, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [fetchMemory, search]);

  useEffect(() => {
    if (search) return;
    const interval = setInterval(fetchMemory, 5000);
    return () => clearInterval(interval);
  }, [fetchMemory, search]);

  // Build graph nodes from real data: one node per agent_label, sized by count.
  const agents = useMemo(() => {
    const counts = new Map<string, number>();
    for (const m of memories) counts.set(m.agent_label, (counts.get(m.agent_label) ?? 0) + 1);
    return Array.from(counts.entries())
      .map(([label, count], i) => ({ label, count, color: PALETTE[i % PALETTE.length] }))
      .sort((a, b) => b.count - a.count);
  }, [memories]);

  const filtered = activeAgent ? memories.filter((m) => m.agent_label === activeAgent) : memories;

  const graphData = useMemo(() => {
    const nodes: any[] = [{ id: 'core', label: 'CORE', count: 100, color: '#a3e635', isCore: true }];
    const links: any[] = [];
    
    agents.forEach((a) => {
      nodes.push({ id: a.label, label: a.label, count: a.count, color: a.color });
      links.push({ source: 'core', target: a.label });
    });

    return { nodes, links };
  }, [agents]);

  return (
    <div className="flex-1 flex flex-col h-full relative overflow-hidden bg-background">
      <TopNav title="Memory OS" tabs={['Knowledge Graph']} activeTab="Knowledge Graph" />

      <main className="flex-1 p-6 gap-6 flex overflow-hidden">
        {/* Left: stream + search */}
        <aside className="w-72 glass-panel rounded-xl flex flex-col overflow-hidden relative z-10 shrink-0">
          <div className="p-3 border-b border-cyber-border/50">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-surface-dim border border-cyber-border rounded focus:border-primary font-mono text-[13px] text-on-surface pl-9 pr-3 py-2 placeholder-on-surface-variant/50 outline-none"
                placeholder="Search semantic memory..."
                type="text"
              />
            </div>
          </div>

          {activeAgent && (
            <button
              onClick={() => setActiveAgent(null)}
              className="mx-3 mt-3 flex items-center justify-between gap-2 px-3 py-1.5 rounded bg-primary/10 border border-primary/30 text-primary font-mono text-[11px]"
            >
              <span className="flex items-center gap-1.5 truncate"><Filter size={12} /> {activeAgent}</span>
              <X size={13} />
            </button>
          )}

          <div className="flex-1 overflow-y-auto p-3 font-mono text-[12px] flex flex-col gap-2 terminal-scroll">
            <div className="flex items-center gap-2 text-on-surface py-1">
              <Database size={16} className="text-telemetry-blue" />
              <span>Memory Stream</span>
              <span className="ml-auto text-on-surface-variant">{filtered.length}</span>
            </div>
            {filtered.length === 0 ? (
              <span className="text-on-surface-variant/50 italic px-2 mt-2">{search ? 'No semantic matches.' : 'No memories yet.'}</span>
            ) : filtered.map((mem: any) => (
              <button
                key={mem.id}
                onClick={() => setSelectedMemory(mem)}
                className={`flex flex-col gap-1 py-2 px-2 cursor-pointer rounded border text-left ${selectedMemory?.id === mem.id ? 'bg-primary/10 border-primary/20 text-primary' : 'hover:bg-surface-variant/30 text-on-surface border-transparent'}`}
              >
                <div className="flex items-center gap-2">
                  <Cpu size={12} />
                  <span className="truncate">{mem.agent_label}</span>
                  <span className="ml-auto text-[9px] uppercase text-on-surface-variant">{mem.type}</span>
                </div>
                <div className="flex justify-between w-full">
                  <span className="text-[10px] text-on-surface-variant truncate pl-5 opacity-70 flex-1">{mem.content}</span>
                  {mem.similarity && (
                    <span className="text-[9px] text-telemetry-blue font-bold">
                      {(mem.similarity * 100).toFixed(1)}%
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* Center: interactive graph */}
        <section className="flex-1 glass-panel rounded-xl relative overflow-hidden flex items-center justify-center bg-obsidian-deep" ref={containerRef}>
          <div className="absolute inset-0 z-0 opacity-30" style={{ backgroundImage: "radial-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px)", backgroundSize: "24px 24px" }}></div>

          <div className="absolute top-4 left-4 z-20 font-mono text-[11px] text-on-surface-variant">
            <div className="text-on-surface font-bold mb-0.5 flex items-center gap-2">
              <Database size={12} className="text-telemetry-blue" />
              Vector Knowledge Graph
            </div>
            <div>{agents.length} sources · {memories.length} memories</div>
            <div className="text-on-surface-variant/60 mt-1">Click a node to filter the stream</div>
          </div>

          <div className="absolute inset-0 z-10 flex items-center justify-center">
            {graphData.nodes.length > 1 && (
              <ForceGraph2D
                width={dimensions.width}
                height={dimensions.height}
                graphData={graphData}
                backgroundColor="transparent"
                linkColor={() => 'rgba(255, 255, 255, 0.08)'}
                onNodeClick={(node: any) => {
                  if (node.isCore) {
                    setActiveAgent(null);
                  } else {
                    setActiveAgent(activeAgent === node.id ? null : node.id);
                  }
                }}
                nodeCanvasObject={(node: any, ctx, globalScale) => {
                  const label = node.label;
                  const fontSize = 10 / globalScale;
                  ctx.font = `bold ${fontSize}px "JetBrains Mono", monospace`;
                  
                  const isCore = node.isCore;
                  const isActive = activeAgent === node.id || (!activeAgent && isCore);
                  
                  const radius = isCore ? 12 : Math.min(4 + node.count * 0.5, 12);
                  
                  ctx.beginPath();
                  ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
                  ctx.fillStyle = isActive ? node.color : 'rgba(20,24,30,0.9)';
                  ctx.fill();
                  ctx.lineWidth = 1;
                  ctx.strokeStyle = node.color;
                  ctx.stroke();

                  ctx.textAlign = 'center';
                  ctx.textBaseline = 'middle';
                  ctx.fillStyle = isActive ? '#08090b' : '#f2f4f6';
                  
                  if (isCore) {
                    ctx.fillText('CORE', node.x, node.y);
                  } else {
                    ctx.fillText(node.count.toString(), node.x, node.y);
                    ctx.fillStyle = '#aab3bf';
                    ctx.fillText(label, node.x, node.y + radius + fontSize + 2);
                  }
                }}
              />
            )}
          </div>
        </section>

        {/* Right: detail */}
        {selectedMemory && (
          <aside className="w-80 glass-elevated rounded-xl flex flex-col overflow-hidden relative z-10 animate-fade-in shrink-0">
            <div className="p-3 border-b border-cyber-border bg-surface/40 flex items-start justify-between">
              <div className="w-full min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_var(--color-primary)]"></span>
                  <span className="font-mono text-[11px] text-primary uppercase tracking-wider">Memory Record</span>
                </div>
                <h2 className="font-bold text-on-surface text-lg truncate">{selectedMemory.agent_label}</h2>
              </div>
              <button onClick={() => setSelectedMemory(null)} className="text-on-surface-variant hover:text-on-surface mt-1"><X size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6 text-[13px] terminal-scroll">
              <div>
                <h3 className="font-mono text-[12px] text-on-surface-variant mb-3 border-b border-cyber-border pb-1">PROPERTIES</h3>
                <div className="flex flex-col gap-2 font-mono text-[11px]">
                  <div className="flex justify-between border-b border-cyber-border/30 pb-1">
                    <span className="text-on-surface-variant/70">Type</span>
                    <span className="text-strategic-violet">{selectedMemory.type}</span>
                  </div>
                  <div className="flex justify-between border-b border-cyber-border/30 pb-1">
                    <span className="text-on-surface-variant/70">Timestamp</span>
                    <span className="text-on-surface">{new Date(selectedMemory.created_at).toLocaleString()}</span>
                  </div>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {(selectedMemory as any).similarity && (
                    <div className="flex justify-between border-b border-cyber-border/30 pb-1">
                      <span className="text-on-surface-variant/70">Semantic Match</span>
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      <span className="text-telemetry-blue font-bold">{((selectedMemory as any).similarity * 100).toFixed(1)}%</span>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <h3 className="font-mono text-[12px] text-on-surface-variant mb-3 border-b border-cyber-border pb-1">CONTENT</h3>
                <div className="bg-surface-dim border border-cyber-border/50 rounded p-3">
                  <p className="text-on-surface text-[12px] break-words whitespace-pre-wrap">{selectedMemory.content}</p>
                </div>
              </div>
            </div>
          </aside>
        )}
      </main>
    </div>
  );
}
