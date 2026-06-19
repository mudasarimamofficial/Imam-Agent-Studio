"use client";

import Link from 'next/link';
import { ArrowRight, ShieldCheck, ChevronDown } from 'lucide-react';
import { useWorkspace } from './WorkspaceContext';

interface TopNavProps {
  title: string;
  tabs?: string[];
  activeTab?: string;
}

export function TopNav({ title, tabs, activeTab }: TopNavProps) {
  const { role, workspaceName } = useWorkspace();

  return (
    <header className="flex justify-between items-center px-6 h-16 w-full glass-nav sticky top-0 z-40">
      <div className="flex items-center gap-6 min-w-0">
        <h2 className="font-bold text-on-surface hidden md:block whitespace-nowrap">{title}</h2>

        {/* Section labels — non-interactive context indicators, not stub buttons */}
        {tabs && tabs.length > 0 && (
          <nav className="hidden md:flex items-center gap-5 text-sm ml-2">
            {tabs.map((tab) => (
              <span
                key={tab}
                aria-current={tab === activeTab ? 'page' : undefined}
                className={`pb-1 border-b-2 font-mono tracking-tight ${
                  tab === activeTab
                    ? 'text-primary border-primary'
                    : 'text-on-surface-variant/60 border-transparent cursor-not-allowed opacity-50'
                }`}
                title={tab !== activeTab ? "Coming Soon" : undefined}
              >
                {tab}
              </span>
            ))}
          </nav>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* RBAC Indicator */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-cyber-border bg-surface-container-low/50 hover:bg-surface-container-low cursor-pointer transition-colors">
          <ShieldCheck size={14} className={role === 'Admin' ? 'text-primary' : 'text-on-surface-variant'} />
          <div className="flex flex-col">
            <span className="font-mono text-[10px] text-on-surface-variant leading-none">{role}</span>
            <span className="font-mono text-[11px] text-on-surface leading-tight truncate max-w-[120px]">{workspaceName}</span>
          </div>
          <ChevronDown size={14} className="text-on-surface-variant ml-1" />
        </div>

        <Link
          href="/library"
          className="inline-flex items-center gap-1.5 bg-primary text-on-primary-fixed px-4 py-1.5 rounded-md font-mono text-[13px] font-bold hover:brightness-110 transition-all shadow-[0_4px_16px_-4px_rgba(var(--primary-rgb),0.4)]"
        >
          Deploy Agent <ArrowRight size={13} />
        </Link>
      </div>
    </header>
  );
}
