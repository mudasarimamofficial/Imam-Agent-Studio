"use client";

import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileNav } from '@/components/layout/MobileNav';

// Routes that render without the app shell (sidebar). The landing page "/"
// is matched exactly; others by prefix.
const BARE_PREFIXES = ['/login'];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname === '/' || BARE_PREFIXES.some((r) => pathname.startsWith(r))) {
    return <>{children}</>;
  }

  return (
    <>
      <Sidebar />
      <div className="flex-1 flex flex-col h-full relative overflow-hidden md:ml-60">
        <MobileNav />
        <div className="flex-1 flex flex-col h-full relative overflow-hidden">
          {children}
        </div>
      </div>
    </>
  );
}
