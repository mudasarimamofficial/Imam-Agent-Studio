"use client";

import { useState } from 'react';
import { TopNav } from '@/components/layout/TopNav';
import {
  Database,
  Cpu,
  Wrench,
  Globe,
  FileText,
  Play,
  Square,
  Eye,
} from 'lucide-react';

// The four node types the engine can actually execute (lib/workflow/engine.ts).
const NODE_LIBRARY = [
  { type: 'llm', label: 'LLM Reasoner', icon: Cpu, model: 'Gemini / Llama (hybrid router)', accent: 'text-primary', desc: 'Routes a prompt through the weighted Gemini/NVIDIA router.' },
  { type: 'memory', label: 'Memory Recall', icon: Database, model: 'Supabase keyword search', accent: 'text-telemetry-blue', desc: 'Searches your persisted memory store for matching context.' },
  { type: 'tool', label: 'Tool Runner', icon: Wrench, model: 'Sandboxed registry', accent: 'text-strategic-violet', desc: 'Runs a sandboxed tool: calc, timestamp, echo, uppercase, word_count.' },
  { type: 'api', label: 'API Fetch', icon: Globe, model: 'Guarded HTTP GET', accent: 'text-agent-active-glow', desc: 'Fetches a public URL (SSRF-guarded, 15s timeout).' },
];

// Mirrors the live TEST RUN pipeline below, node-for-node.
const PIPELINE = [
  { id: 'recall', type: 'memory', title: 'Memory Recall', icon: Database, model: 'Supabase search', detail: 'Pulls prior context matching "agent".' },
  { id: 'reason', type: 'llm', title: 'LLM Reasoner', icon: Cpu, model: 'Gemini / Llama', detail: 'Drafts a short technical summary from context.' },
  { id: 'review', type: 'llm', title: 'LLM Reviewer', icon: FileText, model: 'Gemini / Llama', detail: 'Tightens and reviews the draft.' },
];

export default function WorkflowPage() {
  const [running, setRunning] = useState(false);
  const [workflowStatus, setWorkflowStatus] = useState<string | null>(null);

  const executeWorkflow = async () => {
    if (running) return;
    setRunning(true);
    setWorkflowStatus("Booting engine...");

    try {
      const res = await fetch('/api/workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: "Orchestration_Alpha_01",
          nodes: [
            { id: 'recall', type: 'memory', input: 'agent', output: '', status: 'pending' },
            { id: 'reason', type: 'llm', input: 'Draft a concise technical summary from the prior context.', output: '', status: 'pending' },
            { id: 'review', type: 'llm', input: 'Review and tighten the draft into 2 sentences.', output: '', status: 'pending' },
          ]
        })
      });
      const data = await res.json();
      if (data.success && data.data?.status === "completed") {
        setWorkflowStatus("Success — pipeline executed against the live engine.");
      } else {
        setWorkflowStatus(data.error?.message || "Workflow execution failed.");
      }
    } catch (e) {
      console.error(e);
      setWorkflowStatus("System exception");
    } finally {
      setRunning(false);
      setTimeout(() => setWorkflowStatus(null), 6000);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full relative overflow-hidden bg-background">
      <TopNav title="Architect" tabs={['Pipeline Viewer']} activeTab="Pipeline Viewer" />

      <main className="flex-1 flex overflow-hidden">
        {/* Node Library */}
        <aside className="w-72 glass-panel border-r border-cyber-border flex flex-col h-full z-20 shrink-0">
          <div className="p-4 border-b border-cyber-border">
            <h2 className="font-bold text-on-surface text-xl mb-1">Node Library</h2>
            <p className="font-mono text-[12px] text-on-surface-variant">4 executable node types</p>
          </div>
          <div className="p-3 space-y-2 overflow-y-auto terminal-scroll">
            {NODE_LIBRARY.map((n) => {
              const Icon = n.icon;
              return (
                <div key={n.type} className="bg-surface border border-cyber-border p-3 rounded-lg hover-lift">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-8 h-8 rounded bg-surface-bright flex items-center justify-center ${n.accent}`}>
                      <Icon size={18} />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-on-surface">{n.label}</div>
                      <div className="text-[11px] font-mono text-on-surface-variant">{n.model}</div>
                    </div>
                  </div>
                  <p className="text-[11px] text-on-surface-variant leading-relaxed">{n.desc}</p>
                </div>
              );
            })}
          </div>
        </aside>

        {/* Pipeline Canvas */}
        <section className="flex-1 bg-obsidian-deep relative overflow-hidden">
          <div className="absolute inset-0" style={{
            backgroundImage: "linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px)",
            backgroundSize: "24px 24px"
          }}></div>

          {/* Toolbar */}
          <div className="absolute top-4 left-4 right-4 z-30 flex justify-between items-start gap-3">
            <div className="glass-panel rounded-lg p-2 flex items-center gap-3">
              <div className="flex flex-col px-2">
                <span className="text-sm font-semibold text-on-surface">Orchestration_Alpha_01</span>
                <span className="text-[11px] font-mono text-on-surface-variant flex items-center gap-1">
                  <Eye size={11} /> Read-only viewer · TEST RUN hits the live engine
                </span>
              </div>
            </div>

            <div className="flex gap-2 items-center">
              {workflowStatus && (
                <span className="glass-panel px-4 py-2 text-on-surface text-sm font-mono rounded-lg animate-fade-in max-w-md truncate">
                  {workflowStatus}
                </span>
              )}
              <button
                onClick={executeWorkflow}
                disabled={running}
                className={`glass-panel rounded-lg px-4 py-2 font-mono text-[12px] font-bold transition-all flex items-center gap-2 disabled:opacity-50 ${running ? 'text-secondary' : 'text-primary hover:brightness-110'}`}
              >
                {running ? <Square size={14} className="animate-pulse" /> : <Play size={14} />}
                {running ? 'RUNNING...' : 'TEST RUN'}
              </button>
            </div>
          </div>

          {/* Linear pipeline of the three real nodes */}
          <div className="absolute inset-0 flex items-center justify-center px-8">
            <div className="flex items-center gap-4 flex-wrap justify-center">
              {PIPELINE.map((node, i) => {
                const Icon = node.icon;
                return (
                  <div key={node.id} className="flex items-center gap-4">
                    <div className={`w-60 glass-elevated rounded-xl p-4 ${running ? 'pulse-active' : ''}`}>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-7 h-7 rounded bg-primary/15 flex items-center justify-center text-primary">
                          <Icon size={15} />
                        </div>
                        <span className="text-sm font-semibold text-on-surface">{node.title}</span>
                        <span className="ml-auto font-mono text-[9px] uppercase tracking-wider text-on-surface-variant border border-cyber-border rounded px-1.5 py-0.5">{node.type}</span>
                      </div>
                      <div className="font-mono text-[10px] text-on-surface-variant mb-1">MODEL / ENGINE</div>
                      <div className="inline-block bg-surface-container-high border border-cyber-border px-2 py-0.5 rounded font-mono text-on-surface text-[11px] mb-2">{node.model}</div>
                      <p className="text-[11px] text-on-surface-variant leading-relaxed">{node.detail}</p>
                    </div>
                    {i < PIPELINE.length - 1 && (
                      <div className={`h-px w-8 ${running ? 'bg-primary' : 'bg-cyber-border'} transition-colors`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
