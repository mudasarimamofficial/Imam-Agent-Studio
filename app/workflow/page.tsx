"use client";

import { useEffect, useState, useRef } from 'react';
import { TopNav } from '@/components/layout/TopNav';
import { 
  Video, Sliders, Play, Loader2, Sparkles, Check, Info, HelpCircle
} from 'lucide-react';

export default function VideoScriptAssistantPage() {
  const [agents, setAgents] = useState<any[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [systemInstructions, setSystemInstructions] = useState(
    "You are a world-class Video Script Assistant. Generate highly engaging, viral video scripts with clear timestamps, speaker narration, visual/audio directions, and high-impact hooks."
  );
  const [preFlightModel, setPreFlightModel] = useState("auto");
  const [temperature, setTemperature] = useState(0.7);
  const [budgetCap, setBudgetCap] = useState(5.0);
  const [maxTokens, setMaxTokens] = useState(4000);

  const [promptInput, setPromptInput] = useState("");
  const [outputScript, setOutputScript] = useState("");
  const [executing, setExecuting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

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
          body: JSON.stringify({ name: 'Video Script Assistant', role: 'Content Generator', model: 'gemini-2.5-flash' })
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

  const handleGenerateScript = async () => {
    if (!promptInput.trim() || !selectedAgentId || executing) return;
    const topic = promptInput.trim();
    setExecuting(true);
    setOutputScript("");

    try {
      const res = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_id: selectedAgentId,
          instruction: `Context & System Instruction overrides:\n${systemInstructions}\n\nModel parameters: Temperature ${temperature}\n\nTask: Generate a full video script for the following topic: ${topic}`,
          task_type: "reasoning"
        })
      });
      const json = await res.json();
      if (json.success && json.data) {
        setOutputScript(json.data.result);
      } else {
        setOutputScript(`Error: ${json.error?.message || "Execution engine timeout"}`);
      }
    } catch (err) {
      setOutputScript("Network error during scripting sequence.");
    } finally {
      setExecuting(false);
    }
  };

  const copyScript = async () => {
    if (!outputScript) return;
    try {
      await navigator.clipboard.writeText(outputScript);
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
            <Video className="text-primary animate-pulse" size={16} />
            <span className="font-mono text-[10px] text-primary uppercase tracking-wider font-bold">Script Settings</span>
          </div>
          <h3 className="font-sans text-sm font-bold text-on-surface">Video Script Config</h3>
          <p className="text-[10px] text-on-surface-variant font-mono mt-0.5">Configure system rules &amp; sliders</p>
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
            placeholder="Instruct the AI on persona and scripting format..."
          />
        </div>

        {/* Brain Selector */}
        <div className="space-y-2">
          <label htmlFor="model-select" className="font-mono text-[9px] text-on-surface-variant uppercase tracking-wider block">Brain Selector</label>
          <select
            id="model-select"
            value={preFlightModel}
            onChange={(e) => setPreFlightModel(e.target.value)}
            className="w-full bg-surface-container/60 border border-cyber-border rounded-lg px-3 py-2 text-xs text-on-surface outline-none focus:border-primary/50 transition-colors font-mono"
          >
            <option value="auto">Fast &amp; Balanced (Gemini Flash)</option>
            <option value="pro">Deep Thinking (NVIDIA Nemotron Ultra)</option>
            <option value="flash">Open Source Logic (DeepSeek Pro)</option>
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
          title="Video Script Assistant" 
          tabs={['Script Arena']} 
          activeTab="Script Arena"
        />

        {/* Output Presentation Area */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 bg-surface-container-lowest/5">
          <div className="flex-1 glass-panel rounded-xl overflow-hidden border-surface-border flex flex-col min-h-[300px]">
            <div className="p-3 border-b border-cyber-border/40 flex justify-between items-center bg-surface-elevated/45">
              <span className="font-mono text-[9px] uppercase tracking-wider text-on-surface-variant font-bold">Generated Video Script</span>
              {outputScript && (
                <button onClick={copyScript} className="text-primary hover:brightness-110 font-mono text-[9px] uppercase font-bold cursor-pointer">
                  {copied ? 'Copied' : 'Copy Result'}
                </button>
              )}
            </div>
            
            <div className="flex-1 p-5 overflow-y-auto terminal-scroll">
              {executing ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-3 font-mono text-xs text-primary animate-pulse">
                  <Loader2 size={24} className="animate-spin text-primary" />
                  <span>COMPILING_AI_VIDEO_SCRIPT_CHANNELS...</span>
                </div>
              ) : outputScript ? (
                <pre className="text-xs text-on-surface font-sans leading-relaxed whitespace-pre-wrap">{outputScript}</pre>
              ) : (
                <div className="h-full flex flex-col items-center justify-center opacity-35 text-center space-y-2 py-20 select-none">
                  <Video className="text-primary animate-pulse" size={36} />
                  <h4 className="text-on-surface font-semibold text-sm">Video Script Playground</h4>
                  <p className="text-on-surface-variant text-xs max-w-xs leading-relaxed">Enter a script topic below and press Run to compile visual layouts, hooks, and narration outlines.</p>
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
                  handleGenerateScript();
                }
              }}
              placeholder="What topic do you want this assistant to build a video script for? (e.g. 'A 30-second TikTok on Next.js 15 routing')..."
              className="w-full bg-surface-elevated border border-cyber-border px-4 py-2.5 rounded-lg text-xs text-on-surface outline-none focus:border-primary transition-colors font-sans resize-none leading-normal"
            />
          </div>
          <button
            onClick={handleGenerateScript}
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
