"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Plus, TerminalSquare, LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { NAVIGATION } from '@/lib/nav';

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [reviewCount, setReviewCount] = useState<number>(0);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setEmail(user?.email ?? null);
    });

    const fetchReviewCount = async () => {
      try {
        const res = await fetch('/api/stats');
        const json = await res.json();
        if (json.success && json.data) {
          // stats has agents, workflows, leads, let's read ready_to_review from status count or stats.leads.ready_to_review
          // We will modify /api/stats to include a ready_to_review count
          setReviewCount(json.data.workflows?.ready_to_review || json.data.ready_to_review || 0);
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchReviewCount();
    const timer = setInterval(fetchReviewCount, 8000);
    return () => clearInterval(timer);
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <nav className="hidden md:flex flex-col h-full py-3 w-60 fixed left-0 top-0 border-r border-cyber-border glass-nav z-50">
      <div className="px-5 mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded bg-primary-container/20 flex items-center justify-center">
            <TerminalSquare size={18} className="text-primary" />
          </div>
          <div>
            <h1 className="font-bold text-on-surface text-[15px] tracking-tight leading-none">Imam Agent</h1>
            <p className="font-mono text-primary text-[9px] uppercase tracking-wider mt-1 font-bold">Studio V2</p>
          </div>
        </div>
      </div>
      
      <div className="flex-1 px-3 space-y-1 overflow-y-auto">
        {NAVIGATION.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          const isReview = item.name === 'Review Queue';
          
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className={`relative flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-all duration-150 group ${
                isActive
                  ? 'text-primary bg-primary/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]'
                  : 'text-on-surface-variant hover:bg-surface-variant/40 hover:text-on-surface'
              }`}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-primary" aria-hidden="true"></span>
              )}
              <Icon
                size={18}
                className={isActive ? 'text-primary' : 'opacity-70 group-hover:opacity-100 transition-opacity'}
              />
              <span className="font-mono text-[13px] tracking-wide flex-1">{item.name}</span>
              {isReview && reviewCount > 0 && (
                <span className="font-mono text-[10px] bg-primary text-on-primary-fixed px-1.5 py-0.5 rounded-full font-bold ml-auto animate-pulse">
                  {reviewCount}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      <div className="px-5 mt-auto pt-4">
        <Link
          href="/agents"
          className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded bg-primary text-on-primary-fixed font-mono text-[13px] font-bold hover:brightness-110 transition-all"
        >
          <Plus size={16} />
          Create Assistant
        </Link>
        
        <div className="mt-4 flex items-center gap-3 border-t border-cyber-border pt-4">
          <div className="w-8 h-8 rounded-full bg-primary-container/20 border border-cyber-border flex items-center justify-center text-primary font-mono text-sm font-bold uppercase">
            {email ? email[0] : '?'}
          </div>
          <div className="flex flex-col flex-1 min-w-0">
            <span className="font-mono text-[12px] text-on-surface truncate" title={email ?? undefined}>
              {email ?? 'Loading...'}
            </span>
            <span className="font-mono text-[10px] text-primary">Online</span>
          </div>
          <button
            onClick={handleSignOut}
            title="Sign out"
            aria-label="Sign out"
            className="p-1.5 text-on-surface-variant hover:text-error hover:bg-error/10 rounded transition-colors"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </nav>
  );
}

