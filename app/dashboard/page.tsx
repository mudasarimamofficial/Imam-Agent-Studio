"use client";

import { useCallback, useEffect, useState } from 'react';
import {
  Terminal,
  CornerDownLeft,
  Workflow as WorkflowIcon,
  CheckCircle,
  XCircle,
  Loader2,
  Wallet,
  FolderOpen,
  Menu,
  FileText,
  Activity,
  Gauge
} from 'lucide-react';
import { MemoryEntry } from '@/lib/types';
import type { SystemStats } from '@/app/api/stats/route';

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return `${n}`;
}

function relativeTime(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function DashboardPage() {
  const [command, setCommand] = useState("");
  const [running, setRunning] = useState(false);
  const [lastResult, setLastResult] = useState<{ ok: boolean; text: string } | null>(null);
  const [memories, setMemories] = useState<MemoryEntry[]>([]);
  const [stats, setStats] = useState<SystemStats | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [memRes, statsRes] = await Promise.all([
        fetch('/api/memory?limit=50'),
        fetch('/api/stats'),
      ]);
      const memJson = await memRes.json();
      const statsJson = await statsRes.json();
      setMemories(memJson.data || []);
      if (statsJson.data) setStats(statsJson.data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
  }, [refresh]);

  const handleExecute = async () => {
    if (!command.trim() || running) return;
    setRunning(true);
    setLastResult(null);
    const cmd = command;
    setCommand("");
    try {
      const res = await fetch('/api/workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `Command: ${cmd.slice(0, 60)}`,
          nodes: [
            { id: 'n1', type: 'llm', input: cmd, status: 'pending' }
          ]
        })
      });
      const json = await res.json();
      if (json.success && json.data?.nodes?.[0]?.output) {
        setLastResult({ ok: true, text: json.data.nodes[0].output });
      } else {
        setLastResult({ ok: false, text: json.error?.message || 'Execution failed' });
      }
    } catch (e) {
      console.error(e);
      setLastResult({ ok: false, text: 'Network error during execution' });
    } finally {
      setRunning(false);
      refresh();
    }
  };

  const healthy = stats ? stats.errors_24h === 0 && stats.agents.error === 0 : true;

  return (
    <div className="flex-1 flex flex-col h-full bg-background relative overflow-hidden">
      {/* TopNavBar (Mobile Only) */}
      <header className="md:hidden flex justify-between items-center px-4 h-16 w-full sticky top-0 z-50 bg-surface/80 text-primary border-b border-cyber-border backdrop-blur-2xl">
        <div className="font-bold text-on-surface text-lg">IAS</div>
        <button className="text-on-surface-variant hover:text-primary transition-all" aria-label="Menu">
          <Menu size={24} />
        </button>
      </header>

      {/* Dynamic Grid Layout */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden p-6 gap-6 max-w-[1920px] mx-auto w-full">

        {/* Center Column: Command Flow */}
        <section className="flex-1 flex flex-col min-w-0 gap-6 h-full">
          {/* Executive Command Input */}
          <div className="glass-panel rounded-xl p-1 shrink-0 flex items-center px-4 h-[60px] relative focus-within:pulse-active transition-all duration-300">
            <Terminal size={20} className="text-primary mr-3" />
            <input
              className="w-full bg-transparent border-none text-on-surface font-mono text-sm focus:ring-0 placeholder-on-surface-variant/50 outline-none"
              placeholder="Enter command or intent..."
              type="text"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleExecute()}
              disabled={running}
            />
            <button
              onClick={handleExecute}
              disabled={running || !command.trim()}
              className="ml-2 bg-surface-variant/50 hover:bg-surface-variant px-2 py-1 rounded text-on-surface-variant font-mono text-[10px] flex items-center gap-1 border border-cyber-border transition-colors uppercase disabled:opacity-50"
            >
              {running ? <Activity size={14} className="animate-spin text-primary" /> : <CornerDownLeft size={14} />} Execute
            </button>
          </div>

          {/* Active Operations Flow — live workflows from the database */}
          <div className="glass-panel rounded-xl flex-1 flex flex-col overflow-hidden relative">
            <div className="px-4 py-3 border-b border-cyber-border flex justify-between items-center shrink-0 bg-surface-container-low/50">
              <h2 className="font-mono text-on-surface-variant uppercase tracking-widest text-[10px]">Active Operations Flow</h2>
              {(running || (stats?.workflows.running ?? 0) > 0) && (
                <span className="flex items-center gap-1 text-primary font-mono text-[10px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                  IN-FLIGHT
                </span>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 relative z-10 terminal-scroll">
              {lastResult && (
                <div className={`glass-panel rounded-lg p-4 border ${lastResult.ok ? 'border-primary/30 bg-primary/5' : 'border-error/30 bg-error/5'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <div className={`font-mono ${lastResult.ok ? 'text-primary' : 'text-error'}`}>
                      {lastResult.ok ? 'Command Result' : 'Command Failed'}
                    </div>
                    <button onClick={() => setLastResult(null)} className="text-on-surface-variant text-xs hover:text-on-surface">dismiss</button>
                  </div>
                  <div className="text-[13px] text-on-surface opacity-90 whitespace-pre-wrap max-h-64 overflow-y-auto terminal-scroll">{lastResult.text}</div>
                </div>
              )}

              {!stats || stats.workflows.recent.length === 0 ? (
                <div className="text-on-surface-variant font-mono text-sm text-center mt-10">
                  {stats ? 'No operations yet. Execute a command to begin.' : 'Loading operations...'}
                </div>
              ) : stats.workflows.recent.map((wf) => (
                <div key={wf.id} className="flex items-start gap-4">
                  <div className="relative shrink-0 flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full border-2 bg-surface flex items-center justify-center z-10 ${
                      wf.status === 'completed' ? 'border-primary text-primary' :
                      wf.status === 'running' ? 'border-telemetry-blue text-telemetry-blue' :
                      wf.status === 'failed' ? 'border-error text-error' :
                      'border-cyber-border text-on-surface-variant'
                    }`}>
                      {wf.status === 'running' ? <Loader2 size={20} className="animate-spin" /> :
                       wf.status === 'completed' ? <CheckCircle size={20} /> :
                       wf.status === 'failed' ? <XCircle size={20} /> :
                       <WorkflowIcon size={20} />}
                    </div>
                  </div>
                  <div className={`flex-1 glass-panel rounded-lg p-4 border ${
                    wf.status === 'completed' ? 'border-primary/30 bg-primary/5' :
                    wf.status === 'running' ? 'border-telemetry-blue/30 bg-telemetry-blue/5' :
                    wf.status === 'failed' ? 'border-error/30 bg-error/5' :
                    'border-cyber-border'
                  }`}>
                    <div className="flex justify-between items-start mb-1">
                      <div className={`font-mono text-sm truncate pr-2 ${
                        wf.status === 'completed' ? 'text-primary' :
                        wf.status === 'running' ? 'text-telemetry-blue' :
                        wf.status === 'failed' ? 'text-error' : 'text-on-surface'
                      }`}>{wf.name}</div>
                      <span className="text-xs text-on-surface-variant whitespace-nowrap">{relativeTime(wf.created_at)}</span>
                    </div>
                    <div className="font-mono text-[11px] text-on-surface-variant uppercase tracking-wider">{wf.status}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Real-time Terminal Log */}
          <div className="glass-panel rounded-xl h-48 shrink-0 flex flex-col overflow-hidden bg-obsidian-deep">
            <div className="px-4 py-2 border-b border-cyber-border flex justify-between items-center bg-surface-container-low/50">
              <h2 className="font-mono text-on-surface-variant uppercase tracking-widest text-[10px]">Memory Telemetry Stream</h2>
              <span className="font-mono text-[10px] text-on-surface-variant">{memories.length} entries</span>
            </div>
            <div className="flex-1 p-3 font-mono text-[11px] text-on-surface-variant overflow-y-auto terminal-scroll whitespace-pre-wrap leading-relaxed tracking-wider flex flex-col-reverse">
              <span className="text-on-surface animate-pulse">_</span>
              {memories.map((log) => (
                 <div key={log.id} className="mb-1">
                   <span className="text-primary">[{new Date(log.created_at).toLocaleTimeString()}]</span> SYS: {log.agent_label} completed {log.type}: <span className="text-on-surface opacity-80">{log.content.substring(0, 100)}{log.content.length > 100 ? '...' : ''}</span>
                 </div>
              ))}
              <div className="mb-1 text-telemetry-blue">SYS: Agent Telemetry Interface online.</div>
            </div>
          </div>
        </section>

        {/* Right Column: System Intelligence */}
        <aside className="w-full lg:w-[320px] flex flex-col gap-6 shrink-0">
          {/* Compute Usage — real inference telemetry */}
          <div className="glass-panel rounded-xl p-4 flex flex-col gap-4">
            <div className="flex justify-between items-center mb-1">
              <h3 className="font-mono text-on-surface-variant uppercase tracking-widest text-[10px]">Compute Usage</h3>
              <Wallet size={16} className="text-on-surface-variant" />
            </div>
            <div>
              <div className="flex justify-between items-end mb-1">
                <span className="font-display text-4xl font-bold text-on-surface">{stats ? formatTokens(stats.tokens.lifetime) : '—'}</span>
                <span className="font-mono text-[11px] text-on-surface-variant">est. tokens (lifetime)</span>
              </div>
              <div className="w-full h-1.5 bg-surface-variant rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-agent-active-glow transition-all"
                  style={{ width: `${stats && stats.tokens.lifetime > 0 ? Math.round((stats.tokens.today / stats.tokens.lifetime) * 100) : 0}%` }}
                ></div>
              </div>
              <div className="font-mono text-[10px] text-on-surface-variant mt-1">{stats ? formatTokens(stats.tokens.today) : '0'} today</div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div className="bg-surface-container-low p-2 rounded border border-cyber-border">
                <div className="font-mono text-[11px] text-on-surface-variant mb-1">INFERENCES</div>
                <div className="font-mono text-[12px] text-on-surface">{stats?.inferences.lifetime ?? '—'}</div>
              </div>
              <div className="bg-surface-container-low p-2 rounded border border-cyber-border">
                <div className="font-mono text-[11px] text-on-surface-variant mb-1">MEMORIES</div>
                <div className="font-mono text-[12px] text-on-surface">{stats?.memories.total ?? '—'}</div>
              </div>
              <div className="bg-surface-container-low p-2 rounded border border-cyber-border col-span-2">
                <div className="font-mono text-[11px] text-on-surface-variant mb-1">AVG LATENCY</div>
                <div className="font-mono text-[12px] text-on-surface">
                  {stats?.inferences.avg_latency_ms != null ? `${stats.inferences.avg_latency_ms} ms` : 'No inferences yet'}
                </div>
              </div>
            </div>
          </div>

          {/* Recent Artifacts — completed workflow outputs */}
          <div className="glass-panel rounded-xl p-4 flex-1 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-mono text-on-surface-variant uppercase tracking-widest text-[10px]">Completed Operations</h3>
              <FolderOpen size={16} className="text-on-surface-variant" />
            </div>
            <div className="flex flex-col gap-2 flex-1 overflow-y-auto terminal-scroll">
              {!stats || stats.workflows.recent.filter(w => w.status === 'completed').length === 0 ? (
                <div className="text-on-surface-variant font-mono text-[11px] text-center mt-6">No completed operations yet.</div>
              ) : stats.workflows.recent.filter(w => w.status === 'completed').map((wf) => (
                <div key={wf.id} className="group flex items-center gap-3 p-2 rounded hover:bg-surface-variant/30 transition-colors border border-transparent hover:border-cyber-border">
                  <div className="w-8 h-8 rounded bg-surface border border-cyber-border flex items-center justify-center text-primary group-hover:bg-primary/10 transition-colors">
                    <FileText size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-[12px] text-on-surface truncate">{wf.name}</div>
                    <div className="font-mono text-[11px] text-on-surface-variant">{wf.completed_at ? relativeTime(wf.completed_at) : ''}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* System Health HUD — real status */}
          <div className="glass-panel rounded-xl p-4 flex flex-col shrink-0">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-mono text-on-surface-variant uppercase tracking-widest text-[10px]">System Health</h3>
              <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded border ${healthy ? 'bg-primary/10 border-primary/20' : 'bg-warning/10 border-warning/20'}`}>
                <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${healthy ? 'bg-primary' : 'bg-warning'}`}></span>
                <span className={`font-mono text-[11px] ${healthy ? 'text-primary' : 'text-warning'}`}>{healthy ? 'OPTIMAL' : 'DEGRADED'}</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-mono text-[11px] text-on-surface-variant">Agents Online</span>
                <span className="font-mono text-[12px] text-on-surface">
                  {stats ? `${stats.agents.active + stats.agents.running}/${stats.agents.total}` : '—'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-mono text-[11px] text-on-surface-variant">Errors (24h)</span>
                <span className={`font-mono text-[12px] ${stats && stats.errors_24h > 0 ? 'text-error' : 'text-on-surface'}`}>{stats?.errors_24h ?? '—'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-mono text-[11px] text-on-surface-variant flex items-center gap-1"><Gauge size={11} /> Concurrency</span>
                <span className="font-mono text-[12px] text-on-surface">
                  {stats ? `${stats.agents.running}/${stats.agents.limit}` : '—'}
                </span>
              </div>
            </div>
          </div>

        </aside>
      </div>
    </div>
  );
}
