"use client";

import { useState } from 'react';
import { TopNav } from '@/components/layout/TopNav';
import { Sparkles, Video, Loader2, Check, Download, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ShortsCreatorPage() {
  const [topic, setTopic] = useState("");
  const [duration, setDuration] = useState("30");
  const [tone, setTone] = useState("High Energy & Fast Paced");
  const [music, setMusic] = useState("");
  
  const [executing, setExecuting] = useState(false);
  const [status, setStatus] = useState("");
  const [results, setResults] = useState<any>(null);

  const handleRun = async () => {
    if (!topic.trim()) return;
    setExecuting(true);
    setResults(null);
    setStatus("Analyzing topic for viral potential...");

    try {
      const res = await fetch('/api/agents/shorts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, duration, tone, music })
      });
      
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n').filter(l => l.trim() !== '');
          
          for (const line of lines) {
            try {
              const data = JSON.parse(line);
              if (data.status) setStatus(data.status);
              if (data.result) setResults(data.result);
            } catch (e) {}
          }
        }
      }
    } catch (err) {
      console.error(err);
      setStatus("Execution failed. Please try again.");
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background relative overflow-hidden">
      <TopNav title="Enterprise Reel & Shorts Creator" tabs={['Agent Execution']} activeTab="Agent Execution" />

      <main className="flex-1 flex overflow-hidden">
        {/* Left Panel: Configuration */}
        <aside className="w-[450px] border-r border-cyber-border bg-surface-elevated/20 flex flex-col overflow-y-auto shrink-0 z-20">
          <div className="p-6 border-b border-cyber-border">
            <Link href="/library" className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors text-sm font-mono uppercase tracking-wider mb-6">
              <ArrowLeft size={16} /> Back to Library
            </Link>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-secondary/10 border border-secondary/20 flex items-center justify-center">
                <Video size={20} className="text-secondary" />
              </div>
              <h1 className="text-xl font-bold text-on-surface">Reel & Shorts Creator</h1>
            </div>
            <p className="text-sm text-on-surface-variant">The complete short-form video department.</p>
          </div>

          <div className="p-6 space-y-6 flex-1">
            <div className="space-y-2">
              <label className="text-xs font-bold font-mono uppercase tracking-widest text-on-surface-variant">Video Topic</label>
              <textarea
                value={topic}
                onChange={e => setTopic(e.target.value)}
                placeholder="e.g. 5 hidden features in iOS 18 that Apple didn't tell you about."
                rows={3}
                className="w-full bg-surface border border-cyber-border rounded-lg px-4 py-3 text-sm text-on-surface outline-none focus:border-secondary transition-colors resize-none"
                disabled={executing}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold font-mono uppercase tracking-widest text-on-surface-variant">Duration</label>
                <select
                  value={duration}
                  onChange={e => setDuration(e.target.value)}
                  className="w-full bg-surface border border-cyber-border rounded-lg px-4 py-3 text-sm text-on-surface outline-none focus:border-secondary transition-colors appearance-none"
                  disabled={executing}
                >
                  <option value="15">15 Seconds</option>
                  <option value="30">30 Seconds</option>
                  <option value="60">60 Seconds</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold font-mono uppercase tracking-widest text-on-surface-variant">Pacing</label>
                <select
                  value={tone}
                  onChange={e => setTone(e.target.value)}
                  className="w-full bg-surface border border-cyber-border rounded-lg px-4 py-3 text-sm text-on-surface outline-none focus:border-secondary transition-colors appearance-none"
                  disabled={executing}
                >
                  <option value="High Energy & Fast Paced">High Energy</option>
                  <option value="Educational & Calm">Educational</option>
                  <option value="Storytelling & Dramatic">Storytelling</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold font-mono uppercase tracking-widest text-on-surface-variant">Music & Sound</label>
              <input
                type="text"
                value={music}
                onChange={e => setMusic(e.target.value)}
                placeholder="e.g. Trending phonk beat, minimal lo-fi, etc."
                className="w-full bg-surface border border-cyber-border rounded-lg px-4 py-3 text-sm text-on-surface outline-none focus:border-secondary transition-colors"
                disabled={executing}
              />
            </div>
          </div>

          <div className="p-6 border-t border-cyber-border bg-surface-container-lowest/50 mt-auto">
            <button
              onClick={handleRun}
              disabled={executing || !topic}
              className="w-full h-12 bg-secondary text-on-primary-fixed rounded-xl font-bold font-mono uppercase tracking-widest transition-all disabled:opacity-50 hover:brightness-110 flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(var(--secondary-fixed-rgb),0.3)]"
            >
              {executing ? <Loader2 size={18} className="animate-spin text-black" /> : <Sparkles size={18} className="text-black" />}
              <span className="text-black">{executing ? 'Executing Pipeline...' : 'Run Agent'}</span>
            </button>
          </div>
        </aside>

        {/* Right Panel: Execution & Results */}
        <div className="flex-1 bg-surface-container-lowest/20 flex flex-col relative">
          {!executing && !results ? (
            <div className="m-auto text-center opacity-40 select-none">
              <Video size={48} className="mx-auto mb-4" />
              <h2 className="text-xl font-bold text-on-surface mb-2">Awaiting Context</h2>
              <p className="text-on-surface-variant max-w-sm">Define your short-form video topic in the left panel to generate a complete script, visual breakdown, and asset prompts.</p>
            </div>
          ) : executing && !results ? (
            <div className="m-auto text-center flex flex-col items-center max-w-md">
              <div className="w-16 h-16 rounded-full border-4 border-cyber-border border-t-secondary animate-spin mb-6" />
              <h2 className="text-2xl font-bold text-on-surface mb-3 animate-pulse">Agent is Working</h2>
              <div className="glass-panel p-4 w-full flex items-center justify-center">
                <p className="font-mono text-secondary text-sm uppercase tracking-wider">{status}</p>
              </div>
            </div>
          ) : results ? (
            <div className="flex-1 overflow-y-auto p-8 terminal-scroll space-y-8 animate-fade-in">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-on-surface flex items-center gap-2">
                    <Check className="text-secondary" size={24} /> Short Generated
                  </h2>
                  <p className="text-on-surface-variant">Your video production brief is ready.</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-surface-elevated hover:bg-surface-border border border-cyber-border rounded-lg text-sm font-mono uppercase text-on-surface transition-colors">
                  <Download size={16} /> Export to PDF
                </button>
              </div>

              {/* Strategy & Hook */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass-panel p-6 border-surface-border">
                  <h3 className="text-[10px] font-mono text-secondary uppercase tracking-widest font-bold mb-2">Viral Hook Variants</h3>
                  <div className="bg-surface-elevated/40 p-4 rounded-lg border border-cyber-border/40 font-sans text-sm leading-relaxed whitespace-pre-wrap text-on-surface">
                    {results.hooks}
                  </div>
                </div>

                <div className="glass-panel p-6 border-surface-border">
                  <h3 className="text-[10px] font-mono text-secondary uppercase tracking-widest font-bold mb-2">Sound & Music Strategy</h3>
                  <div className="bg-surface-elevated/40 p-4 rounded-lg border border-cyber-border/40 font-sans text-sm leading-relaxed whitespace-pre-wrap text-on-surface">
                    {results.sound}
                  </div>
                </div>
              </div>

              {/* Full Script */}
              <div className="glass-panel p-6 border-surface-border">
                <h3 className="text-[10px] font-mono text-secondary uppercase tracking-widest font-bold mb-2">Scene-by-Scene Script & Directions</h3>
                <div className="bg-surface-elevated/40 p-5 rounded-xl border border-cyber-border/40 font-mono text-sm leading-relaxed whitespace-pre-wrap text-on-surface">
                  {results.script}
                </div>
              </div>

              {/* AI Image/Video Prompts */}
              <div className="glass-panel p-6 border-surface-border bg-secondary/5">
                <h3 className="text-[10px] font-mono text-secondary uppercase tracking-widest font-bold mb-2">AI B-Roll Prompts (Midjourney/Runway)</h3>
                <div className="bg-surface-elevated/80 p-5 rounded-xl border border-cyber-border/40 font-sans text-sm leading-relaxed whitespace-pre-wrap text-on-surface">
                  {results.prompts}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}
