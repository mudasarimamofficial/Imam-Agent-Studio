"use client";

import { useEffect, useState } from 'react';
import { TopNav } from '@/components/layout/TopNav';
import { Shield, Key, HardDrive, Users, Activity, Lock, AlertTriangle, Zap, DownloadCloud, Database, Server, Clock } from 'lucide-react';
import { AdminConfig } from '@/lib/types';
import { ComingSoon } from '@/components/ui/ComingSoon';

export default function AdminPage() {
  const [config, setConfig] = useState<AdminConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await fetch('/api/admin');
        const json = await res.json();
        if (json.data) {
          setConfig(json.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadConfig();
  }, []);

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    try {
      await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleConcurrencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (config) {
      setConfig({ ...config, agent_concurrency_limit: parseInt(e.target.value, 10) });
    }
  };

  const handleRoutingChange = (model: 'gemini' | 'nvidia', value: number) => {
    if (config) {
      setConfig({
        ...config,
        [model === 'gemini' ? 'routing_weight_gemini' : 'routing_weight_nvidia']: value
      });
    }
  };

  return (
    <div className="flex flex-col h-full bg-background relative overflow-hidden">
      
      {/* Background Effect */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <div className="absolute top-[10%] left-[60%] w-[600px] h-[600px] bg-primary/5 rounded-full blur-[150px]"></div>
      </div>

      <div className="relative z-10 flex flex-col h-full">
        <TopNav 
          title="System Admin & Settings"
          tabs={[
            'General',
            'Auth & Security',
            'API Keys',
            'Compute Usage',
            'Audit Logs',
          ]}
          activeTab="General"
        />

        <div className="flex-1 overflow-auto p-6 md:p-10">
          <div className="max-w-5xl mx-auto space-y-8">
            
            {/* Header */}
            <div>
              <h2 className="text-2xl font-bold font-sans tracking-tight text-on-surface">System Configuration</h2>
              <p className="text-on-surface-variant mt-2 max-w-2xl">
                Manage your self-hosted instance of Imam Agent Studio. Adjust memory constraints, update global LLM routing, and review system telemetrics.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left Column: Settings Nav */}
              <div className="lg:col-span-1 space-y-2">
                <div aria-current="page" className="p-3 bg-surface-elevated border-l-2 border-primary text-on-surface flex items-center gap-3 font-medium rounded-r-md">
                  <Server size={18} className="text-primary"/> Instance Compute
                </div>
                <ComingSoon label="Coming soon" className="w-full">
                  <div className="p-3 text-on-surface-variant flex items-center gap-3 font-medium rounded-md w-full">
                    <Key size={18} /> Model Secrets
                  </div>
                </ComingSoon>
                <ComingSoon label="Coming soon" className="w-full">
                  <div className="p-3 text-on-surface-variant flex items-center gap-3 font-medium rounded-md w-full">
                    <Lock size={18} /> Access Controls
                  </div>
                </ComingSoon>
                <ComingSoon label="Coming soon" className="w-full">
                  <div className="p-3 text-on-surface-variant flex items-center gap-3 font-medium rounded-md w-full">
                    <Database size={18} /> Memory Retention
                  </div>
                </ComingSoon>
                <ComingSoon label="Coming soon" className="w-full">
                  <div className="p-3 text-on-surface-variant flex items-center gap-3 font-medium rounded-md w-full">
                    <AlertTriangle size={18} /> Emergency Killswitch
                  </div>
                </ComingSoon>
              </div>

              {/* Right Column: Settings Content */}
              <div className="lg:col-span-2 space-y-8">
                
                {loading ? (
                  <div className="text-on-surface-variant animate-pulse font-mono flex items-center gap-2">
                    <Activity size={16} /> LOAD_SYS_CFG...
                  </div>
                ) : config && (
                  <>
                  {/* Section 1: Active Instance Details */}
                  <section className="glass-panel border-surface-border p-6 rounded-xl">
                    <h3 className="text-lg font-semibold text-on-surface mb-4 flex items-center gap-2">
                      <Activity size={18} className="text-primary"/> Node Allocation
                    </h3>
                    
                    <div className="space-y-6">
                      <div>
                        <div className="flex justify-between mb-2">
                          <label className="text-sm font-medium text-on-surface-variant">Global Agent Concurrency Limit</label>
                          <span className="text-sm font-mono text-primary">{config.agent_concurrency_limit} / 100 Agents</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="100"
                          value={config.agent_concurrency_limit}
                          onChange={handleConcurrencyChange}
                          className="w-full accent-primary bg-surface-elevated h-2 rounded-lg appearance-none cursor-pointer" 
                        />
                        <p className="text-xs text-on-surface-variant mt-2">Maximum number of autonomous agents allowed to process tasks simultaneously.</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-surface-border">
                          <div>
                            <label className="text-xs uppercase tracking-wider font-mono text-on-surface-variant mb-1 block">Memory Retention</label>
                            <div className="flex gap-2">
                               <input 
                                  type="number" 
                                  value={config.memory_retention_days}
                                  onChange={(e) => setConfig({...config, memory_retention_days: parseInt(e.target.value) || 30})}
                                  className="w-24 bg-surface-elevated border border-surface-border p-2 rounded text-sm text-on-surface font-mono" 
                               />
                               <span className="text-on-surface-variant self-center text-sm">Days</span>
                            </div>
                          </div>
                      </div>
                    </div>
                  </section>

                  {/* Section 2: Model Routing */}
                  <section className="glass-panel border-surface-border p-6 rounded-xl">
                     <h3 className="text-lg font-semibold text-on-surface mb-4 flex items-center gap-2">
                      <Zap size={18} className="text-secondary"/> Global LLM Routing Priority
                    </h3>
                    
                    <div className="space-y-4">
                      
                      <div className="group border border-surface-border rounded-lg p-4 hover:border-surface-border-hover transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-medium text-on-surface">Gemini (Google) Weight</h4>
                            <p className="text-sm text-on-surface-variant mt-1">Weight for routing tasks to Gemini models (0-1).</p>
                          </div>
                          <input 
                            type="number" 
                            step="0.1" 
                            min="0" 
                            max="1" 
                            value={config.routing_weight_gemini}
                            onChange={(e) => handleRoutingChange('gemini', parseFloat(e.target.value) || 0)}
                            className="bg-transparent border border-surface-border px-2 py-1 text-on-surface text-center rounded font-mono w-20 outline-none focus:border-primary"
                          />
                        </div>
                      </div>

                      <div className="group border border-surface-border rounded-lg p-4 hover:border-surface-border-hover transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-medium text-on-surface">NVIDIA NIM Weight</h4>
                            <p className="text-sm text-on-surface-variant mt-1">Weight for routing tasks to NVIDIA hosted models (0-1).</p>
                          </div>
                          <input 
                            type="number" 
                            step="0.1" 
                            min="0" 
                            max="1" 
                            value={config.routing_weight_nvidia}
                            onChange={(e) => handleRoutingChange('nvidia', parseFloat(e.target.value) || 0)}
                            className="bg-transparent border border-surface-border px-2 py-1 text-on-surface text-center rounded font-mono w-20 outline-none focus:border-primary"
                          />
                        </div>
                      </div>
                      
                    </div>
                  </section>

                  {/* Actions */}
                  <div className="flex justify-end gap-4 pt-4">
                    <button 
                      className="px-6 py-2 bg-transparent text-on-surface font-medium hover:bg-surface-elevated rounded transition-colors"
                      onClick={() => window.location.reload()}
                    >
                      Discard Changes
                    </button>
                    <button 
                      onClick={handleSave}
                      disabled={saving}
                      className="px-6 py-2 bg-primary text-background font-medium hover:brightness-110 rounded transition-colors shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)] disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : 'Save Configuration'}
                    </button>
                  </div>
                  </>
                )}

              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
