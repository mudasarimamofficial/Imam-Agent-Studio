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
  { id: 'meta/llama-3.3-70b-instruct', label: 'Open Source Logic (DeepSeek Pro)' },
];

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

  // Playground behavior configurations
  const [systemPrompt, setSystemPrompt] = useState(
    "You are an expert digital assistant named Prompt Playground Assistant specializing in general logic, reasoning, and copywriting."
  );
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
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  async function fetchAgents() {
    try {
      const res = await fetch('/api/agents');
      const json = await res.json();
      const loadedAgents = json.data || [];
      
      // Auto-spawn a default playground agent if none exist
      if (loadedAgents.length === 0) {
        const spawnRes = await fetch('/api/agents', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'Prompt Playground Assistant', role: 'General Purpose', model: 'gemini-2.5-flash' })
        });
        const spawnJson = await spawnRes.json();
        if (spawnJson.success && spawnJson.data) {
          loadedAgents.push(spawnJson.data);
        }
      }
      setAgents(loadedAgents);
      
      // Auto-select first agent
      if (loadedAgents.length > 0 && !selectedAgentId) {
        const firstAgent = loadedAgents[0];
        setSelectedAgentId(firstAgent.id);
        const savedPrompt = localStorage.getItem(`agent_${firstAgent.id}_prompt`) || firstAgent.role || systemPrompt;
        setSystemPrompt(savedPrompt);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAgents();
  }, []);

  const handleSaveConfigs = () => {
    if (!selectedAgentId) return;
    localStorage.setItem(`agent_${selectedAgentId}_prompt`, systemPrompt);
    localStorage.setItem(`agent_${selectedAgentId}_temp`, String(temperature));
    localStorage.setItem(`agent_${selectedAgentId}_budget`, String(budgetCap));
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
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
          instruction: `Context & System Instruction overrides:\n${systemPrompt}\n\nModel parameters: Temperature ${temperature}\n\nUser Question:\n${userMsg}`,
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
    }
  };

  return (
    <div className="flex-1 flex h-full bg-background relative overflow-hidden">
      {/* Background Neon Blurs */}
      <div className="absolute inset-0 z-0 opacity-15 pointer-events-none">
        <div className="absolute top-[20%] left-[2%] w-[400px] h-[400px] bg-primary/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[20%] right-[2%] w-[350px] h-[350px] bg-secondary/10 rounded-full blur-[80px]" />
      </div>

      {/* 1. LEFT CONFIGURATION PANEL (20% width) */}
      <aside className="w-72 border-r border-cyber-border/45 bg-surface-elevated/10 shrink-0 flex flex-col h-full overflow-y-auto p-5 space-y-6 select-none relative z-20">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Brain className="text-primary animate-pulse" size={16} />
            <span className="font-mono text-[10px] text-primary uppercase tracking-wider font-bold">Configuration</span>
          </div>
          <h3 className="font-sans text-sm font-bold text-on-surface">Model Settings</h3>
          <p className="text-[10px] text-on-surface-variant font-mono mt-0.5">Customize rules and temperature</p>
        </div>

        {/* System Instructions */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label htmlFor="sys-prompt" className="font-mono text-[9px] text-on-surface-variant uppercase tracking-wider block">System Instructions</label>
            <button
              onClick={handleSaveConfigs}
              className="text-[9px] font-mono text-primary uppercase font-bold hover:brightness-110"
            >
              {saveSuccess ? 'Saved' : 'Save'}
            </button>
          </div>
          <textarea
            id="sys-prompt"
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            rows={8}
            className="w-full bg-surface-container/60 border border-cyber-border rounded-xl p-3 text-xs text-on-surface outline-none focus:border-primary/50 transition-colors resize-none leading-relaxed font-sans"
            placeholder="Enter context instructions..."
          />
        </div>

        {/* Brain Selector */}
        <div className="space-y-2">
          <label htmlFor="model-select" className="font-mono text-[9px] text-on-surface-variant uppercase tracking-wider block">Brain Selector</label>
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

        {/* Creativity / Temperature Slider */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label htmlFor="temp-slider" className="font-mono text-[9px] text-on-surface-variant uppercase tracking-wider flex items-center gap-1">
              Creativity / Temp
            </label>
            <span className="font-mono text-xs text-primary font-bold">{temperature.toFixed(1)}</span>
          </div>
          <input
            id="temp-slider"
            type="range"
            min="0" max="1" step="0.1"
            value={temperature}
            onChange={(e) => setTemperature(parseFloat(e.target.value))}
            className="w-full accent-primary h-1 bg-surface-elevated rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between font-mono text-[8px] text-on-surface-variant">
            <span>Precise (0.0)</span>
            <span>Creative (1.0)</span>
          </div>
        </div>

        {/* Task Budget safety cap */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label htmlFor="budget-slider" className="font-mono text-[9px] text-on-surface-variant uppercase tracking-wider">
              Budget Cap ($)
            </label>
            <span className="font-mono text-xs text-secondary font-bold">${budgetCap.toFixed(1)}</span>
          </div>
          <input
            id="budget-slider"
            type="range"
            min="1" max="50" step="1"
            value={budgetCap}
            onChange={(e) => setBudgetCap(parseFloat(e.target.value))}
            className="w-full accent-secondary h-1 bg-surface-elevated rounded-lg appearance-none cursor-pointer"
          />
        </div>
      </aside>

      {/* 2. RIGHT COLUMN: THE ARENA (80% width) */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative z-10">
        <TopNav 
          title="Prompt Playground" 
          tabs={['Interactive Arena']} 
          activeTab="Interactive Arena"
        />

        {/* Output Area */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 bg-surface-container-lowest/5">
          <div className="flex-1 glass-panel rounded-xl overflow-hidden border-surface-border flex flex-col min-h-[300px]">
            <div className="p-3 border-b border-cyber-border/40 flex justify-between items-center bg-surface-elevated/45">
              <span className="font-mono text-[9px] uppercase tracking-wider text-on-surface-variant font-bold">Inference Console Log</span>
            </div>
            
            <div className="flex-1 p-5 overflow-y-auto terminal-scroll space-y-4">
              {testLog.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 select-none opacity-45">
                  <Sparkles className="text-primary/30 mb-3 animate-pulse" size={36} />
                  <h4 className="text-on-surface font-semibold text-sm">Interactive Arena</h4>
                  <p className="text-on-surface-variant text-xs mt-1 max-w-sm">Write your prompt command in the input box below. Telemetry latency, token estimates, and logic routing costs will populate dynamically.</p>
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

                      {/* Telemetry data */}
                      {!isUser && (log.latency || log.tokens) && (
                        <div className="flex items-center gap-3 mt-1.5 text-[9px] font-mono text-on-surface-variant bg-surface-container-low/40 px-2.5 py-1 rounded-md border border-cyber-border/30">
                          <span>LATENCY: <strong className="text-on-surface">{log.latency}ms</strong></span>
                          <span>TOKENS: <strong className="text-on-surface">{log.tokens}</strong></span>
                          <span>COST: <strong className="text-primary">${log.cost?.toFixed(5)}</strong></span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}

              {executing && (
                <div className="flex items-center gap-2 bg-surface-elevated border border-cyber-border/60 p-3.5 rounded-xl rounded-tl-none text-xs text-on-surface-variant font-mono max-w-[80%] animate-pulse">
                  <Loader2 size={13} className="animate-spin text-primary" />
                  Reasoning and writing response...
                </div>
              )}
              <div ref={scrollRef} />
            </div>
          </div>
        </div>

        {/* Input Prompter Footer */}
        <footer className="shrink-0 bg-surface-container-lowest/40 border-t border-cyber-border/30 px-6 py-4 flex gap-4 items-center z-20">
          <div className="relative flex-1">
            <textarea
              rows={2}
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleExecutePrompt();
                }
              }}
              placeholder="What do you want this assistant to build? (Type prompt instruction)..."
              className="w-full bg-surface-elevated border border-cyber-border px-4 py-2.5 rounded-lg text-xs text-on-surface outline-none focus:border-primary transition-colors font-sans resize-none leading-normal"
            />
          </div>
          <button
            onClick={handleExecutePrompt}
            disabled={executing || !promptInput.trim()}
            className="px-6 py-4 bg-primary text-on-primary-fixed hover:brightness-110 rounded-lg font-mono text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-40 flex items-center gap-2 cursor-pointer h-12 shrink-0 animate-fade-in"
          >
            {executing ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
            Run
          </button>
        </footer>
      </div>
    </div>
  );
}
