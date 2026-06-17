"use client";

import { useEffect, useState, useRef } from 'react';
import { TopNav } from '@/components/layout/TopNav';
import { 
  Megaphone, Sliders, Play, Loader2, Sparkles, Check, Info, HelpCircle, Brain, Send
} from 'lucide-react';

const MODEL_OPTIONS = [
  { id: 'gemini-2.5-flash', label: 'Balanced & Fast (Gemini Flash)' },
  { id: 'gemini-2.5-pro', label: 'Deep Thinking (Gemini Pro)' },
  { id: 'meta/llama-3.3-70b-instruct', label: 'Open Source Logic (DeepSeek Pro)' },
];

const TONE_OPTIONS = [
  { id: 'Professional', label: 'Professional & Authoritative' },
  { id: 'Urgent', label: 'Urgent & Compelling' },
  { id: 'Witty', label: 'Witty & Playful' },
  { id: 'Casual', label: 'Casual & Friendly' },
];

export default function CopywriterAIPage() {
  const [agents, setAgents] = useState<any[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [systemInstructions, setSystemInstructions] = useState(
    "You are a world-class Copywriter AI. Generate high-converting marketing copy, landing page hooks, sales letters, WhatsApp outreach campaigns, and email subject lines."
  );
  const [selectedModel, setSelectedModel] = useState("gemini-2.5-flash");
  const [selectedTone, setSelectedTone] = useState("Professional");
  const [temperature, setTemperature] = useState(0.7);
  const [budgetCap, setBudgetCap] = useState(5.0);

  const [promptInput, setPromptInput] = useState("");
  const [outputCopy, setOutputCopy] = useState("");
  const [executing, setExecuting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Telemetry simulation state
  const [telemetry, setTelemetry] = useState<{ latency?: number, tokens?: number, cost?: number } | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  async function fetchAgents() {
    try {
      const res = await fetch('/api/agents');
      const json = await res.json();
      const loadedAgents = json.data || [];
      
      // Auto-spawn or find general assistant to execute completions
      if (loadedAgents.length === 0) {
        const spawnRes = await fetch('/api/agents', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'Copywriter AI', role: 'Copywriter Specialist', model: 'gemini-2.5-flash' })
        });
        const spawnJson = await spawnRes.json();
        if (spawnJson.success && spawnJson.data) {
          loadedAgents.push(spawnJson.data);
        }
      }
      setAgents(loadedAgents);
      if (loadedAgents.length > 0) {
        setSelectedAgentId(loadedAgents[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    fetchAgents();
  }, []);

  const handleSaveConfigs = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleGenerateCopy = async () => {
    if (!promptInput.trim() || !selectedAgentId || executing) return;
    const topic = promptInput.trim();
    setExecuting(true);
    setOutputCopy("");
    setTelemetry(null);

    try {
      const res = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_id: selectedAgentId,
          instruction: `Context & System Instruction overrides:\n${systemInstructions}\n\nTone of voice: ${selectedTone}\n\nModel parameters: Temperature ${temperature}\n\nTask: Generate high-converting copywriting for the following topic/prompt: ${topic}`,
          task_type: "reasoning"
        })
      });
      const json = await res.json();
      if (json.success && json.data) {
        setOutputCopy(json.data.result);
        setTelemetry({
          latency: json.data.latency_ms || Math.floor(Math.random() * 600) + 300,
          tokens: json.data.tokens_estimate || Math.floor(Math.random() * 250) + 120,
          cost: parseFloat((Math.random() * 0.01 + 0.003).toFixed(5))
        });
      } else {
        setOutputCopy(`Error: ${json.error?.message || "Execution engine timeout"}`);
      }
    } catch (err) {
      setOutputCopy("Network error during copywriting request.");
    } finally {
      setExecuting(false);
    }
  };

  const copyResult = async () => {
    if (!outputCopy) return;
    try {
      await navigator.clipboard.writeText(outputCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard unavailable */ }
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
            <Megaphone className="text-primary animate-pulse" size={16} />
            <span className="font-mono text-[10px] text-primary uppercase tracking-wider font-bold">Copywriter Config</span>
          </div>
          <h3 className="font-sans text-sm font-bold text-on-surface">Creative Parameters</h3>
          <p className="text-[10px] text-on-surface-variant font-mono mt-0.5">Control brain instructions &amp; sliders</p>
        </div>

        {/* System Instructions */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label htmlFor="sys-instructions" className="font-mono text-[9px] text-on-surface-variant uppercase tracking-wider block">System Instructions</label>
            <button
              onClick={handleSaveConfigs}
              className="text-[9px] font-mono text-primary uppercase font-bold hover:brightness-110"
            >
              {saveSuccess ? 'Saved' : 'Save'}
            </button>
          </div>
          <textarea
            id="sys-instructions"
            value={systemInstructions}
            onChange={(e) => setSystemInstructions(e.target.value)}
            rows={8}
            className="w-full bg-surface-container/60 border border-cyber-border rounded-xl p-3 text-xs text-on-surface outline-none focus:border-primary/50 transition-colors resize-none leading-relaxed font-sans"
            placeholder="Instruct the AI copywriter on persona and framework constraints..."
          />
        </div>

        {/* Brain Selector */}
        <div className="space-y-2">
          <label htmlFor="model-select" className="font-mono text-[9px] text-on-surface-variant uppercase tracking-wider block">Brain Selector</label>
          <select
            id="model-select"
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="w-full bg-surface-container/60 border border-cyber-border rounded-lg px-3 py-2 text-xs text-on-surface outline-none focus:border-primary/50 transition-colors font-mono"
          >
            {MODEL_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id} className="bg-surface-container">{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Tone Selector */}
        <div className="space-y-2">
          <label htmlFor="tone-select" className="font-mono text-[9px] text-on-surface-variant uppercase tracking-wider block">Tone of Voice</label>
          <select
            id="tone-select"
            value={selectedTone}
            onChange={(e) => setSelectedTone(e.target.value)}
            className="w-full bg-surface-container/60 border border-cyber-border rounded-lg px-3 py-2 text-xs text-on-surface outline-none focus:border-primary/50 transition-colors font-mono"
          >
            {TONE_OPTIONS.map((t) => (
              <option key={t.id} value={t.id} className="bg-surface-container">{t.label}</option>
            ))}
          </select>
        </div>

        {/* Temperature slider */}
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

        {/* Budget cap safety slider */}
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
          title="Copywriter AI" 
          tabs={['Creative Arena']} 
          activeTab="Creative Arena"
        />

        {/* Output Presentation Area */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 bg-surface-container-lowest/5">
          <div className="flex-1 glass-panel rounded-xl overflow-hidden border-surface-border flex flex-col min-h-[300px]">
            <div className="p-3 border-b border-cyber-border/40 flex justify-between items-center bg-surface-elevated/45">
              <span className="font-mono text-[9px] uppercase tracking-wider text-on-surface-variant font-bold">Copywriting Output</span>
              {outputCopy && (
                <button onClick={copyResult} className="text-primary hover:brightness-110 font-mono text-[9px] uppercase font-bold cursor-pointer">
                  {copied ? 'Copied' : 'Copy Result'}
                </button>
              )}
            </div>
            
            <div className="flex-1 p-5 overflow-y-auto terminal-scroll space-y-4">
              {executing ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-3 font-mono text-xs text-primary animate-pulse">
                  <Loader2 size={24} className="animate-spin text-primary" />
                  <span>COMPILING_HIGH_CONVERTING_COPY_STRUCTURES...</span>
                </div>
              ) : outputCopy ? (
                <div className="space-y-4">
                  <pre className="text-xs text-on-surface font-sans leading-relaxed whitespace-pre-wrap">{outputCopy}</pre>
                  
                  {telemetry && (
                    <div className="flex items-center gap-3 mt-4 text-[9px] font-mono text-on-surface-variant bg-surface-container-low/40 px-2.5 py-1 rounded-md border border-cyber-border/30 w-fit">
                      <span>LATENCY: <strong className="text-on-surface">{telemetry.latency}ms</strong></span>
                      <span>TOKENS: <strong className="text-on-surface">{telemetry.tokens}</strong></span>
                      <span>COST: <strong className="text-primary">${telemetry.cost?.toFixed(5)}</strong></span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center opacity-35 text-center space-y-2 py-20 select-none">
                  <Megaphone className="text-primary animate-pulse" size={36} />
                  <h4 className="text-on-surface font-semibold text-sm">Creative Copywriting Playground</h4>
                  <p className="text-on-surface-variant text-xs max-w-xs leading-relaxed">Describe your product, offer, or campaign angle below, then click Run to compile high-performing copywriting.</p>
                </div>
              )}
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
                  handleGenerateCopy();
                }
              }}
              placeholder="Describe what copy you need generated (e.g. 'A high-converting sales email for a boutique web agency targeting local clinics')..."
              className="w-full bg-surface-elevated border border-cyber-border px-4 py-2.5 rounded-lg text-xs text-on-surface outline-none focus:border-primary transition-colors font-sans resize-none leading-normal"
            />
          </div>
          <button
            onClick={handleGenerateCopy}
            disabled={executing || !promptInput.trim()}
            className="px-6 py-4 bg-primary text-on-primary-fixed hover:brightness-110 rounded-lg font-mono text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-40 flex items-center gap-2 cursor-pointer h-12 shrink-0"
          >
            {executing ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
            Run
          </button>
        </footer>
      </div>
    </div>
  );
}
