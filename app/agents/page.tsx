"use client";

import { useEffect, useState } from 'react';
import { TopNav } from '@/components/layout/TopNav';
import { Activity, Box, Radio, Zap, ShieldAlert, Plus, MoreVertical, Play, Square, Settings, Database, Clock } from 'lucide-react';
import { Agent } from '@/lib/types';

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

  useEffect(() => {
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

  const triggerTask = async (agentId: string) => {
    // Optimistic UI update could be added here
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
              <div className="flex gap-3">
                <button
                  className="flex items-center gap-2 px-4 py-2 rounded-md font-mono text-xs uppercase tracking-wider opacity-50 cursor-not-allowed bg-black/40 backdrop-blur-xl border border-white/10 text-on-surface shadow-none"
                  disabled
                  title="Coming Soon"
                >
                  <Database size={14} />
                  Connect MCP
                </button>
                <button
                  className="flex items-center gap-2 px-4 py-2 rounded-md font-mono text-xs uppercase tracking-wider opacity-50 cursor-not-allowed bg-black/40 backdrop-blur-xl border border-white/10 text-on-surface shadow-none"
                  disabled
                  title="Coming Soon"
                >
                  <Plus size={14} />
                  Spawn Agent
                </button>
              </div>
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
                    <button className="text-on-surface-variant hover:text-on-surface">
                      <MoreVertical size={16} />
                    </button>
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
                    <div className="flex gap-2">
                      <button className="p-1.5 text-on-surface-variant hover:text-on-surface hover:bg-surface-elevated rounded transition-colors" title="Settings">
                        <Settings size={14} />
                      </button>
                      {agent.status === 'active' || agent.status === 'running' || agent.status === 'idle' ? (
                        <button className="p-1.5 text-warning hover:text-warning/80 hover:bg-warning/10 rounded transition-colors" title="Stop">
                           <Square size={14} fill="currentColor" />
                        </button>
                      ) : null }
                      {agent.status !== 'running' && (
                         <button onClick={() => triggerTask(agent.id)} className="p-1.5 text-primary hover:text-primary/80 hover:bg-primary/10 rounded transition-colors" title="Test Action">
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
    </div>
  );
}

