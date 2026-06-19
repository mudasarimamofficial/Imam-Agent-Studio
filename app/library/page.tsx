"use client";

import { useState } from 'react';
import { TopNav } from '@/components/layout/TopNav';
import { Sparkles, MessageSquare, Video, Youtube, Target, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const AGENTS = [
  {
    id: 'social-media-architect',
    name: 'Enterprise Social Media Architect',
    description: 'A complete social media marketing department. Generate posts, hashtags, and image prompts for LinkedIn, X, Instagram, and TikTok.',
    icon: MessageSquare,
    color: 'text-primary',
    bg: 'bg-primary/10',
    border: 'border-primary/20',
    comingSoon: false,
    path: '/library/social-media'
  },
  {
    id: 'shorts-creator',
    name: 'Enterprise Reel & Shorts Creator',
    description: 'The complete short-form video department. Generate hooks, scene breakdowns, camera directions, and AI video prompts.',
    icon: Video,
    color: 'text-secondary',
    bg: 'bg-secondary/10',
    border: 'border-secondary/20',
    comingSoon: false,
    path: '/library/shorts'
  },
  {
    id: 'youtube-studio',
    name: 'Enterprise YouTube Studio',
    description: 'Produce complete 10–20 minute YouTube videos. Includes topic research, SEO, storytelling, B-roll directions, and voiceover.',
    icon: Youtube,
    color: 'text-error',
    bg: 'bg-error/10',
    border: 'border-error/20',
    comingSoon: false,
    path: '/library/youtube'
  },
  {
    id: 'hunt-center',
    name: 'Ultimate Hunt Center',
    description: 'The flagship CRM. Intelligently discover, enrich, and automatically draft outreach for B2B prospects.',
    icon: Target,
    color: 'text-strategic-violet',
    bg: 'bg-strategic-violet/10',
    border: 'border-strategic-violet/20',
    comingSoon: false,
    path: '/hunt'
  }
];

export default function LibraryPage() {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <div className="flex-1 flex flex-col h-full bg-background relative overflow-hidden">
      {/* Background Soft Glows for Premium Vibe */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <div className="absolute top-[10%] left-[5%] w-[500px] h-[500px] bg-primary/15 rounded-full blur-[120px]" />
        <div className="absolute bottom-[10%] right-[5%] w-[400px] h-[400px] bg-secondary/10 rounded-full blur-[100px]" />
      </div>

      <TopNav title="Agent Library" tabs={['Featured Experts']} activeTab="Featured Experts" />

      <main className="flex-1 overflow-y-auto relative z-10 p-8 lg:p-12">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12">
            <h1 className="text-3xl font-bold text-on-surface flex items-center gap-3">
              <Sparkles className="text-primary" size={28} />
              Your Enterprise AI Workforce
            </h1>
            <p className="text-on-surface-variant mt-3 text-lg max-w-2xl">
              Hire an expert for your business needs. Provide your business context, click run, and let the AI handle the complexity behind the scenes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {AGENTS.map((agent) => {
              const Icon = agent.icon;
              return (
                <Link
                  key={agent.id}
                  href={agent.path}
                  onMouseEnter={() => setHoveredId(agent.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  className={`relative overflow-hidden group glass-panel rounded-2xl p-6 transition-all duration-300 border ${
                    hoveredId === agent.id ? `border-${agent.color.replace('text-', '')}/40 shadow-lg shadow-${agent.color.replace('text-', '')}/5` : 'border-cyber-border'
                  } ${agent.comingSoon ? 'opacity-80' : ''}`}
                >
                  <div className="flex items-start gap-5">
                    <div className={`w-14 h-14 shrink-0 rounded-xl flex items-center justify-center ${agent.bg} ${agent.border} border transition-transform duration-300 ${hoveredId === agent.id ? 'scale-110' : ''}`}>
                      <Icon size={24} className={agent.color} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h2 className="text-xl font-bold text-on-surface">{agent.name}</h2>
                        {agent.comingSoon && (
                          <span className="text-[10px] uppercase tracking-wider font-mono bg-surface-elevated border border-cyber-border px-2 py-1 rounded text-on-surface-variant">
                            Coming Soon
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-on-surface-variant leading-relaxed">
                        {agent.description}
                      </p>
                    </div>
                  </div>

                  {!agent.comingSoon && (
                    <div className={`absolute bottom-6 right-6 flex items-center gap-2 text-sm font-bold font-mono uppercase tracking-wide transition-all duration-300 ${
                      hoveredId === agent.id ? `${agent.color} translate-x-0 opacity-100` : 'text-on-surface-variant translate-x-2 opacity-0'
                    }`}>
                      Hire Expert <ArrowRight size={16} />
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
