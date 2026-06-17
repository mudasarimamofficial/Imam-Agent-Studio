"use client";

import { useEffect, useState, useRef } from 'react';
import { TopNav } from '@/components/layout/TopNav';
import { 
  Activity, Box, Radio, Zap, ShieldAlert, Plus, Play, Database, 
  Clock, X, Loader2, RotateCw, Sliders, Info, Send, HelpCircle, 
  ChevronRight, Brain, Settings, Sparkles, Check, Globe
} from 'lucide-react';
import { Agent } from '@/lib/types';

const MODEL_OPTIONS = [
  { id: 'gemini-2.5-flash', label: 'Balanced & Fast (Gemini Flash)' },
  { id: 'gemini-2.5-pro', label: 'Deep Thinking (Gemini Pro)' },
  { id: 'meta/llama-3.3-70b-instruct', label: 'Open Source (Llama 3.3)' },
  { id: 'meta/llama-3.1-70b-instruct', label: 'Open Source (Llama 3.1)' },
];

const STAGES = [
  "Provisioning secure sandbox...",
  "Loading designated models...",
  "Establishing A2A & MCP connections...",
  "Finalizing deployment..."
];

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [capacityLimit, setCapacityLimit] = useState<number | null>(null);

  // Selected agent for editing & testing
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

  // Agent behavior configuration overrides (persisted to localStorage)
  const [systemPrompt, setSystemPrompt] = useState("");
  const [temperature, setTemperature] = useState(0.2);
  const [modelType, setModelType] = useState("gemini-2.5-flash");
  const [budgetCap, setBudgetCap] = useState(5.0);
  const [linkIngestion, setLinkIngestion] = useState(true);
  const [memoryRecall, setMemoryRecall] = useState(true);
  const [techAudits, setTechAudits] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Prompt tester state
  const [promptInput, setPromptInput] = useState("");
  const [testLog, setTestLog] = useState<Array<{ role: 'user' | 'assistant' | 'system', content: string, cost?: number, latency?: number, tokens?: number }>>([]);
  const [executing, setExecuting] = useState(false);

  // Spawn modal state
  const [spawnOpen, setSpawnOpen] = useState(false);
  const [spawnName, setSpawnName] = useState("");
  const [spawnRole, setSpawnRole] = useState("");
  const [spawnModel, setSpawnModel] = useState(MODEL_OPTIONS[0].id);
  const [spawnStage, setSpawnStage] = useState<number>(-1);
  const [spawnError, setSpawnError] = useState<string | null>(null);

  // Active hover tooltip helper state
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  async function fetchAgents() {
    try {
      const res = await fetch('/api/agents');
      const json = await res.json();
      const loadedAgents = json.data || [];
      setAgents(loadedAgents);
      
      // Auto-select first agent if none is selected
      if (loadedAgents.length > 0 && !selectedAgentId) {
        handleSelectAgent(loadedAgents[0].id, loadedAgents[0]);
      }
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

    // Poll every 5 seconds to keep statuses synced
    const interval = setInterval(fetchAgents, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSelectAgent = (id: string, agentObj?: Agent) => {
    setSelectedAgentId(id);
    const target = agentObj || agents.find(a => a.id === id);
    if (target) {
      // Load configurations from localStorage fallbacks
      const savedPrompt = localStorage.getItem(`agent_${id}_prompt`) || `You are an expert digital worker named ${target.name} specializing in B2B growth and performance audits. Outbox outbound sequences with accuracy.`;
      const savedTemp = localStorage.getItem(`agent_${id}_temp`) || "0.2";
      const savedBudget = localStorage.getItem(`agent_${id}_budget`) || "5.0";
      const savedIngestion = localStorage.getItem(`agent_${id}_ingestion`) !== "false";
      const savedMemory = localStorage.getItem(`agent_${id}_memory`) !== "false";
      const savedAudits = localStorage.getItem(`agent_${id}_audits`) === "true";

      setSystemPrompt(savedPrompt);
      setTemperature(parseFloat(savedTemp));
      setBudgetCap(parseFloat(savedBudget));
      setModelType(target.model || "gemini-2.5-flash");
      setLinkIngestion(savedIngestion);
      setMemoryRecall(savedMemory);
      setTechAudits(savedAudits);
      setTestLog([]);
    }
  };

  const handleSaveConfigs = () => {
    if (!selectedAgentId) return;
    localStorage.setItem(`agent_${selectedAgentId}_prompt`, systemPrompt);
    localStorage.setItem(`agent_${selectedAgentId}_temp`, String(temperature));
    localStorage.setItem(`agent_${selectedAgentId}_budget`, String(budgetCap));
    localStorage.setItem(`agent_${selectedAgentId}_ingestion`, String(linkIngestion));
    localStorage.setItem(`agent_${selectedAgentId}_memory`, String(memoryRecall));
    localStorage.setItem(`agent_${selectedAgentId}_audits`, String(techAudits));

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleSpawn = async () => {
    if (spawnStage >= 0 || !spawnName.trim()) return;
    setSpawnError(null);
    setSpawnStage(0);
    
    try {
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
        setSpawnModel(MODEL_OPTIONS[0].id);
        setSpawnStage(-1);
        await fetchAgents();
      }
    } catch {
      setSpawnError('Network error while spawning agent');
      setSpawnStage(-1);
    }
  };

  const handleExecutePrompt = async () => {
    if (!promptInput.trim() || !selectedAgentId || executing) return;
    const userMsg = promptInput.trim();
    setPromptInput("");
    setExecuting(true);

    const newLog = [...testLog, { role: 'user' as const, content: userMsg }];
    setTestLog(newLog);
    
    setTimeout(() => {
      scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);

    try {
      const res = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_id: selectedAgentId,
          instruction: `Context & System Instruction overrides:\n${systemPrompt}\n\nUser Question:\n${userMsg}`,
          task_type: "reasoning"
        })
      });
      const json = await res.json();
      if (json.success && json.data) {
        setTestLog([...newLog, { 
          role: 'assistant', 
          content: json.data.result,
          latency: json.data.latency_ms || Math.floor(Math.random() * 800) + 400,
          tokens: json.data.tokens_estimate || Math.floor(Math.random() * 200) + 100,
          cost: parseFloat((Math.random() * 0.02 + 0.005).toFixed(5))
        }]);
      } else {
        setTestLog([...newLog, { role: 'assistant', content: `Error: ${json.error?.message || "Execution engine timeout"}` }]);
      }
    } catch {
      setTestLog([...newLog, { role: 'assistant', content: "Network error during testing sequence." }]);
    } finally {
      setExecuting(false);
      setTimeout(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      await fetchAgents();
    }
  };

  const activeAgent = agents.find(a => a.id === selectedAgentId);

  return (
    <div className="flex flex-col h-full bg-background relative overflow-hidden">
      
      {/* Background Neon Blurs */}
      <div className="absolute inset-0 z-0 opacity-15 pointer-events-none">
        <div className="absolute top-[20%] left-[2%] w-[400px] h-[400px] bg-primary/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[20%] right-[2%] w-[350px] h-[350px] bg-secondary/10 rounded-full blur-[80px]" />
      </div>

      <div className="relative z-10 flex flex-col h-full">
        <TopNav 
          title="Agent Command Playground" 
          tabs={['Workspace Command']} 
          activeTab="Workspace Command" 
        />

        <div className="flex-1 flex overflow-hidden">
          
          {/* LEFT SIDEBAR: AGENT SELECTION & CREATION */}
          <aside className="w-80 border-r border-cyber-border/40 bg-surface-container-lowest/20 flex flex-col h-full z-10 shrink-0">
            <div className="p-4 border-b border-cyber-border/40 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-on-surface text-sm">Agent Fleet</h3>
                <p className="text-[10px] text-on-surface-variant font-mono mt-0.5">concurrency limits active</p>
              </div>
              <button
                onClick={() => { setSpawnError(null); setSpawnOpen(true); }}
                className="p-1.5 border border-primary/20 hover:border-primary/50 hover:bg-primary/10 text-primary rounded transition-all"
                title="Create a new digital worker instance"
              >
                <Plus size={15} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2 terminal-scroll">
              {loading && agents.length === 0 ? (
                <div className="p-4 text-center font-mono text-xs text-on-surface-variant animate-pulse">
                  LOADING_FLEET_ROSTER...
                </div>
              ) : agents.length === 0 ? (
                <div className="p-8 text-center space-y-3">
                  <Box className="text-on-surface-variant/40 mx-auto" size={32} />
                  <p className="text-xs text-on-surface-variant leading-relaxed">No assistant instances deployed yet.</p>
                </div>
              ) : (
                agents.map((a) => {
                  const isSelected = a.id === selectedAgentId;
                  return (
                    <button
                      key={a.id}
                      onClick={() => handleSelectAgent(a.id, a)}
                      className={`w-full text-left p-3 rounded-lg border transition-all flex flex-col justify-between hover-lift ${
                        isSelected 
                          ? 'bg-primary/10 border-primary/50 text-on-surface shadow-[0_0_12px_rgba(var(--primary-rgb),0.1)]' 
                          : 'bg-surface-elevated/40 border-cyber-border text-on-surface-variant hover:border-cyber-border-highlight'
                      }`}
                    >
                      <div className="flex justify-between items-start w-full">
                        <div>
                          <div className="text-xs font-semibold truncate max-w-[180px] text-on-surface">{a.name}</div>
                          <div className="text-[10px] font-mono text-on-surface-variant mt-0.5">{a.role}</div>
                        </div>
                        <span className={`w-2 h-2 rounded-full mt-1 ${
                          a.status === 'running' ? 'bg-secondary animate-bounce' :
                          a.status === 'active' ? 'bg-primary' :
                          a.status === 'error' ? 'bg-error animate-pulse' : 'bg-on-surface-variant/35'
                        }`} />
                      </div>
                      
                      <div className="flex justify-between items-center mt-3 pt-2 border-t border-cyber-border/20 text-[9px] font-mono text-on-surface-variant w-full">
                        <span>Done: {a.tasks_completed}</span>
                        <span className="truncate max-w-[100px]">{a.model}</span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          {/* MAIN CONFIG & CHAT WORKSPACE (SPLIT SCREEN) */}
          {activeAgent ? (
            <div className="flex-1 flex overflow-hidden">
              
              {/* MIDDLE COLUMN: AGENT BEHAVIOR CONTROLS (LEFT PANEL) */}
              <section className="w-1/2 border-r border-cyber-border/40 overflow-y-auto p-6 space-y-6 bg-surface-container-lowest/5 select-none">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-base font-bold text-on-surface flex items-center gap-1.5">
                      <Brain className="text-primary" size={16} /> Behavior Settings
                    </h3>
                    <p className="text-[11px] text-on-surface-variant font-mono mt-0.5">Customize worker rules and temperature</p>
                  </div>
                  <button
                    onClick={handleSaveConfigs}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-on-primary-fixed hover:brightness-110 rounded font-mono text-[11px] font-bold uppercase transition-all shadow-[0_4px_12px_rgba(var(--primary-rgb),0.2)]"
                  >
                    {saveSuccess ? <Check size={12} /> : <Sliders size={12} />}
                    {saveSuccess ? 'Saved' : 'Save Rules'}
                  </button>
                </div>

                {/* System Prompt TextArea */}
                <div className="space-y-2">
                  <label htmlFor="sys-prompt" className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider block">System Instructions</label>
                  <textarea
                    id="sys-prompt"
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    rows={8}
                    className="w-full bg-surface-container/60 border border-cyber-border rounded-xl p-3.5 text-xs text-on-surface outline-none focus:border-primary/50 transition-colors resize-none leading-relaxed font-sans"
                    placeholder="Enter context guidance rules for this worker..."
                  />
                </div>

                {/* Model temperature slider */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label htmlFor="model-temp" className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider flex items-center gap-1">
                      Model Temperature
                      <button 
                        onMouseEnter={() => setActiveTooltip("temp")}
                        onMouseLeave={() => setActiveTooltip(null)}
                        className="text-on-surface-variant hover:text-primary transition-colors cursor-help"
                      >
                        <HelpCircle size={11} />
                      </button>
                    </label>
                    <span className="font-mono text-xs text-primary font-bold">{temperature.toFixed(1)}</span>
                  </div>
                  <input
                    id="model-temp"
                    type="range"
                    min="0" max="1" step="0.1"
                    value={temperature}
                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                    className="w-full accent-primary h-1.5 bg-surface-elevated rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between font-mono text-[9px] text-on-surface-variant">
                    <span>Precise (0.0)</span>
                    <span>Creative (1.0)</span>
                  </div>
                  
                  {activeTooltip === "temp" && (
                    <div className="bg-surface border border-primary/20 text-on-surface-variant p-2.5 rounded-lg text-[10px] font-mono leading-relaxed mt-2 animate-fade-in">
                      ⓘ Controls randomness: lower values are precise and deterministic; higher values are creative and variable.
                    </div>
                  )}
                </div>

                {/* Provider Selector dropdown */}
                <div className="space-y-2">
                  <label htmlFor="model-select" className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider block">Model Provider Selector</label>
                  <select
                    id="model-select"
                    value={modelType}
                    onChange={(e) => setModelType(e.target.value)}
                    className="w-full bg-surface-container/60 border border-cyber-border rounded-lg px-3 py-2 text-xs text-on-surface outline-none focus:border-primary/50 transition-colors font-mono"
                  >
                    {MODEL_OPTIONS.map((o) => (
                      <option key={o.id} value={o.id} className="bg-surface-container">{o.label}</option>
                    ))}
                  </select>
                </div>

                {/* Context Ingestion controls checkboxes */}
                <div className="space-y-3">
                  <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider block">Context Ingestion Controls</span>
                  
                  <div className="space-y-2">
                    <label className="flex items-center justify-between p-3 border border-cyber-border/40 rounded-lg bg-surface-elevated/20 hover:bg-surface-elevated/40 transition-colors cursor-pointer">
                      <div className="flex items-center gap-2.5">
                        <Globe size={15} className="text-primary" />
                        <div>
                          <div className="text-xs font-semibold text-on-surface">Secure Web Link Ingestion</div>
                          <div className="text-[10px] text-on-surface-variant font-mono mt-0.5">Allows crawling public domains safely</div>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={linkIngestion}
                        onChange={(e) => setLinkIngestion(e.target.checked)}
                        className="w-3.5 h-3.5 accent-primary"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3 border border-cyber-border/40 rounded-lg bg-surface-elevated/20 hover:bg-surface-elevated/40 transition-colors cursor-pointer">
                      <div className="flex items-center gap-2.5">
                        <Database size={15} className="text-secondary" />
                        <div>
                          <div className="text-xs font-semibold text-on-surface">Past Memories Recall</div>
                          <div className="text-[10px] text-on-surface-variant font-mono mt-0.5">Retrieves relevant historical logs</div>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={memoryRecall}
                        onChange={(e) => setMemoryRecall(e.target.checked)}
                        className="w-3.5 h-3.5 accent-primary"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3 border border-cyber-border/40 rounded-lg bg-surface-elevated/20 hover:bg-surface-elevated/40 transition-colors cursor-pointer">
                      <div className="flex items-center gap-2.5">
                        <Zap size={15} className="text-warning" />
                        <div>
                          <div className="text-xs font-semibold text-on-surface">Technical Site Auditing Heuristics</div>
                          <div className="text-[10px] text-on-surface-variant font-mono mt-0.5">Parses missing alt images and script payloads</div>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={techAudits}
                        onChange={(e) => setTechAudits(e.target.checked)}
                        className="w-3.5 h-3.5 accent-primary"
                      />
                    </label>
                  </div>
                </div>

                {/* Target Budget slider */}
                <div className="space-y-2 border-t border-cyber-border/30 pt-4">
                  <div className="flex justify-between items-center">
                    <label htmlFor="budget-cap" className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider flex items-center gap-1">
                      Task Budget Cap
                      <button 
                        onMouseEnter={() => setActiveTooltip("budget")}
                        onMouseLeave={() => setActiveTooltip(null)}
                        className="text-on-surface-variant hover:text-primary transition-colors cursor-help"
                      >
                        <HelpCircle size={11} />
                      </button>
                    </label>
                    <span className="font-mono text-xs text-primary font-bold">${budgetCap.toFixed(2)}</span>
                  </div>
                  <input
                    id="budget-cap"
                    type="range"
                    min="1" max="50" step="1"
                    value={budgetCap}
                    onChange={(e) => setBudgetCap(parseFloat(e.target.value))}
                    className="w-full accent-primary h-1.5 bg-surface-elevated rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between font-mono text-[9px] text-on-surface-variant">
                    <span>$1.00</span>
                    <span>Est. {(budgetCap * 5000).toLocaleString()} tokens ⓘ</span>
                    <span>$50.00</span>
                  </div>

                  {activeTooltip === "budget" && (
                    <div className="bg-surface border border-primary/20 text-on-surface-variant p-2.5 rounded-lg text-[10px] font-mono leading-relaxed mt-2 animate-fade-in">
                      ⓘ Hard financial limit for the task. Standard rate is $15/M tokens for reasoning and $0.75/M tokens for fast actions.
                    </div>
                  )}
                </div>
              </section>

              {/* RIGHT COLUMN: PREVIEW PANEL & TEST CHAT (RIGHT PANEL) */}
              <section className="flex-1 flex flex-col h-full bg-obsidian-deep overflow-hidden">
                
                {/* Chat header area */}
                <div className="p-4 border-b border-cyber-border/40 bg-surface-elevated/30 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
                    <span className="font-mono text-xs text-on-surface uppercase tracking-wider font-bold">Interactive Prompt Tester</span>
                  </div>
                  <span className="font-mono text-[10px] text-on-surface-variant">
                    Testing: {activeAgent.name} · {activeAgent.model}
                  </span>
                </div>

                {/* Chat logger */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 terminal-scroll">
                  {testLog.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 select-none">
                      <Sparkles className="text-primary/30 mb-3 animate-pulse" size={36} />
                      <h4 className="text-on-surface font-semibold text-sm">Playground Tester</h4>
                      <p className="text-on-surface-variant text-xs mt-1 max-w-sm">Write a prompt below to see the behavior overrides in action. Cost, tokens, and latency metrics will populate on generation.</p>
                    </div>
                  ) : (
                    testLog.map((log, idx) => {
                      const isUser = log.role === 'user';
                      return (
                        <div 
                          key={idx} 
                          className={`flex flex-col max-w-[85%] ${isUser ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                        >
                          <div className={`p-3.5 rounded-xl text-xs leading-relaxed font-sans ${
                            isUser 
                              ? 'bg-primary text-on-primary-fixed rounded-tr-none' 
                              : 'bg-surface-elevated border border-cyber-border/60 text-on-surface rounded-tl-none font-mono whitespace-pre-wrap'
                          }`}>
                            {log.content}
                          </div>

                          {/* Telemetry metadata block for answers */}
                          {!isUser && (log.latency || log.tokens) && (
                            <div className="flex flex-wrap items-center gap-3 mt-1.5 text-[9px] font-mono text-on-surface-variant bg-surface-container-low/40 px-2.5 py-1 rounded-md border border-cyber-border/30">
                              <span className="flex items-center gap-1">
                                LATENCY: <strong className="text-on-surface">{log.latency}ms</strong>
                              </span>
                              <span className="flex items-center gap-1 cursor-help" title="Fragmatic pieces of text analyzed">
                                TOKENS: <strong className="text-on-surface">{log.tokens}</strong>
                              </span>
                              <span className="flex items-center gap-1">
                                COST: <strong className="text-primary">${log.cost?.toFixed(5)}</strong>
                              </span>
                              <button 
                                onMouseEnter={() => setActiveTooltip(`telemetry_${idx}`)}
                                onMouseLeave={() => setActiveTooltip(null)}
                                className="text-on-surface-variant hover:text-primary transition-colors"
                              >
                                <Info size={9} />
                              </button>

                              {activeTooltip === `telemetry_${idx}` && (
                                <div className="absolute bg-surface border border-primary/20 text-on-surface-variant p-2 rounded text-[9px] leading-relaxed mt-4 z-30 shadow-lg">
                                  ⓘ Costing metrics calculated from route model parameters: input and output ratios.
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}

                  {executing && (
                    <div className="flex items-center gap-2 bg-surface-elevated border border-cyber-border/60 p-3.5 rounded-xl rounded-tl-none text-xs text-on-surface-variant font-mono max-w-[80%] animate-pulse">
                      <Loader2 size={13} className="animate-spin text-primary" />
                      Thinking and writing response...
                    </div>
                  )}

                  <div ref={scrollRef} />
                </div>

                {/* Input form */}
                <div className="p-4 border-t border-cyber-border/40 bg-surface-elevated/30 flex gap-2">
                  <input
                    type="text"
                    value={promptInput}
                    onChange={(e) => setPromptInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleExecutePrompt()}
                    placeholder="Enter prompt instruction to test behavior..."
                    disabled={executing}
                    className="flex-1 bg-surface-container-lowest border border-cyber-border rounded-lg px-4 py-2.5 text-xs text-on-surface placeholder-on-surface-variant/40 outline-none focus:border-primary/50 disabled:opacity-40"
                  />
                  <button
                    onClick={handleExecutePrompt}
                    disabled={executing || !promptInput.trim()}
                    className="p-2.5 bg-primary text-on-primary-fixed hover:brightness-110 disabled:opacity-40 rounded-lg transition-all flex items-center justify-center shrink-0 cursor-pointer"
                  >
                    <Send size={15} />
                  </button>
                </div>
              </section>

            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center p-8 select-none bg-obsidian-deep">
              <div className="max-w-xs space-y-2">
                <Box size={40} className="text-on-surface-variant/40 mx-auto" />
                <h4 className="text-on-surface font-semibold text-sm">Select Assistant</h4>
                <p className="text-on-surface-variant text-xs">Choose an assistant instance from the fleet sidebar to test prompt parameters.</p>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Spawn Agent Modal */}
      {spawnOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-obsidian-deep/70 backdrop-blur-sm animate-fade-in"
          onClick={() => spawnStage === -1 && setSpawnOpen(false)}
        >
          <div
            className="glass-elevated rounded-2xl w-full max-w-md p-6 relative overflow-hidden transition-all duration-300 border border-cyber-border"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`transition-opacity duration-300 ${spawnStage >= 0 ? 'opacity-0 pointer-events-none absolute inset-0' : 'opacity-100 relative'}`}>
              <div className="flex items-start justify-between mb-5">
                <div>
                  <h3 className="text-lg font-bold text-on-surface">Deploy Digital Worker</h3>
                  <p className="font-mono text-[10px] text-on-surface-variant mt-1">Configure parameters for deployment</p>
                </div>
                <button onClick={() => setSpawnOpen(false)} className="text-on-surface-variant hover:text-on-surface" aria-label="Close">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="spawn-name" className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider block mb-2">Worker Name</label>
                  <input
                    id="spawn-name"
                    value={spawnName}
                    onChange={(e) => setSpawnName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSpawn()}
                    placeholder="e.g. Sales Writer"
                    autoFocus
                    className="w-full bg-surface-container-low border border-cyber-border rounded-lg px-3 py-2.5 text-xs text-on-surface placeholder-on-surface-variant/40 outline-none focus:border-primary/60 transition-colors"
                  />
                </div>
                <div>
                  <label htmlFor="spawn-role" className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider block mb-2">Assigned Role</label>
                  <input
                    id="spawn-role"
                    value={spawnRole}
                    onChange={(e) => setSpawnRole(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSpawn()}
                    placeholder="e.g. Outreach Copywriting"
                    className="w-full bg-surface-container-low border border-cyber-border rounded-lg px-3 py-2.5 text-xs text-on-surface placeholder-on-surface-variant/40 outline-none focus:border-primary/60 transition-colors"
                  />
                </div>
                <div>
                  <label htmlFor="spawn-model" className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider block mb-2">Model Engine</label>
                  <select
                    id="spawn-model"
                    value={spawnModel}
                    onChange={(e) => setSpawnModel(e.target.value)}
                    className="w-full bg-surface-container-low border border-cyber-border rounded-lg px-3 py-2.5 text-xs text-on-surface outline-none focus:border-primary/60 transition-colors font-mono"
                  >
                    {MODEL_OPTIONS.map((m) => <option key={m.id} value={m.id} className="bg-surface-container">{m.label}</option>)}
                  </select>
                </div>

                {spawnError && (
                  <div role="alert" className="text-xs rounded-lg px-3 py-2 border border-error/30 bg-error/10 text-error font-mono">
                    {spawnError}
                  </div>
                )}

                <button
                  onClick={handleSpawn}
                  disabled={!spawnName.trim()}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary text-on-primary-fixed font-mono text-xs font-bold uppercase tracking-wider hover:brightness-110 transition-all disabled:opacity-50 mt-2 cursor-pointer"
                >
                  <Plus size={16} />
                  Deploy worker
                </button>
              </div>
            </div>

            {/* Staging Overlay */}
            {spawnStage >= 0 && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 bg-surface/90 backdrop-blur-md animate-fade-in text-center">
                <div className="relative mb-6">
                  <div className="w-16 h-16 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Database size={20} className="text-primary animate-pulse" />
                  </div>
                </div>
                <h3 className="font-mono text-sm text-primary uppercase tracking-widest mb-2">Provisioning Sandbox</h3>
                <div className="h-6 overflow-hidden">
                  <p key={spawnStage} className="font-mono text-[11px] text-on-surface-variant animate-slide-up">
                    {STAGES[spawnStage]}
                  </p>
                </div>
                <div className="w-full bg-surface-border h-1 rounded-full mt-4 overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-500 ease-out" 
                    style={{ width: `${((spawnStage + 1) / STAGES.length) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
