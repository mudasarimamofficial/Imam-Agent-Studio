import Link from 'next/link';
import {
  TerminalSquare,
  Network,
  Database,
  Target,
  Cpu,
  ArrowRight,
  ShieldCheck,
  Activity,
  Workflow as WorkflowIcon,
} from 'lucide-react';

const FEATURES = [
  {
    icon: Network,
    title: 'Multi-Agent Orchestration',
    body: 'Deploy a fleet of autonomous agents with live status, task accounting, and a configurable concurrency ceiling enforced at the database layer.',
    accent: 'text-primary',
  },
  {
    icon: Database,
    title: 'Memory OS',
    body: 'Every agent action, reflection, and output is persisted to a row-level-secured store — a durable, queryable memory that survives restarts.',
    accent: 'text-telemetry-blue',
  },
  {
    icon: Target,
    title: 'Client Hunt Engine',
    body: 'Real Google Places intelligence: search, score, and capture leads into your isolated pipeline with website and rating signals.',
    accent: 'text-strategic-violet',
  },
  {
    icon: Cpu,
    title: 'Hybrid LLM Routing',
    body: 'Weighted routing across Gemini and NVIDIA NIM with task-type affinity, automatic fallback, timeouts, and per-call telemetry.',
    accent: 'text-agent-active-glow',
  },
];

const STATS = [
  { label: 'Inference providers', value: '2', note: 'Gemini · NVIDIA' },
  { label: 'Workflow node types', value: '4', note: 'LLM · API · Memory · Tool' },
  { label: 'Tenant isolation', value: 'RLS', note: 'Postgres row-level security' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen w-full overflow-y-auto bg-obsidian-deep text-on-surface">
      {/* Ambient depth */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[15%] w-[600px] h-[600px] bg-primary/5 rounded-full blur-[160px]" />
        <div className="absolute bottom-[-10%] right-[10%] w-[500px] h-[500px] bg-telemetry-blue/5 rounded-full blur-[150px]" />
      </div>

      <div className="relative z-10">
        {/* Nav */}
        <header className="sticky top-0 z-40 glass-nav">
          <nav className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary-container/20 flex items-center justify-center">
                <TerminalSquare size={20} className="text-primary" />
              </div>
              <div className="leading-none">
                <div className="font-bold text-on-surface tracking-tight">IAS OS</div>
                <div className="font-mono text-[10px] uppercase tracking-wider text-on-surface-variant opacity-70 mt-1">
                  Visual AI Engine
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="hidden sm:inline-flex font-mono text-[13px] text-on-surface-variant hover:text-on-surface transition-colors px-3 py-2"
              >
                Sign in
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 bg-primary text-on-primary-fixed px-4 py-2 rounded-lg font-mono text-[13px] font-bold hover:brightness-110 transition-all shadow-[0_4px_16px_-4px_rgba(var(--primary-rgb),0.4)]"
              >
                Launch <ArrowRight size={14} />
              </Link>
            </div>
          </nav>
        </header>

        {/* Hero */}
        <section className="max-w-7xl mx-auto px-6 pt-20 pb-24 md:pt-32 md:pb-32 text-center">
          <div className="inline-flex items-center gap-2 glass-panel rounded-full px-4 py-1.5 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="font-mono text-[11px] uppercase tracking-widest text-on-surface-variant">
              Autonomous Agent Operating System
            </span>
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05] max-w-4xl mx-auto">
            The Definitive Visual
            <br />
            <span className="bg-gradient-to-r from-primary via-agent-active-glow to-telemetry-blue bg-clip-text text-transparent">
              AI Operating System
            </span>
          </h1>

          <p className="mt-6 text-lg md:text-xl text-on-surface-variant max-w-2xl mx-auto leading-relaxed">
            Orchestrate a fleet of autonomous agents, a durable memory graph, and hybrid LLM
            routing — from one frosted-glass mission control. Real execution, real persistence,
            zero theater.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login"
              className="group inline-flex items-center gap-2 bg-primary text-on-primary-fixed px-7 py-3.5 rounded-xl font-mono text-sm font-bold uppercase tracking-wider hover:brightness-110 transition-all shadow-[0_8px_30px_-6px_rgba(var(--primary-rgb),0.5)]"
            >
              Enter Mission Control
              <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <a
              href="#features"
              className="inline-flex items-center gap-2 glass-panel hover-lift px-7 py-3.5 rounded-xl font-mono text-sm text-on-surface uppercase tracking-wider"
            >
              Explore Capabilities
            </a>
          </div>

          {/* Stat strip */}
          <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {STATS.map((s) => (
              <div key={s.label} className="glass-panel rounded-xl px-5 py-4">
                <div className="text-3xl font-bold text-on-surface">{s.value}</div>
                <div className="font-mono text-[11px] uppercase tracking-wider text-on-surface-variant mt-1">
                  {s.label}
                </div>
                <div className="font-mono text-[10px] text-on-surface-variant/60 mt-0.5">{s.note}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Feature grid */}
        <section id="features" className="max-w-7xl mx-auto px-6 pb-24 scroll-mt-20">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-4xl font-bold tracking-tight">One console. Every layer.</h2>
            <p className="mt-3 text-on-surface-variant max-w-xl mx-auto">
              Each subsystem is wired to a live backend — no mockups, no placeholder numbers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="glass-panel hover-lift rounded-2xl p-6 md:p-8 flex flex-col">
                  <div className={`w-12 h-12 rounded-xl bg-surface-elevated border border-cyber-border flex items-center justify-center mb-5 ${f.accent}`}>
                    <Icon size={24} />
                  </div>
                  <h3 className="text-lg font-semibold text-on-surface mb-2">{f.title}</h3>
                  <p className="text-sm text-on-surface-variant leading-relaxed">{f.body}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Trust band */}
        <section className="max-w-7xl mx-auto px-6 pb-24">
          <div className="glass-elevated rounded-2xl p-8 md:p-12 flex flex-col md:flex-row items-start md:items-center gap-8 justify-between">
            <div className="flex flex-col gap-4 max-w-xl">
              <div className="flex items-center gap-2 text-primary">
                <ShieldCheck size={18} />
                <span className="font-mono text-[11px] uppercase tracking-widest">Production-grade by default</span>
              </div>
              <h3 className="text-2xl md:text-3xl font-bold tracking-tight">Built for real operators.</h3>
              <p className="text-on-surface-variant text-sm leading-relaxed">
                Supabase-backed persistence, row-level multi-tenancy, rate limiting, request
                timeouts with retry, and SSRF-guarded tool execution — the boring guarantees that
                make an AI platform trustworthy.
              </p>
            </div>
            <div className="flex flex-col gap-3 font-mono text-[13px] shrink-0">
              <div className="flex items-center gap-3 text-on-surface-variant">
                <Activity size={16} className="text-primary" /> Live telemetry &amp; honest health
              </div>
              <div className="flex items-center gap-3 text-on-surface-variant">
                <WorkflowIcon size={16} className="text-telemetry-blue" /> Real multi-node workflows
              </div>
              <div className="flex items-center gap-3 text-on-surface-variant">
                <ShieldCheck size={16} className="text-strategic-violet" /> Per-tenant data isolation
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="max-w-7xl mx-auto px-6 pb-28 text-center">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight max-w-3xl mx-auto leading-tight">
            Your agents are waiting.
          </h2>
          <p className="mt-4 text-on-surface-variant">Sign in to take command of the operating system.</p>
          <Link
            href="/login"
            className="mt-8 group inline-flex items-center gap-2 bg-primary text-on-primary-fixed px-8 py-4 rounded-xl font-mono text-sm font-bold uppercase tracking-wider hover:brightness-110 transition-all shadow-[0_8px_30px_-6px_rgba(var(--primary-rgb),0.5)]"
          >
            Enter Mission Control
            <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </section>

        {/* Footer */}
        <footer className="border-t border-cyber-border">
          <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-on-surface-variant">
              <TerminalSquare size={16} className="text-primary" />
              <span className="font-mono text-[12px]">IAS OS — Imam Agent Studio</span>
            </div>
            <div className="font-mono text-[11px] text-on-surface-variant/60 uppercase tracking-wider">
              Isolated tenancy · Row-level security enforced
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
