"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, TerminalSquare, LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { NAVIGATION } from '@/lib/nav';

export function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => setEmail(user?.email ?? null));
  }, []);

  // Close the drawer whenever the route changes.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <>
      {/* Mobile top bar */}
      <header className="md:hidden flex justify-between items-center px-4 h-16 w-full sticky top-0 z-50 glass-nav">
        <div className="flex items-center gap-2">
          <TerminalSquare size={18} className="text-primary" />
          <span className="font-bold text-on-surface">Imam Agent Studio</span>
        </div>
        <button
          onClick={() => setOpen(true)}
          aria-label="Open navigation"
          className="text-on-surface-variant hover:text-primary transition-colors"
        >
          <Menu size={24} />
        </button>
      </header>

      {/* Drawer */}
      {open && (
        <div className="md:hidden fixed inset-0 z-[70]">
          <div
            className="absolute inset-0 bg-obsidian-deep/70 backdrop-blur-sm animate-fade-in"
            onClick={() => setOpen(false)}
          />
          <nav className="absolute left-0 top-0 h-full w-72 max-w-[80vw] glass-elevated flex flex-col py-4 animate-fade-in">
            <div className="flex items-center justify-between px-5 mb-6">
              <div className="flex items-center gap-2">
                <TerminalSquare size={18} className="text-primary" />
                <span className="font-bold text-on-surface text-lg">Imam Agent Studio</span>
              </div>
              <button onClick={() => setOpen(false)} aria-label="Close navigation" className="text-on-surface-variant hover:text-on-surface">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 px-3 space-y-1 overflow-y-auto">
              {NAVIGATION.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={isActive ? 'page' : undefined}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-all ${
                      isActive ? 'text-primary bg-primary/10' : 'text-on-surface-variant hover:bg-surface-variant/40 hover:text-on-surface'
                    }`}
                  >
                    <Icon size={18} className={isActive ? 'text-primary' : 'opacity-70'} />
                    <span className="font-mono text-[13px] tracking-wide">{item.name}</span>
                  </Link>
                );
              })}
            </div>

            <div className="px-4 mt-auto pt-4 border-t border-cyber-border flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary-container/20 border border-cyber-border flex items-center justify-center text-primary font-mono text-sm font-bold uppercase">
                {email ? email[0] : '?'}
              </div>
              <span className="font-mono text-[12px] text-on-surface truncate flex-1">{email ?? '...'}</span>
              <button
                onClick={handleSignOut}
                aria-label="Sign out"
                className="p-1.5 text-on-surface-variant hover:text-error hover:bg-error/10 rounded transition-colors"
              >
                <LogOut size={16} />
              </button>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
