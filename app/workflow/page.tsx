"use client";

import { useState } from 'react';
import { TopNav } from '@/components/layout/TopNav';
import { ComingSoon } from '@/components/ui/ComingSoon';
import {
  Filter,
  FileSearch,
  LineChart,
  Code2,
  Bug,
  FileText,
  MoreVertical,
  Minus,
  Plus,
  Maximize,
  Play,
  Square
} from 'lucide-react';

export default function WorkflowPage() {
  const [running, setRunning] = useState(false);
  const [workflowStatus, setWorkflowStatus] = useState<string | null>(null);

  const executeWorkflow = async () => {
    if (running) return;
    setRunning(true);
    setWorkflowStatus("Booting Engine...");
    
    try {
      const res = await fetch('/api/workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: "Orchestration_Alpha_01",
          nodes: [
             { id: 'node_1', type: 'tool', input: 'Search web for latest Next.js patterns', output: '', status: 'pending' },
             { id: 'node_2', type: 'llm', input: 'Draft system specs based on Next.js 15', output: '', status: 'pending' },
             { id: 'node_3', type: 'llm', input: 'Review and lint the drafted specs', output: '', status: 'pending' }
          ]
        })
      });
      const data = await res.json();
      if (data.success && data.data?.status === "completed") {
        setWorkflowStatus(`Success! Workflow executed cleanly.`);
      } else {
        setWorkflowStatus("Workflow execution failed.");
      }
    } catch (e) {
      console.error(e);
      setWorkflowStatus("System Exception");
    } finally {
      setRunning(false);
      setTimeout(() => setWorkflowStatus(null), 5000);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full relative overflow-hidden bg-background">
      <TopNav 
        title="Imam Agent Studio" 
        tabs={['Research', 'Engineering', 'Design', 'QA']} 
        activeTab="Engineering" 
      />

      <main className="flex-1 flex overflow-hidden">
        {/* Agent Library Sidebar */}
        <aside className="w-72 bg-surface-container border-r border-cyber-border flex flex-col h-full z-20">
          <div className="p-4 border-b border-cyber-border">
            <h2 className="font-bold text-on-surface text-xl mb-1">Agent Library</h2>
            <p className="font-mono text-[12px] text-on-surface-variant">24+ Available Nodes</p>
          </div>
          <div className="p-3">
            <ComingSoon label="Node filtering coming soon" className="mb-4 w-full">
              <div className="relative w-full">
                <Filter size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                <span className="block w-full bg-background border border-cyber-border rounded px-3 py-1.5 pl-8 text-sm text-on-surface-variant/50">
                  Filter agents...
                </span>
              </div>
            </ComingSoon>
            
            <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-16rem)] pb-10 terminal-scroll">
              {/* Category: Analysis */}
              <div>
                <h3 className="font-mono text-[12px] text-on-surface-variant mb-2 px-1 uppercase">Analysis</h3>
                <div className="space-y-2">
                  <div className="bg-surface border border-cyber-border p-2.5 rounded-lg flex items-center gap-3 cursor-default hover-lift group">
                    <div className="w-8 h-8 rounded bg-surface-bright flex items-center justify-center text-telemetry-blue group-hover:text-primary transition-colors">
                      <FileSearch size={18} />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-on-surface">Web Researcher</div>
                      <div className="text-[12px] font-mono text-on-surface-variant">Perplexity-Sonar</div>
                    </div>
                  </div>
                  <div className="bg-surface border border-cyber-border p-2.5 rounded-lg flex items-center gap-3 cursor-default hover-lift group">
                    <div className="w-8 h-8 rounded bg-surface-bright flex items-center justify-center text-telemetry-blue group-hover:text-primary transition-colors">
                      <LineChart size={18} />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-on-surface">Data Analyst</div>
                      <div className="text-[12px] font-mono text-on-surface-variant">GPT-4o-Data</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Category: Engineering */}
              <div>
                <h3 className="font-mono text-[12px] text-on-surface-variant mb-2 px-1 uppercase">Engineering</h3>
                <div className="space-y-2">
                  <div className="bg-primary/5 border border-primary/30 p-2.5 rounded-lg flex items-center gap-3 cursor-default hover-lift">
                    <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center text-primary">
                      <Code2 size={18} />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-on-surface">Core Coder</div>
                      <div className="text-[12px] font-mono text-primary">DeepSeek-V4-Pro</div>
                    </div>
                  </div>
                  <div className="bg-surface border border-cyber-border p-2.5 rounded-lg flex items-center gap-3 cursor-default hover-lift group">
                    <div className="w-8 h-8 rounded bg-surface-bright flex items-center justify-center text-on-surface-variant group-hover:text-primary transition-colors">
                      <Bug size={18} />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-on-surface">QA Engineer</div>
                      <div className="text-[12px] font-mono text-on-surface-variant">Claude-3.5-Sonnet</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Category: Output */}
              <div>
                <h3 className="font-mono text-[12px] text-on-surface-variant mb-2 px-1 uppercase">Output</h3>
                <div className="space-y-2">
                  <div className="bg-surface border border-cyber-border p-2.5 rounded-lg flex items-center gap-3 cursor-default hover-lift group">
                    <div className="w-8 h-8 rounded bg-surface-bright flex items-center justify-center text-strategic-violet group-hover:text-primary transition-colors">
                      <FileText size={18} />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-on-surface">Doc Compiler</div>
                      <div className="text-[12px] font-mono text-on-surface-variant">Gemini-1.5-Pro</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Visual Canvas */}
        <section className="flex-1 bg-obsidian-deep relative overflow-hidden group">
          <div className="absolute inset-0" style={{
            backgroundImage: "linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px)",
            backgroundSize: "24px 24px"
          }}></div>

          {/* Canvas Toolbar Overlay */}
          <div className="absolute top-4 left-4 right-4 z-30 flex justify-between items-start pointer-events-none">
            <div className="bg-surface-container/80 backdrop-blur-md border border-cyber-border rounded-lg p-2 flex items-center gap-4 pointer-events-auto shadow-lg">
              <div className="flex flex-col px-2">
                <span className="text-sm font-semibold text-on-surface">Orchestration_Alpha_01</span>
                <span className="text-[12px] font-mono text-on-surface-variant">Static preview · TEST RUN executes a live pipeline</span>
              </div>
              <div className="w-px h-6 bg-cyber-border"></div>
              <ComingSoon label="Visual editing coming soon">
                <div className="flex items-center gap-2 px-2">
                  <span className="text-[12px] font-mono text-on-surface-variant">SIMULATION MODE</span>
                  <span className="w-10 h-5 rounded-full bg-primary-container relative block">
                    <span className="absolute right-1 top-0.5 w-4 h-4 bg-on-primary-fixed rounded-full shadow-sm block"></span>
                  </span>
                </div>
              </ComingSoon>
            </div>

            <div className="flex gap-2 pointer-events-auto">
              {workflowStatus && (
                <div className="flex items-center mr-4">
                  <span className="bg-surface-container bg-opacity-80 px-4 py-2 border border-cyber-border text-on-surface text-sm font-mono rounded inline-block animate-fade-in shadow-md">
                    {workflowStatus}
                  </span>
                </div>
              )}
              <ComingSoon label="Canvas zoom/pan coming soon">
                <div className="bg-surface-container/80 backdrop-blur-md border border-cyber-border rounded-lg flex items-center p-1 shadow-lg">
                  <span className="p-1.5 text-on-surface-variant"><Minus size={16}/></span>
                  <span className="text-[12px] font-mono text-on-surface px-2">100%</span>
                  <span className="p-1.5 text-on-surface-variant"><Plus size={16}/></span>
                  <span className="w-px h-4 bg-cyber-border mx-1"></span>
                  <span className="p-1.5 text-on-surface-variant"><Maximize size={16}/></span>
                </div>
              </ComingSoon>
              <button 
                onClick={executeWorkflow}
                disabled={running}
                className={`bg-surface-container/80 backdrop-blur-md border ${running ? 'border-secondary text-secondary' : 'border-cyber-border text-primary hover:bg-surface-variant'} rounded-lg px-4 py-2 font-mono text-[12px] font-bold transition-colors flex items-center gap-2 shadow-lg disabled:opacity-50`}
              >
                {running ? <Square size={14} className="animate-pulse" /> : <Play size={14} />}
                {running ? 'RUNNING...' : 'TEST RUN'}
              </button>
            </div>
          </div>

          {/* Node Connections (SVG) */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
            <path d="M 280 200 C 400 200, 400 320, 520 320" fill="none" stroke="var(--color-cyber-border)" strokeWidth="2"></path>
            <path className={`flow-line ${running ? 'animate-[dash_1s_linear_infinite]' : ''}`} d="M 820 320 C 940 320, 940 240, 1060 240" fill="none" stroke="var(--color-strategic-violet)" strokeWidth="3" strokeDasharray="10 5" strokeDashoffset="0"></path>
          </svg>

          {/* Nodes Container */}
          <div className="absolute inset-0 z-20 pointer-events-none">
            {/* Node 1: Web Researcher */}
            <div className={`absolute top-[140px] left-[40px] w-60 glass-panel hover-lift ${running ? 'border-secondary' : ''} rounded-xl pointer-events-auto`}>
              <div className="p-3 border-b border-cyber-border flex justify-between items-center bg-surface-bright/50 rounded-t-xl">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-telemetry-blue/20 flex items-center justify-center text-telemetry-blue">
                    <FileSearch size={14} />
                  </div>
                  <span className="text-sm font-semibold text-on-surface">Web Researcher</span>
                </div>
                <ComingSoon label="Node config coming soon"><span className="text-on-surface-variant"><MoreVertical size={16}/></span></ComingSoon>
              </div>
              <div className="p-3 space-y-3">
                <div>
                  <div className="font-mono text-on-surface-variant mb-1 text-[10px]">PRIMARY MODEL</div>
                  <div className="inline-block bg-surface-container-high border border-cyber-border px-2 py-0.5 rounded font-mono text-on-surface text-[11px]">Perplexity-Sonar</div>
                </div>
                <div className="text-sm text-on-surface-variant text-xs">Gathers competitive intel and API specs.</div>
              </div>
              <div className="absolute right-[-6px] top-1/2 -translate-y-1/2 w-3 h-3 bg-background border-2 border-cyber-border rounded-full cursor-crosshair hover:bg-telemetry-blue hover:border-telemetry-blue transition-colors"></div>
            </div>

            {/* Node 2: Core Coder */}
            <div className={`absolute top-[240px] left-[520px] w-72 glass-elevated ${running ? 'border-primary animate-pulse' : 'border-primary/50'} rounded-xl pulse-active pointer-events-auto`}>
              <div className="p-3 border-b border-cyber-border flex justify-between items-center bg-primary/5 rounded-t-xl">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-primary/20 flex items-center justify-center text-primary">
                    <Code2 size={14} />
                  </div>
                  <span className="text-sm font-semibold text-on-surface">Core Coder</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_var(--color-primary)] animate-pulse"></div>
                  <ComingSoon label="Node config coming soon"><span className="text-on-surface-variant"><MoreVertical size={16}/></span></ComingSoon>
                </div>
              </div>
              <div className="p-3 space-y-4">
                <div>
                  <div className="font-mono text-on-surface-variant mb-1 text-[10px]">PRIMARY MODEL</div>
                  <div className="inline-block bg-primary/10 border border-primary/30 px-2 py-0.5 rounded font-mono text-primary text-[11px] font-bold">DeepSeek-V4-Pro</div>
                </div>
                <div className="bg-obsidian-deep border border-cyber-border rounded p-2">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText size={14} className="text-strategic-violet" />
                    <span className="font-mono text-on-surface-variant text-[10px]">SYSTEM PROMPT</span>
                  </div>
                  <div className="font-mono text-on-surface text-[10px] truncate opacity-70">&quot;You are an expert systems engineer. Analyze input...&quot;</div>
                </div>
              </div>
              <div className="absolute left-[-6px] top-[80px] w-3 h-3 bg-background border-2 border-primary rounded-full cursor-crosshair"></div>
              <div className="absolute right-[-6px] top-[80px] w-3 h-3 bg-primary border-2 border-primary rounded-full cursor-crosshair shadow-[0_0_8px_var(--color-primary)]"></div>
            </div>

            {/* Node 3: QA Engineer */}
            <div className="absolute top-[180px] left-[1060px] w-64 glass-panel hover-lift rounded-xl pointer-events-auto">
              <div className="p-3 border-b border-cyber-border flex justify-between items-center bg-surface-bright/50 rounded-t-xl">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-surface-variant flex items-center justify-center text-on-surface-variant">
                    <Bug size={14} />
                  </div>
                  <span className="text-sm font-semibold text-on-surface">QA Engineer</span>
                </div>
                <ComingSoon label="Node config coming soon"><span className="text-on-surface-variant"><MoreVertical size={16}/></span></ComingSoon>
              </div>
              <div className="p-3 space-y-3">
                <div>
                  <div className="font-mono text-on-surface-variant mb-1 text-[10px]">PRIMARY MODEL</div>
                  <div className="inline-block bg-surface-container-high border border-cyber-border px-2 py-0.5 rounded font-mono text-on-surface text-[11px]">Claude-3.5-Sonnet</div>
                </div>
                <div className="text-sm text-on-surface-variant text-xs">Executes unit tests and linting rules.</div>
              </div>
              <div className="absolute left-[-6px] top-[60px] w-3 h-3 bg-background border-2 border-strategic-violet rounded-full cursor-crosshair"></div>
            </div>

          </div>
        </section>
      </main>
    </div>
  );
}
