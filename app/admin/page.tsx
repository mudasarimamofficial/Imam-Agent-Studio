"use client";

import { useEffect, useState } from 'react';
import { TopNav } from '@/components/layout/TopNav';
import { Activity, Zap, Server, Key, Check, Loader2, Eye, EyeOff, ShieldAlert, Shield } from 'lucide-react';
import { useWorkspace, Role } from '@/components/layout/WorkspaceContext';

interface AdminState {
  agent_concurrency_limit: number;
  memory_retention_days: number;
  routing_weight_gemini: number;
  routing_weight_nvidia: number;
  keys: {
    gemini: boolean; nvidia: boolean; places: boolean;
    gemini_user: boolean; nvidia_user: boolean; places_user: boolean;
  };
}

type Section = 'compute' | 'keys' | 'workspace';

const KEY_FIELDS = [
  { col: 'gemini_api_key', label: 'Gemini API Key', flag: 'gemini', userFlag: 'gemini_user', hint: 'Google AI Studio key (reasoning/planning).' },
  { col: 'nvidia_api_key', label: 'NVIDIA API Key', flag: 'nvidia', userFlag: 'nvidia_user', hint: 'NVIDIA NIM key (fast Llama inference).' },
  { col: 'google_places_api_key', label: 'Google Places API Key', flag: 'places', userFlag: 'places_user', hint: 'Powers the Client Hunt Engine.' },
] as const;

export default function AdminPage() {
  const { role, workspaceName, setRole, setWorkspaceName } = useWorkspace();
  const [config, setConfig] = useState<AdminState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [section, setSection] = useState<Section>('compute');

  // Key inputs (write-only; never pre-filled with real values)
  const [keyInputs, setKeyInputs] = useState<Record<string, string>>({});
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});
  const [keySaving, setKeySaving] = useState(false);
  const [keySaved, setKeySaved] = useState(false);

  // Local state for workspace form
  const [wsNameInput, setWsNameInput] = useState(workspaceName);
  const [wsRoleInput, setWsRoleInput] = useState<Role>(role);
  const [wsSaved, setWsSaved] = useState(false);

  const loadConfig = async () => {
    try {
      const res = await fetch('/api/admin');
      const json = await res.json();
      if (json.data) setConfig(json.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  const handleSave = async () => {
    if (!config || role !== 'Admin') return;
    setSaving(true);
    try {
      await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_concurrency_limit: config.agent_concurrency_limit,
          memory_retention_days: config.memory_retention_days,
          routing_weight_gemini: config.routing_weight_gemini,
          routing_weight_nvidia: config.routing_weight_nvidia,
        }),
      });
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveKeys = async () => {
    if (role !== 'Admin') return;
    const payload: Record<string, string> = {};
    for (const f of KEY_FIELDS) {
      if (keyInputs[f.col] !== undefined && keyInputs[f.col] !== '') payload[f.col] = keyInputs[f.col];
    }
    if (Object.keys(payload).length === 0) return;
    setKeySaving(true);
    setKeySaved(false);
    try {
      await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      setKeyInputs({});
      setKeySaved(true);
      await loadConfig();
      setTimeout(() => setKeySaved(false), 2500);
    } catch (err) {
      console.error(err);
    } finally {
      setKeySaving(false);
    }
  };

  const handleSaveWorkspace = () => {
    setWorkspaceName(wsNameInput);
    setRole(wsRoleInput);
    setWsSaved(true);
    setTimeout(() => setWsSaved(false), 2000);
  };

  const navItem = (id: Section, icon: React.ReactNode, label: string) => (
    <button
      onClick={() => setSection(id)}
      aria-current={section === id ? 'page' : undefined}
      className={`w-full p-3 flex items-center gap-3 font-medium rounded-md transition-colors text-left ${
        section === id ? 'bg-surface-elevated border-l-2 border-primary text-on-surface' : 'text-on-surface-variant hover:bg-surface-elevated/50'
      }`}
    >
      {icon} {label}
    </button>
  );

  const isLocked = role === 'Standard User';

  return (
    <div className="flex flex-col h-full bg-background relative overflow-hidden">
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <div className="absolute top-[10%] left-[60%] w-[600px] h-[600px] bg-primary/5 rounded-full blur-[150px]"></div>
      </div>

      <div className="relative z-10 flex flex-col h-full">
        <TopNav title="Enterprise" tabs={['Configuration']} activeTab="Configuration" />

        <div className="flex-1 overflow-auto p-6 md:p-10">
          <div className="max-w-5xl mx-auto space-y-8">
            <div>
              <h2 className="text-2xl font-bold font-sans tracking-tight text-on-surface">System Configuration</h2>
              <p className="text-on-surface-variant mt-2 max-w-2xl">
                Manage your instance of Imam Agent Studio: workspace identity, compute limits, LLM routing, and API keys.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left nav */}
              <div className="lg:col-span-1 space-y-2">
                {navItem('compute', <Server size={18} className={section === 'compute' ? 'text-primary' : ''} />, 'Instance Compute')}
                {navItem('keys', <Key size={18} className={section === 'keys' ? 'text-primary' : ''} />, 'API Keys')}
                {navItem('workspace', <Shield size={18} className={section === 'workspace' ? 'text-primary' : ''} />, 'Workspace Settings')}
              </div>

              {/* Right content */}
              <div className="lg:col-span-2 space-y-8">
                {loading ? (
                  <div className="text-on-surface-variant animate-pulse font-mono flex items-center gap-2">
                    <Activity size={16} /> LOAD_SYS_CFG...
                  </div>
                ) : config && section === 'compute' ? (
                  <>
                    {isLocked && (
                      <div className="bg-warning/10 border border-warning/30 rounded-xl p-4 text-warning font-mono text-xs flex items-center gap-2">
                        <ShieldAlert size={16} />
                        <span>LOCKED: Standard User role cannot modify platform settings.</span>
                      </div>
                    )}
                    <section className="glass-panel border-surface-border p-6 rounded-xl">
                      <h3 className="text-lg font-semibold text-on-surface mb-4 flex items-center gap-2">
                        <Activity size={18} className="text-primary" /> Node Allocation
                      </h3>
                      <div className="space-y-6">
                        <div>
                          <div className="flex justify-between mb-2">
                            <label className="text-sm font-medium text-on-surface-variant">Global Agent Concurrency Limit</label>
                            <span className="text-sm font-mono text-primary">{config.agent_concurrency_limit} / 100</span>
                          </div>
                          <input type="range" min="1" max="100" value={config.agent_concurrency_limit}
                            disabled={isLocked}
                            onChange={(e) => setConfig({ ...config, agent_concurrency_limit: parseInt(e.target.value, 10) })}
                            className="w-full accent-primary bg-surface-elevated h-2 rounded-lg appearance-none cursor-pointer disabled:opacity-40" />
                          <p className="text-xs text-on-surface-variant mt-2">Max agents allowed to process tasks simultaneously (enforced server-side; returns 429 over limit).</p>
                        </div>
                        <div className="pt-4 border-t border-surface-border">
                          <label className="text-xs uppercase tracking-wider font-mono text-on-surface-variant mb-1 block">Memory Retention</label>
                          <div className="flex gap-2">
                            <input type="number" value={config.memory_retention_days}
                              disabled={isLocked}
                              onChange={(e) => setConfig({ ...config, memory_retention_days: parseInt(e.target.value) || 30 })}
                              className="w-24 bg-surface-elevated border border-surface-border p-2 rounded text-sm text-on-surface font-mono disabled:opacity-40" />
                            <span className="text-on-surface-variant self-center text-sm">Days</span>
                          </div>
                        </div>
                      </div>
                    </section>

                    <section className="glass-panel border-surface-border p-6 rounded-xl">
                      <h3 className="text-lg font-semibold text-on-surface mb-4 flex items-center gap-2">
                        <Zap size={18} className="text-secondary" /> Global LLM Routing Priority
                      </h3>
                      <div className="space-y-4">
                        {([['gemini', 'Gemini (Google)', config.routing_weight_gemini], ['nvidia', 'NVIDIA NIM (Llama)', config.routing_weight_nvidia]] as const).map(([k, label, val]) => (
                          <div key={k} className="border border-surface-border rounded-lg p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium text-on-surface">{label} Weight</h4>
                                <p className="text-sm text-on-surface-variant mt-1">Routing weight (0–1). Higher wins ties for its task affinity.</p>
                              </div>
                              <input type="number" step="0.1" min="0" max="1" value={val}
                                disabled={isLocked}
                                onChange={(e) => setConfig({ ...config, [k === 'gemini' ? 'routing_weight_gemini' : 'routing_weight_nvidia']: parseFloat(e.target.value) || 0 })}
                                className="bg-transparent border border-surface-border px-2 py-1 text-on-surface text-center rounded font-mono w-20 outline-none focus:border-primary disabled:opacity-40" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>

                    <div className="flex justify-end gap-4">
                      <button className="px-6 py-2 bg-transparent text-on-surface font-medium hover:bg-surface-elevated rounded transition-colors" onClick={() => loadConfig()}>Discard</button>
                      <button onClick={handleSave} disabled={saving || isLocked}
                        className="px-6 py-2 bg-primary text-on-primary-fixed font-medium hover:brightness-110 rounded transition-all shadow-[0_4px_16px_-4px_rgba(var(--primary-rgb),0.4)] disabled:opacity-50">
                        {saving ? 'Saving...' : 'Save Configuration'}
                      </button>
                    </div>
                  </>
                ) : config && section === 'keys' ? (
                  <>
                    {isLocked && (
                      <div className="bg-warning/10 border border-warning/30 rounded-xl p-4 text-warning font-mono text-xs flex items-center gap-2">
                        <ShieldAlert size={16} />
                        <span>LOCKED: Standard User role cannot modify API credentials.</span>
                      </div>
                    )}
                    <section className="glass-panel border-surface-border p-6 rounded-xl">
                      <h3 className="text-lg font-semibold text-on-surface mb-1 flex items-center gap-2">
                        <Key size={18} className="text-primary" /> Provider API Keys
                      </h3>
                      <p className="text-sm text-on-surface-variant mb-5">
                        Keys are stored on your row-level-secured settings row and used in preference to server env keys. They are never returned to the browser.
                      </p>

                      <div className="space-y-5">
                        {KEY_FIELDS.map((f) => {
                          const configured = config.keys[f.flag as keyof typeof config.keys];
                          const userSet = config.keys[f.userFlag as keyof typeof config.keys];
                          return (
                            <div key={f.col}>
                              <div className="flex justify-between items-center mb-2">
                                <label className="text-sm font-medium text-on-surface">{f.label}</label>
                                <span className={`font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border ${
                                  userSet ? 'text-primary border-primary/30 bg-primary/10'
                                  : configured ? 'text-telemetry-blue border-telemetry-blue/30 bg-telemetry-blue/10'
                                  : 'text-on-surface-variant border-cyber-border'
                                }`}>
                                  {userSet ? 'User key set' : configured ? 'Env fallback' : 'Not configured'}
                                </span>
                              </div>
                              <div className="relative">
                                <input
                                  type={showKey[f.col] ? 'text' : 'password'}
                                  value={keyInputs[f.col] ?? ''}
                                  disabled={isLocked}
                                  onChange={(e) => setKeyInputs({ ...keyInputs, [f.col]: e.target.value })}
                                  placeholder={userSet ? '•••••••• (set — enter to replace)' : 'Paste key to enable'}
                                  className="w-full bg-surface-container-low border border-cyber-border rounded-lg px-3 py-2.5 pr-10 text-sm text-on-surface font-mono placeholder-on-surface-variant/40 outline-none focus:border-primary/60 transition-colors disabled:opacity-40"
                                />
                                <button type="button" onClick={() => setShowKey({ ...showKey, [f.col]: !showKey[f.col] })}
                                  disabled={isLocked}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface disabled:opacity-40" aria-label="Toggle visibility">
                                  {showKey[f.col] ? <EyeOff size={15} /> : <Eye size={15} />}
                                </button>
                              </div>
                              <p className="text-xs text-on-surface-variant mt-1.5">{f.hint}</p>
                            </div>
                          );
                        })}
                      </div>

                      <div className="flex items-center justify-end gap-3 mt-6">
                        {keySaved && <span className="font-mono text-[12px] text-primary flex items-center gap-1"><Check size={14} /> Saved</span>}
                        <button onClick={handleSaveKeys} disabled={keySaving || isLocked}
                          className="px-6 py-2 bg-primary text-on-primary-fixed font-medium hover:brightness-110 rounded transition-all disabled:opacity-50 flex items-center gap-2">
                          {keySaving ? <Loader2 size={15} className="animate-spin" /> : <Key size={15} />}
                          {keySaving ? 'Saving...' : 'Save Keys'}
                        </button>
                      </div>
                    </section>
                  </>
                ) : section === 'workspace' ? (
                  <section className="glass-panel border-surface-border p-6 rounded-xl">
                    <h3 className="text-lg font-semibold text-on-surface mb-4 flex items-center gap-2">
                      <Shield size={18} className="text-primary" /> Workspace Access Control
                    </h3>

                    <div className="space-y-5">
                      <div>
                        <label htmlFor="ws-name" className="text-sm font-medium text-on-surface block mb-2">Workspace Name</label>
                        <input
                          id="ws-name"
                          type="text"
                          value={wsNameInput}
                          onChange={(e) => setWsNameInput(e.target.value)}
                          className="w-full bg-surface-container-low border border-cyber-border rounded-lg px-3 py-2.5 text-sm text-on-surface outline-none focus:border-primary/60 transition-colors"
                        />
                      </div>

                      <div>
                        <label htmlFor="ws-role" className="text-sm font-medium text-on-surface block mb-2">Operator Role</label>
                        <select
                          id="ws-role"
                          value={wsRoleInput}
                          onChange={(e) => setWsRoleInput(e.target.value as Role)}
                          className="w-full bg-surface-container-low border border-cyber-border rounded-lg px-3 py-2.5 text-sm text-on-surface outline-none focus:border-primary/60 transition-colors font-mono"
                        >
                          <option value="Admin">Admin (Full Write Access)</option>
                          <option value="Standard User">Standard User (Read-Only settings)</option>
                        </select>
                      </div>

                      <div className="flex items-center justify-end gap-3 mt-6">
                        {wsSaved && <span className="font-mono text-[12px] text-primary flex items-center gap-1"><Check size={14} /> Saved</span>}
                        <button onClick={handleSaveWorkspace}
                          className="px-6 py-2 bg-primary text-on-primary-fixed font-medium hover:brightness-110 rounded transition-all flex items-center gap-2">
                          <Check size={15} />
                          Apply Settings
                        </button>
                      </div>
                    </div>
                  </section>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

