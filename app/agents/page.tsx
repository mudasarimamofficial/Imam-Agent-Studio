"use client";

import { useEffect, useState } from 'react';
import { TopNav } from '@/components/layout/TopNav';
import { Activity, Box, Radio, Zap, ShieldAlert, Plus, Play, Database, Clock, X, Loader2, RotateCw } from 'lucide-react';
import { Agent } from '@/lib/types';

const MODEL_OPTIONS = [
  'gemini-2.5-flash',
  'gemini-2.5-pro',
  'meta/llama-3.3-70b-instruct',
  'meta/llama-3.1-70b-instruct',
];

const STAGES = [
  "Provisioning secure sandbox...",
  "Loading designated models...",
  "Establishing A2A & MCP connections...",
  "Finalizing deployment..."
];

function relativeTime(iso: string | null): string {
  if (!iso) return 'Never';
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [capacityLimit, setCapacityLimit] = useState<number | null>(null);

  // Spawn modal state
  const [spawnOpen, setSpawnOpen] = useState(false);
  const [spawnName, setSpawnName] = useState("");
  const [spawnRole, setSpawnRole] = useState("");
  const [spawnModel, setSpawnModel] = useState(MODEL_OPTIONS[0]);
  const [spawnStage, setSpawnStage] = useState<number>(-1);
  const [spawnError, setSpawnError] = useState<string | null>(null);

  async function fetchAgents() {
    try {
      const res = await fetch('/api/agents');
      const json = await res.json();
      setAgents(json.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    async function fetchLimit() {
      try {
        const res = await fetch('/api/admin');
        const json = await res.json();
        if (json.data) setCapacityLimit(json.data.agent_concurrency_limit);
      } catch (err) {
        console.error(err);
      }
    }
    fetchAgents();
    fetchLimit();

    // Poll every 3 seconds to keep UI up to date with running status
    const interval = setInterval(fetchAgents, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleSpawn = async () => {
    if (spawnStage >= 0 || !spawnName.trim()) return;
    setSpawnError(null);
    setSpawnStage(0);
    
    try {
      // Simulate staging for visual feedback (provisioning pipeline)
      for (let i = 1; i < STAGES.length; i++) {
        await new Promise(r => setTimeout(r, 600));
        setSpawnStage(i);
      }

      const res = await fetch('/api/agents', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: spawnName.trim(), role: spawnRole.trim(), model: spawnModel }),
      });
      const json = await res.json();
      
      if (!json.success) {
        setSpawnError(json.error?.message || 'Failed to spawn agent');
        setSpawnStage(-1);
      } else {
        await new Promise(r => setTimeout(r, 400));
        setSpawnOpen(false);
        setSpawnName("");
        setSpawnRole("");
        setSpawnModel(MODEL_OPTIONS[0]);
        setSpawnStage(-1);
        await fetchAgents();
      }
    } catch {
      setSpawnError('Network error while spawning agent');
      setSpawnStage(-1);
    }
  };

  const restartAgent = async (agentId: string) => {
    try {
      await fetch('/api/agents', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent_id: agentId, status: 'idle' }),
      });
      await fetchAgents();
    } catch (e) {
      console.error(e);
    }
  };

  const triggerTask = async (agentId: string) => {
    try {
      await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_id: agentId,
          instruction: "Perform a routine status check and optimize your current state.",
          task_type: "fast_action"
        })
      });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background relative overflow-hidden">
      
      {/* Background Effect */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <div className="absolute top-[20%] left-[20%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[20%] right-[20%] w-[400px] h-[400px] bg-secondary/10 rounded-full blur-[100px]"></div>
      </div>

      <div className="relative z-10 flex flex-col h-full">
        <TopNav 
          title="Agent Fleet Command"
          tabs={[
            'Active Roster',
            'Blueprints',
            'MCP Servers',
            'System Logs',
          ]}
          activeTab="Active Roster"
        />

        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-[1600px] mx-auto space-y-6">
            
            {/* Header Actions */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold font-sans tracking-tight text-on-surface">Agent Deployment Roster</h2>
                <p className="text-sm font-mono text-on-surface-variant flex items-center gap-2 mt-1">
                  <Activity size={14} className="text-primary animate-pulse" />
                  Fleet Capacity: {agents.length}{capacityLimit !== null ? `/${capacityLimit}` : ''} Instances · {agents.filter(a => a.status === 'running').length} running
                </p>
              </div>
              <button
                onClick={() => { setSpawnError(null); setSpawnOpen(true); }}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary-fixed hover:brightness-110 rounded-md font-mono text-xs uppercase tracking-wider transition-all"
              >
                <Plus size={14} />
                Spawn Agent
              </button>
            </div>

            {/* Agent Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
              {loading && agents.length === 0 ? (
                <div className="text-on-surface-variant font-mono p-4">Loading agents...</div>
              ) : agents.map((agent) => (
                <div key={agent.id} className={`glass-panel hover-lift p-5 rounded-xl group flex flex-col ${agent.status === 'running' ? 'pulse-active' : ''}`}>
                  
                  {/* Card Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex gap-3">
                      <div className={`p-2 rounded-lg bg-surface-elevated flex-shrink-0 ${agent.status === 'active' || agent.status === 'running' ? 'text-primary' : agent.status === 'error' ? 'text-error' : 'text-on-surface-variant'}`}>
                        {agent.status === 'active' || agent.status === 'running' ? <Zap size={20} /> : agent.status === 'error' ? <ShieldAlert size={20} /> : <Box size={20} />}
                      </div>
                      <div>
                        <h3 className="text-on-surface font-semibold tracking-tight leading-tight group-hover:text-primary transition-colors">{agent.name}</h3>
                        <p className="text-on-surface-variant text-xs font-mono mt-1">{agent.role}</p>
                      </div>
                    </div>
                  </div>

                  {/* Status Bar */}
                  <div className="flex items-center gap-2 mb-4">
                    <span className={`w-2 h-2 rounded-full ${agent.status === 'active' ? 'bg-primary shadow-[0_0_8px_rgba(var(--primary-rgb),0.8)]' : agent.status === 'running' ? 'bg-secondary animate-bounce' : agent.status === 'idle' ? 'bg-warning' : agent.status === 'error' ? 'bg-error animate-pulse' : 'bg-surface-border'}`}></span>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-on-surface-variant">
                      {agent.status} - {agent.model}
                    </span>
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-2 gap-3 mb-6 mt-auto">
                    <div className="bg-surface-elevated/50 border border-surface-border rounded p-2">
                      <div className="text-[10px] text-on-surface-variant uppercase tracking-wider mb-1 flex justify-between">
                        <span>Tasks Completed</span>
                        <Database size={12} />
                      </div>
                      <div className="text-sm font-mono text-on-surface">{agent.tasks_completed}</div>
                    </div>
                    <div className="bg-surface-elevated/50 border border-surface-border rounded p-2">
                      <div className="text-[10px] text-on-surface-variant uppercase tracking-wider mb-1 flex justify-between">
                        <span>Last Active</span>
                        <Clock size={12} />
                      </div>
                      <div className="text-sm font-mono text-on-surface">{relativeTime(agent.last_active_at)}</div>
                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="flex justify-between items-center pt-4 border-t border-surface-border">
                    <div className="text-[10px] text-on-surface-variant uppercase tracking-widest flex items-center gap-1">
                      <Radio size={12} /> {agent.id}
                    </div>
                    <div className="flex gap-2 items-center">
                      {agent.status === 'error' && (
                        <button onClick={() => restartAgent(agent.id)} className="flex items-center gap-1 px-2 py-1 text-warning hover:bg-warning/10 rounded transition-colors font-mono text-[10px] uppercase tracking-wider" title="Restart / diagnose">
                          <RotateCw size={13} /> Restart
                        </button>
                      )}
                      {agent.status !== 'running' && agent.status !== 'error' && (
                         <button onClick={() => triggerTask(agent.id)} className="p-1.5 text-primary hover:text-primary/80 hover:bg-primary/10 rounded transition-colors" title="Run a test task">
                            <Play size={14} fill="currentColor" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>

      {/* Spawn Agent Modal */}
      {spawnOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-obsidian-deep/70 backdrop-blur-sm animate-fade-in"
          onClick={() => spawnStage === -1 && setSpawnOpen(false)}
        >
          <div
            className="glass-elevated rounded-2xl w-full max-w-md p-6 relative overflow-hidden transition-all duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`transition-opacity duration-300 ${spawnStage >= 0 ? 'opacity-0 pointer-events-none absolute inset-0' : 'opacity-100 relative'}`}>
              <div className="flex items-start justify-between mb-5">
                <div>
                  <h3 className="text-lg font-bold text-on-surface">Spawn Agent</h3>
                  <p className="font-mono text-[11px] text-on-surface-variant mt-1">Deploy a new instance to your fleet</p>
                </div>
                <button onClick={() => setSpawnOpen(false)} className="text-on-surface-variant hover:text-on-surface" aria-label="Close">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="spawn-name" className="font-mono text-[11px] text-on-surface-variant uppercase tracking-wider block mb-2">Name</label>
                  <input
                    id="spawn-name"
                    value={spawnName}
                    onChange={(e) => setSpawnName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSpawn()}
                    placeholder="e.g. Research Scout"
                    autoFocus
                    className="w-full bg-surface-container-low border border-cyber-border rounded-lg px-3 py-2.5 text-sm text-on-surface placeholder-on-surface-variant/40 outline-none focus:border-primary/60 transition-colors"
                  />
                </div>
                <div>
                  <label htmlFor="spawn-role" className="font-mono text-[11px] text-on-surface-variant uppercase tracking-wider block mb-2">Role <span className="opacity-50">(optional)</span></label>
                  <input
                    id="spawn-role"
                    value={spawnRole}
                    onChange={(e) => setSpawnRole(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSpawn()}
                    placeholder="e.g. Market Research"
                    className="w-full bg-surface-container-low border border-cyber-border rounded-lg px-3 py-2.5 text-sm text-on-surface placeholder-on-surface-variant/40 outline-none focus:border-primary/60 transition-colors"
                  />
                </div>
                <div>
                  <label htmlFor="spawn-model" className="font-mono text-[11px] text-on-surface-variant uppercase tracking-wider block mb-2">Model</label>
                  <select
                    id="spawn-model"
                    value={spawnModel}
                    onChange={(e) => setSpawnModel(e.target.value)}
                    className="w-full bg-surface-container-low border border-cyber-border rounded-lg px-3 py-2.5 text-sm text-on-surface outline-none focus:border-primary/60 transition-colors font-mono"
                  >
                    {MODEL_OPTIONS.map((m) => <option key={m} value={m} className="bg-surface-container">{m}</option>)}
                  </select>
                </div>

                {spawnError && (
                  <div role="alert" className="text-[13px] rounded-lg px-3 py-2 border border-error/30 bg-error/10 text-error font-mono">
                    {spawnError}
                  </div>
                )}

                <button
                  onClick={handleSpawn}
                  disabled={!spawnName.trim()}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary text-on-primary-fixed font-mono text-[13px] font-bold uppercase tracking-wider hover:brightness-110 transition-all disabled:opacity-50 mt-2"
                >
                  <Plus size={16} />
                  Deploy Agent
                </button>
              </div>
            </div>

            {/* Staging Overlay */}
            {spawnStage >= 0 && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 bg-surface/90 backdrop-blur-md animate-fade-in text-center">
                <div className="relative mb-6">
                  <div className="w-16 h-16 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Database size={20} className="text-primary animate-pulse" />
                  </div>
                </div>
                <h3 className="font-mono text-sm text-primary uppercase tracking-widest mb-2">Agent Provisioning</h3>
                <div className="h-6 overflow-hidden">
                  <p key={spawnStage} className="font-mono text-[11px] text-on-surface-variant animate-slide-up">
                    {STAGES[spawnStage]}
                  </p>
                </div>
                <div className="w-full bg-surface-border h-1 rounded-full mt-4 overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-500 ease-out" 
                    style={{ width: `${((spawnStage + 1) / STAGES.length) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
