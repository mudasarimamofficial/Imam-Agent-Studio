"use client";

import { useEffect, useState } from 'react';
import { TopNav } from '@/components/layout/TopNav';
import { 
  Search, 
  ChevronRight, 
  Folder, 
  FileText, 
  Share2, 
  User, 
  Building2,
  ZoomIn,
  ZoomOut,
  Focus,
  X,
  ExternalLink,
  MessageSquare,
  Database,
  Cpu
} from 'lucide-react';
import { MemoryEntry } from '@/lib/types';
import { ComingSoon } from '@/components/ui/ComingSoon';

export default function MemoryPage() {
  const [memories, setMemories] = useState<MemoryEntry[]>([]);
  const [selectedMemory, setSelectedMemory] = useState<MemoryEntry | null>(null);

  useEffect(() => {
    async function fetchMemory() {
      try {
        const res = await fetch('/api/memory');
        const json = await res.json();
        setMemories(json.data || []);
      } catch (err) {
        console.error(err);
      }
    }
    fetchMemory();
    const interval = setInterval(fetchMemory, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex-1 flex flex-col h-full relative overflow-hidden bg-background">
      <TopNav 
        title="Imam Agent Studio" 
        tabs={['Research', 'Engineering', 'Design', 'QA']} 
      />

      <main className="flex-1 p-6 gap-6 flex overflow-hidden">
        {/* Left Sidebar: Semantic Stores */}
        <aside className="w-72 glass-panel rounded-xl flex flex-col overflow-hidden relative z-10">
          <div className="p-3 border-b border-cyber-border/50">
            <ComingSoon label="Semantic search coming soon" className="w-full">
              <div className="relative w-full">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                <span className="block w-full bg-surface-dim font-mono text-[13px] text-on-surface-variant/50 pl-9 py-2">
                  Query the Knowledge Graph...
                </span>
              </div>
            </ComingSoon>
          </div>
          
          <div className="flex-1 overflow-y-auto p-3 font-mono text-[12px] text-on-surface-variant flex flex-col gap-4 terminal-scroll">
            
            <div>
              <div className="flex items-center gap-2 text-on-surface cursor-pointer py-1 group">
                <ChevronRight size={16} className="rotate-90" />
                <Database size={16} className="text-telemetry-blue" />
                <span>Live Agent Stream</span>
              </div>
              <div className="ml-6 pl-2 border-l border-cyber-border/30 flex flex-col gap-2 mt-2">
                {memories.length === 0 ? (
                   <span className="text-on-surface-variant/50 italic px-2">No active memories.</span>
                ) : memories.map((mem) => (
                  <div 
                    key={mem.id} 
                    onClick={() => setSelectedMemory(mem)}
                    className={`flex flex-col gap-1 py-1 cursor-pointer rounded px-2 border ${selectedMemory?.id === mem.id ? 'bg-primary/10 border-primary/20 text-primary' : 'hover:bg-surface-variant/30 text-on-surface border-transparent w-full truncate'}`}
                  >
                    <div className="flex items-center gap-2">
                      <Cpu size={12} />
                      <span className="truncate w-full">{mem.agent_label}</span>
                    </div>
                    <span className="text-[10px] text-on-surface-variant truncate w-full pl-5 opacity-70">{mem.content}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 hover:text-on-surface cursor-pointer py-1 group">
                <ChevronRight size={16} className="transition-transform group-hover:rotate-90" />
                <Folder size={16} className="text-strategic-violet" />
                <span>Static Corpora</span>
              </div>
              <div className="ml-6 pl-2 border-l border-cyber-border/30 flex flex-col gap-1 mt-1">
                <div className="flex items-center gap-2 py-1 text-on-surface cursor-pointer hover:bg-surface-variant/30 rounded px-2">
                  <FileText size={14} className="text-primary" />
                  <span>HLTM_Core_Docs</span>
                </div>
                <div className="flex items-center gap-2 py-1 hover:text-on-surface cursor-pointer hover:bg-surface-variant/30 rounded px-2">
                  <FileText size={14} />
                  <span>Project_Alpha_Specs</span>
                </div>
              </div>
            </div>

          </div>
        </aside>

        {/* Center: Fake 3D Graph Canvas */}
        <section className="flex-1 bg-surface-dim/50 border border-cyber-border rounded-xl relative overflow-hidden flex items-center justify-center">
          <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px)", backgroundSize: "24px 24px" }}></div>
          
          <div className="absolute top-4 left-4 flex gap-2 z-20">
            <ComingSoon label="Graph zoom coming soon">
              <span className="bg-surface/80 border border-cyber-border rounded p-1.5 text-on-surface-variant backdrop-blur-md block"><ZoomIn size={18}/></span>
            </ComingSoon>
            <ComingSoon label="Graph zoom coming soon">
              <span className="bg-surface/80 border border-cyber-border rounded p-1.5 text-on-surface-variant backdrop-blur-md block"><ZoomOut size={18}/></span>
            </ComingSoon>
            <ComingSoon label="Re-center coming soon">
              <span className="bg-surface/80 border border-cyber-border rounded p-1.5 text-on-surface-variant backdrop-blur-md block"><Focus size={18}/></span>
            </ComingSoon>
          </div>

          <svg className="w-full h-full relative z-10" viewBox="0 0 800 600">
            <defs>
              <linearGradient id="grad-active" x1="0%" x2="100%" y1="0%" y2="100%">
                <stop offset="0%" stopColor="#a3e635" stopOpacity="0.8"></stop>
                <stop offset="100%" stopColor="#3f6212" stopOpacity="0.2"></stop>
              </linearGradient>
              <linearGradient id="grad-line" x1="0%" x2="100%" y1="0%" y2="0%">
                <stop offset="0%" stopColor="#8b8cf8" stopOpacity="0.5"></stop>
                <stop offset="100%" stopColor="#a3e635" stopOpacity="0.8"></stop>
              </linearGradient>
            </defs>

            <path d="M 400 300 L 250 150" fill="none" stroke="#424936" strokeWidth="2"></path>
            <path className="flow-line" d="M 400 300 L 550 200" fill="none" stroke="url(#grad-line)" strokeWidth="2"></path>
            <path d="M 400 300 L 300 450" fill="none" stroke="#424936" strokeWidth="2"></path>
            <path d="M 400 300 L 500 400" fill="none" stroke="#424936" strokeWidth="2"></path>
            <path d="M 250 150 L 150 200" fill="none" stroke="#424936" strokeDasharray="4" strokeWidth="1"></path>
            <path d="M 550 200 L 650 150" fill="none" stroke="#635BFF" strokeOpacity="0.6" strokeWidth="1.5"></path>

            <g transform="translate(250, 150)">
              <circle cx="0" cy="0" fill="#1b1c1d" r="16" stroke="#8c947d" strokeWidth="2"></circle>
              <text fill="#c1cab1" fontFamily="JetBrains Mono" fontSize="10" textAnchor="middle" x="0" y="28">Founder_Mem</text>
            </g>
            <g transform="translate(150, 200)">
              <circle cx="0" cy="0" fill="#1b1c1d" r="8" stroke="#424936" strokeWidth="1"></circle>
            </g>
            <g transform="translate(300, 450)">
              <circle cx="0" cy="0" fill="#1b1c1d" r="20" stroke="#005669" strokeWidth="2"></circle>
              <text fill="#c1cab1" fontFamily="JetBrains Mono" fontSize="10" textAnchor="middle" x="0" y="32">Org_Memory</text>
            </g>
            <g transform="translate(500, 400)">
              <circle cx="0" cy="0" fill="#1b1c1d" r="12" stroke="#424936" strokeWidth="1"></circle>
            </g>
            <g transform="translate(650, 150)">
              <circle cx="0" cy="0" fill="#1b1c1d" r="12" stroke="#635BFF" strokeWidth="1"></circle>
              <text fill="#c1cab1" fontFamily="JetBrains Mono" fontSize="9" textAnchor="middle" x="0" y="24">v_idx_alpha</text>
            </g>

            <g className="cursor-pointer" transform="translate(400, 300)">
              <circle className={`${memories.length > 0 ? 'pulse-active' : ''}`} cx="0" cy="0" fill="url(#grad-active)" r="32" stroke="#a3e635" strokeWidth="2" style={{ transition: 'all 0.3s' }}></circle>
              <circle cx="0" cy="0" fill="#0f1a02" r="12"></circle>
              <text fill="#bef264" fontFamily="JetBrains Mono" fontSize="12" fontWeight="500" textAnchor="middle" x="0" y="48">Project_Memory_Core</text>
              <text className="opacity-80" fill="#B2D5FF" fontFamily="JetBrains Mono" fontSize="10" textAnchor="middle" x="0" y="-40">LATENCY: 12ms</text>
            </g>

            <g transform="translate(550, 200)">
              <circle cx="0" cy="0" fill="#12151a" r="18" stroke="#a3e635" strokeWidth="2"></circle>
              <text fill="#e3e2e3" fontFamily="JetBrains Mono" fontSize="10" textAnchor="middle" x="0" y="30">Design_Specs</text>
            </g>
          </svg>

          <div className="absolute bottom-4 right-4 flex gap-2 z-20 font-mono text-[11px]">
            <span className="bg-surface-container/80 backdrop-blur-sm border border-cyber-border px-2 py-1 rounded text-on-surface-variant">MEMORIES: {memories.length}</span>
            <span className="bg-primary/20 border border-primary/30 px-2 py-1 rounded text-primary flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></span>
              SYNCED
            </span>
          </div>
        </section>

        {/* Right Sidebar: Detail Panel - dynamically shows selected memory if it exists */}
        {selectedMemory && (
          <aside className="w-80 glass-elevated rounded-xl flex flex-col overflow-hidden relative z-10 animate-fade-in">
            <div className="p-3 border-b border-cyber-border bg-surface/40 flex items-start justify-between">
              <div className="w-full">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_var(--color-primary)]"></span>
                  <span className="font-mono text-[11px] text-primary uppercase tracking-wider">Active Memory</span>
                </div>
                <h2 className="font-bold text-on-surface text-lg truncate w-56">{selectedMemory.agent_label} Output</h2>
              </div>
              <button onClick={() => setSelectedMemory(null)} className="text-on-surface-variant hover:text-on-surface transition-colors mt-1"><X size={18} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6 text-[13px] terminal-scroll">
              <div>
                <h3 className="font-mono text-[12px] text-on-surface-variant mb-3 border-b border-cyber-border pb-1">PROPERTIES</h3>
                <div className="flex flex-col gap-2 font-mono text-[11px]">
                  <div className="flex justify-between border-b border-cyber-border/30 pb-1">
                    <span className="text-on-surface-variant/70">ID</span>
                    <span className="text-secondary-fixed truncate w-32 text-right">{selectedMemory.id}</span>
                  </div>
                  <div className="flex justify-between border-b border-cyber-border/30 pb-1">
                    <span className="text-on-surface-variant/70">Type</span>
                    <span className="text-strategic-violet">{selectedMemory.type}</span>
                  </div>
                  <div className="flex justify-between border-b border-cyber-border/30 pb-1">
                    <span className="text-on-surface-variant/70">Timestamp</span>
                    <span className="text-on-surface">{new Date(selectedMemory.created_at).toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-mono text-[12px] text-on-surface-variant mb-3 border-b border-cyber-border pb-1">CONTENT</h3>
                <div className="flex flex-col gap-2">
                  <div className="bg-surface-dim border border-cyber-border/50 rounded p-3 overflow-hidden">
                    <p className="text-on-surface text-[12px] max-h-64 overflow-y-auto terminal-scroll break-words whitespace-pre-wrap">{selectedMemory.content}</p>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        )}
      </main>
    </div>
  );
}
