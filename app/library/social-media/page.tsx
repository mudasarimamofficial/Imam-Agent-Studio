"use client";

import { useState } from 'react';
import { TopNav } from '@/components/layout/TopNav';
import { Sparkles, MessageSquare, Loader2, Check, Download, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function SocialMediaAgentPage() {
  const [businessName, setBusinessName] = useState("");
  const [brandVoice, setBrandVoice] = useState("Professional and authoritative");
  const [goals, setGoals] = useState("");
  const [platforms, setPlatforms] = useState({ linkedin: true, twitter: false, instagram: false });
  
  const [executing, setExecuting] = useState(false);
  const [status, setStatus] = useState("");
  const [results, setResults] = useState<any>(null);

  const togglePlatform = (key: keyof typeof platforms) => {
    setPlatforms(p => ({ ...p, [key]: !p[key] }));
  };

  const handleRun = async () => {
    if (!businessName.trim() || !goals.trim()) return;
    setExecuting(true);
    setResults(null);
    setStatus("Researching industry trends...");

    try {
      const res = await fetch('/api/agents/social-media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessName, brandVoice, goals, platforms })
      });
      
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let completeResponse = "";

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
      <TopNav title="Enterprise Social Media Architect" tabs={['Agent Execution']} activeTab="Agent Execution" />

      <main className="flex-1 flex overflow-hidden">
        {/* Left Panel: Configuration (Minimalist) */}
        <aside className="w-[450px] border-r border-cyber-border bg-surface-elevated/20 flex flex-col overflow-y-auto shrink-0 z-20">
          <div className="p-6 border-b border-cyber-border">
            <Link href="/library" className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors text-sm font-mono uppercase tracking-wider mb-6">
              <ArrowLeft size={16} /> Back to Library
            </Link>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                <MessageSquare size={20} className="text-primary" />
              </div>
              <h1 className="text-xl font-bold text-on-surface">Social Media Architect</h1>
            </div>
            <p className="text-sm text-on-surface-variant">Provide business context and let the Agent build your campaign.</p>
          </div>

          <div className="p-6 space-y-6 flex-1">
            <div className="space-y-2">
              <label className="text-xs font-bold font-mono uppercase tracking-widest text-on-surface-variant">Business Name</label>
              <input
                type="text"
                value={businessName}
                onChange={e => setBusinessName(e.target.value)}
                placeholder="e.g. ShuMuz Labs"
                className="w-full bg-surface border border-cyber-border rounded-lg px-4 py-3 text-sm text-on-surface outline-none focus:border-primary transition-colors"
                disabled={executing}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold font-mono uppercase tracking-widest text-on-surface-variant">Brand Voice</label>
              <select
                value={brandVoice}
                onChange={e => setBrandVoice(e.target.value)}
                className="w-full bg-surface border border-cyber-border rounded-lg px-4 py-3 text-sm text-on-surface outline-none focus:border-primary transition-colors appearance-none"
                disabled={executing}
              >
                <option value="Professional and authoritative">Professional & Authoritative</option>
                <option value="Casual and conversational">Casual & Conversational</option>
                <option value="Bold and disruptive">Bold & Disruptive</option>
                <option value="Technical and precise">Technical & Precise</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold font-mono uppercase tracking-widest text-on-surface-variant">Campaign Goals</label>
              <textarea
                value={goals}
                onChange={e => setGoals(e.target.value)}
                placeholder="e.g. Launching a new AI automation service for e-commerce brands. Need to drive demo bookings."
                rows={4}
                className="w-full bg-surface border border-cyber-border rounded-lg px-4 py-3 text-sm text-on-surface outline-none focus:border-primary transition-colors resize-none"
                disabled={executing}
              />
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold font-mono uppercase tracking-widest text-on-surface-variant">Target Platforms</label>
              <div className="flex flex-wrap gap-3">
                {Object.keys(platforms).map((p) => (
                  <button
                    key={p}
                    onClick={() => togglePlatform(p as any)}
                    disabled={executing}
                    className={`px-4 py-2 rounded-full border text-sm font-medium transition-all capitalize ${
                      platforms[p as keyof typeof platforms] 
                        ? 'bg-primary/10 border-primary/50 text-primary' 
                        : 'bg-surface border-cyber-border text-on-surface-variant hover:border-on-surface-variant/40'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-cyber-border bg-surface-container-lowest/50 mt-auto">
            <button
              onClick={handleRun}
              disabled={executing || !businessName || !goals}
              className="w-full h-12 bg-primary text-on-primary-fixed rounded-xl font-bold font-mono uppercase tracking-widest transition-all disabled:opacity-50 hover:brightness-110 flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)]"
            >
              {executing ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
              {executing ? 'Executing Pipeline...' : 'Run Agent'}
            </button>
          </div>
        </aside>

        {/* Right Panel: Execution & Results */}
        <div className="flex-1 bg-surface-container-lowest/20 flex flex-col relative">
          {!executing && !results ? (
            <div className="m-auto text-center opacity-40 select-none">
              <MessageSquare size={48} className="mx-auto mb-4" />
              <h2 className="text-xl font-bold text-on-surface mb-2">Awaiting Context</h2>
              <p className="text-on-surface-variant max-w-sm">Provide your business details in the left panel and click Run to generate a complete multi-platform campaign.</p>
            </div>
          ) : executing && !results ? (
            <div className="m-auto text-center flex flex-col items-center max-w-md">
              <div className="w-16 h-16 rounded-full border-4 border-cyber-border border-t-primary animate-spin mb-6" />
              <h2 className="text-2xl font-bold text-on-surface mb-3 animate-pulse">Agent is Working</h2>
              <div className="glass-panel p-4 w-full flex items-center justify-center">
                <p className="font-mono text-primary text-sm uppercase tracking-wider">{status}</p>
              </div>
            </div>
          ) : results ? (
            <div className="flex-1 overflow-y-auto p-8 terminal-scroll space-y-8 animate-fade-in">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-on-surface flex items-center gap-2">
                    <Check className="text-primary" size={24} /> Campaign Generated
                  </h2>
                  <p className="text-on-surface-variant">Your automated social media pipeline is ready.</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-surface-elevated hover:bg-surface-border border border-cyber-border rounded-lg text-sm font-mono uppercase text-on-surface transition-colors">
                  <Download size={16} /> Export All
                </button>
              </div>

              {platforms.linkedin && results.linkedin && (
                <div className="glass-panel p-6 border-surface-border">
                  <h3 className="font-bold text-lg text-on-surface mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#0A66C2]" /> LinkedIn Post
                  </h3>
                  <div className="bg-surface-elevated/40 p-5 rounded-xl border border-cyber-border/40 font-sans text-[15px] leading-relaxed whitespace-pre-wrap text-on-surface">
                    {results.linkedin}
                  </div>
                  {results.linkedinImagePrompt && (
                    <div className="mt-4 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                      <span className="text-[10px] font-mono text-primary uppercase font-bold block mb-1">AI Image Generation Prompt</span>
                      <p className="text-sm text-on-surface-variant">{results.linkedinImagePrompt}</p>
                    </div>
                  )}
                </div>
              )}

              {platforms.twitter && results.twitter && (
                <div className="glass-panel p-6 border-surface-border">
                  <h3 className="font-bold text-lg text-on-surface mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-on-surface" /> X (Twitter) Thread
                  </h3>
                  <div className="bg-surface-elevated/40 p-5 rounded-xl border border-cyber-border/40 font-sans text-[15px] leading-relaxed whitespace-pre-wrap text-on-surface">
                    {results.twitter}
                  </div>
                </div>
              )}

              {platforms.instagram && results.instagram && (
                <div className="glass-panel p-6 border-surface-border">
                  <h3 className="font-bold text-lg text-on-surface mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500" /> Instagram Post
                  </h3>
                  <div className="bg-surface-elevated/40 p-5 rounded-xl border border-cyber-border/40 font-sans text-[15px] leading-relaxed whitespace-pre-wrap text-on-surface">
                    {results.instagram}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}
