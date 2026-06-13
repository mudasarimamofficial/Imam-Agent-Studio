import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface TopNavProps {
  title: string;
  tabs?: string[];
  activeTab?: string;
}

export function TopNav({ title, tabs, activeTab }: TopNavProps) {
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
                    : 'text-on-surface-variant/60 border-transparent'
                }`}
              >
                {tab}
              </span>
            ))}
          </nav>
        )}
      </div>

      <Link
        href="/agents"
        className="inline-flex items-center gap-1.5 bg-primary text-on-primary-fixed px-4 py-1.5 rounded-md font-mono text-[13px] font-bold hover:brightness-110 transition-all shadow-[0_4px_16px_-4px_rgba(var(--primary-rgb),0.4)]"
      >
        Deploy Agent <ArrowRight size={13} />
      </Link>
    </header>
  );
}
