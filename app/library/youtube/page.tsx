"use client";

import { useState } from 'react';
import { TopNav } from '@/components/layout/TopNav';
import { Sparkles, Youtube, Loader2, Check, Download, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function YouTubeStudioPage() {
  const [topic, setTopic] = useState("");
  const [targetAudience, setTargetAudience] = useState("Beginners");
  const [videoLength, setVideoLength] = useState("10");
  
  const [executing, setExecuting] = useState(false);
  const [status, setStatus] = useState("");
  const [results, setResults] = useState<any>(null);

  const handleRun = async () => {
    if (!topic.trim()) return;
    setExecuting(true);
    setResults(null);
    setStatus("Analyzing YouTube search trends...");

    try {
      const res = await fetch('/api/agents/youtube', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, targetAudience, videoLength })
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
      <TopNav title="Enterprise YouTube Studio" tabs={['Agent Execution']} activeTab="Agent Execution" />

      <main className="flex-1 flex overflow-hidden">
        {/* Left Panel: Configuration */}
        <aside className="w-[450px] border-r border-cyber-border bg-surface-elevated/20 flex flex-col overflow-y-auto shrink-0 z-20">
          <div className="p-6 border-b border-cyber-border">
            <Link href="/library" className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors text-sm font-mono uppercase tracking-wider mb-6">
              <ArrowLeft size={16} /> Back to Library
            </Link>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-error/10 border border-error/20 flex items-center justify-center">
                <Youtube size={20} className="text-error" />
              </div>
              <h1 className="text-xl font-bold text-on-surface">YouTube Studio</h1>
            </div>
            <p className="text-sm text-on-surface-variant">Produce complete 10–20 minute YouTube videos from a single topic.</p>
          </div>

          <div className="p-6 space-y-6 flex-1">
            <div className="space-y-2">
              <label className="text-xs font-bold font-mono uppercase tracking-widest text-on-surface-variant">Video Topic / Idea</label>
              <textarea
                value={topic}
                onChange={e => setTopic(e.target.value)}
                placeholder="e.g. How to build an AI agent using Next.js and Gemini."
                rows={4}
                className="w-full bg-surface border border-cyber-border rounded-lg px-4 py-3 text-sm text-on-surface outline-none focus:border-error transition-colors resize-none"
                disabled={executing}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold font-mono uppercase tracking-widest text-on-surface-variant">Target Audience</label>
                <select
                  value={targetAudience}
                  onChange={e => setTargetAudience(e.target.value)}
                  className="w-full bg-surface border border-cyber-border rounded-lg px-4 py-3 text-sm text-on-surface outline-none focus:border-error transition-colors appearance-none"
                  disabled={executing}
                >
                  <option value="Beginners">Beginners</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced Experts">Advanced Experts</option>
                  <option value="General Public">General Public</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold font-mono uppercase tracking-widest text-on-surface-variant">Est. Length</label>
                <select
                  value={videoLength}
                  onChange={e => setVideoLength(e.target.value)}
                  className="w-full bg-surface border border-cyber-border rounded-lg px-4 py-3 text-sm text-on-surface outline-none focus:border-error transition-colors appearance-none"
                  disabled={executing}
                >
                  <option value="5">~5 Minutes</option>
                  <option value="10">~10 Minutes</option>
                  <option value="20">~20 Minutes</option>
                  <option value="45">~45 Minute Deep Dive</option>
                </select>
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-cyber-border bg-surface-container-lowest/50 mt-auto">
            <button
              onClick={handleRun}
              disabled={executing || !topic}
              className="w-full h-12 bg-error text-on-primary-fixed rounded-xl font-bold font-mono uppercase tracking-widest transition-all disabled:opacity-50 hover:brightness-110 flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(var(--error-rgb),0.3)]"
            >
              {executing ? <Loader2 size={18} className="animate-spin text-white" /> : <Sparkles size={18} className="text-white" />}
              <span className="text-white">{executing ? 'Executing Pipeline...' : 'Run Agent'}</span>
            </button>
          </div>
        </aside>

        {/* Right Panel: Execution & Results */}
        <div className="flex-1 bg-surface-container-lowest/20 flex flex-col relative">
          {!executing && !results ? (
            <div className="m-auto text-center opacity-40 select-none">
              <Youtube size={48} className="mx-auto mb-4" />
              <h2 className="text-xl font-bold text-on-surface mb-2">Awaiting Context</h2>
              <p className="text-on-surface-variant max-w-sm">Provide your video topic in the left panel. The agent will research SEO, write a script, outline chapters, and create thumbnail concepts.</p>
            </div>
          ) : executing && !results ? (
            <div className="m-auto text-center flex flex-col items-center max-w-md">
              <div className="w-16 h-16 rounded-full border-4 border-cyber-border border-t-error animate-spin mb-6" />
              <h2 className="text-2xl font-bold text-on-surface mb-3 animate-pulse">Agent is Working</h2>
              <div className="glass-panel p-4 w-full flex items-center justify-center">
                <p className="font-mono text-error text-sm uppercase tracking-wider">{status}</p>
              </div>
            </div>
          ) : results ? (
            <div className="flex-1 overflow-y-auto p-8 terminal-scroll space-y-8 animate-fade-in">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-on-surface flex items-center gap-2">
                    <Check className="text-error" size={24} /> Production Brief Generated
                  </h2>
                  <p className="text-on-surface-variant">Your long-form video package is ready.</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-surface-elevated hover:bg-surface-border border border-cyber-border rounded-lg text-sm font-mono uppercase text-on-surface transition-colors">
                  <Download size={16} /> Export to Notion
                </button>
              </div>

              {/* SEO & Meta Data */}
              <div className="glass-panel p-6 border-surface-border">
                <h3 className="text-[10px] font-mono text-error uppercase tracking-widest font-bold mb-4">YouTube Metadata & SEO</h3>
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] font-mono text-on-surface-variant uppercase mb-1 block">Optimized Title</span>
                    <h4 className="text-lg font-bold text-on-surface">{results.seo.title}</h4>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-on-surface-variant uppercase mb-1 block">Description & Tags</span>
                    <div className="bg-surface-elevated/40 p-4 rounded-lg border border-cyber-border/40 font-sans text-sm leading-relaxed whitespace-pre-wrap text-on-surface">
                      {results.seo.description}
                    </div>
                  </div>
                </div>
              </div>

              {/* Thumbnail Concepts */}
              <div className="glass-panel p-6 border-surface-border">
                <h3 className="text-[10px] font-mono text-error uppercase tracking-widest font-bold mb-2">High-CTR Thumbnail Concepts</h3>
                <div className="bg-surface-elevated/40 p-4 rounded-lg border border-cyber-border/40 font-sans text-sm leading-relaxed whitespace-pre-wrap text-on-surface">
                  {results.thumbnails}
                </div>
              </div>

              {/* Chapter Outline */}
              <div className="glass-panel p-6 border-surface-border">
                <h3 className="text-[10px] font-mono text-error uppercase tracking-widest font-bold mb-2">Video Structure & Chapters</h3>
                <div className="bg-surface-elevated/40 p-4 rounded-lg border border-cyber-border/40 font-sans text-sm leading-relaxed whitespace-pre-wrap text-on-surface">
                  {results.chapters}
                </div>
              </div>

              {/* Full Script */}
              <div className="glass-panel p-6 border-surface-border">
                <h3 className="text-[10px] font-mono text-error uppercase tracking-widest font-bold mb-2">Complete Shooting Script</h3>
                <div className="bg-surface-elevated/40 p-5 rounded-xl border border-cyber-border/40 font-mono text-sm leading-relaxed whitespace-pre-wrap text-on-surface">
                  {results.script}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}
