import Link from 'next/link';
import { Layers, Database, Target, Map } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-obsidian-deep text-on-surface flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background gradients for visual flair */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-telemetry-blue/5 blur-[120px] pointer-events-none" />

      {/* Hero Section */}
      <main className="z-10 flex flex-col items-center text-center max-w-4xl w-full">
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
          The Definitive Visual AI Operating System.
        </h1>
        <p className="text-lg text-on-surface-variant max-w-2xl mb-12 font-mono">
          Orchestrate multi-agent workflows, persist intelligence in memory, and hunt for insights with unprecedented scale and clarity.
        </p>

        <Link
          href="/login"
          className="group relative px-8 py-4 bg-primary text-on-primary-fixed font-mono font-bold uppercase tracking-wider rounded-lg shadow-[0_0_24px_rgba(163,230,53,0.3)] hover:shadow-[0_0_40px_rgba(163,230,53,0.5)] transition-all duration-300 hover:scale-105"
        >
          <span className="relative z-10 flex items-center gap-2">
            Enter Mission Control
          </span>
          <div className="absolute inset-0 rounded-lg bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 mix-blend-overlay" />
        </Link>
      </main>

      {/* Feature Grid */}
      <section className="z-10 mt-24 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl w-full">
        {/* Multi-Agent Orchestration */}
        <div className="glass-panel rounded-2xl p-8 hover-lift flex flex-col gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-2">
            <Layers size={24} />
          </div>
          <h3 className="text-xl font-bold tracking-tight">Multi-Agent Orchestration</h3>
          <p className="text-on-surface-variant font-mono text-sm leading-relaxed">
            Deploy and manage specialized AI fleets. Connect agents in complex visual pipelines for autonomous task execution and reasoning.
          </p>
        </div>

        {/* Memory OS */}
        <div className="glass-panel rounded-2xl p-8 hover-lift flex flex-col gap-4">
          <div className="w-12 h-12 rounded-xl bg-telemetry-blue/10 border border-telemetry-blue/20 flex items-center justify-center text-telemetry-blue mb-2">
            <Database size={24} />
          </div>
          <h3 className="text-xl font-bold tracking-tight">Memory OS</h3>
          <p className="text-on-surface-variant font-mono text-sm leading-relaxed">
            Persistent long-term memory across sessions. Agents recall past interactions, semantic context, and accumulated intelligence over time.
          </p>
        </div>

        {/* Client Hunt Engine */}
        <div className="glass-panel rounded-2xl p-8 hover-lift flex flex-col gap-4">
          <div className="w-12 h-12 rounded-xl bg-error/10 border border-error/20 flex items-center justify-center text-error mb-2">
            <Target size={24} />
          </div>
          <h3 className="text-xl font-bold tracking-tight">Client Hunt Engine</h3>
          <p className="text-on-surface-variant font-mono text-sm leading-relaxed">
            Automated deep-web reconnaissance. Instruct agents to source, qualify, and engage high-value targets with dynamic parameters.
          </p>
        </div>

        {/* Hybrid LLM Routing */}
        <div className="glass-panel rounded-2xl p-8 hover-lift flex flex-col gap-4">
          <div className="w-12 h-12 rounded-xl bg-warning/10 border border-warning/20 flex items-center justify-center text-warning mb-2">
            <Map size={24} />
          </div>
          <h3 className="text-xl font-bold tracking-tight">Hybrid LLM Routing</h3>
          <p className="text-on-surface-variant font-mono text-sm leading-relaxed">
            Intelligent model selection per-task. Seamlessly route queries to Gemini, Claude, or local specialized models to optimize compute and accuracy.
          </p>
        </div>
      </section>
    </div>
  );
}
