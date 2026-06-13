import Link from 'next/link';
import { Search, Bell, Settings, Command, ArrowRight } from 'lucide-react';
import { ComingSoon } from '@/components/ui/ComingSoon';

interface TopNavProps {
  title: string;
  tabs?: string[];
  activeTab?: string;
}

export function TopNav({ title, tabs, activeTab }: TopNavProps) {
  return (
    <header className="flex justify-between items-center px-6 h-16 w-full glass-nav sticky top-0 z-40">
      <div className="flex items-center gap-6">
        <h2 className="font-bold text-on-surface hidden md:block">{title}</h2>

        {tabs && tabs.length > 0 && (
          <nav className="hidden md:flex items-center gap-6 text-sm ml-4">
            {tabs.map(tab =>
              tab === activeTab ? (
                <span
                  key={tab}
                  aria-current="page"
                  className="pb-1 border-b-2 font-mono tracking-tight text-primary border-primary"
                >
                  {tab}
                </span>
              ) : (
                <ComingSoon key={tab} label="View coming soon">
                  <span className="pb-1 border-b-2 font-mono tracking-tight text-on-surface-variant border-transparent">
                    {tab}
                  </span>
                </ComingSoon>
              )
            )}
          </nav>
        )}
      </div>

      <div className="flex items-center gap-4">
        <ComingSoon label="Global search coming soon">
          <div className="hidden md:flex items-center bg-surface-container px-3 py-1.5 rounded border border-cyber-border">
            <Search size={14} className="text-on-surface-variant mr-2" />
            <span className="text-on-surface-variant/50 font-mono text-[13px] w-48 text-left">Search system...</span>
            <div className="text-[10px] text-on-surface-variant border border-cyber-border px-1 rounded flex items-center gap-1 bg-surface-dim">
              <Command size={10} />K
            </div>
          </div>
        </ComingSoon>

        <ComingSoon label="Notifications coming soon">
          <span className="hidden md:flex text-on-surface-variant"><Bell size={18} /></span>
        </ComingSoon>
        <ComingSoon label="Settings coming soon">
          <span className="text-on-surface-variant"><Settings size={18} /></span>
        </ComingSoon>

        <div className="h-4 w-px bg-cyber-border mx-2"></div>

        <ComingSoon label="System HUD coming soon">
          <span className="hidden md:block text-on-surface font-mono text-[13px] border border-cyber-border px-3 py-1 rounded">
            System HUD
          </span>
        </ComingSoon>
        <Link
          href="/agents"
          className="inline-flex items-center gap-1.5 bg-primary text-on-primary-fixed px-4 py-1.5 rounded-md font-mono text-[13px] font-bold hover:brightness-110 transition-all shadow-[0_4px_16px_-4px_rgba(var(--primary-rgb),0.4)]"
        >
          Deploy Agent <ArrowRight size={13} />
        </Link>
      </div>
    </header>
  );
}
