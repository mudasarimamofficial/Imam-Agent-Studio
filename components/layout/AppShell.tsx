"use client";

import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';

const BARE_ROUTES = ['/login'];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (BARE_ROUTES.some((r) => pathname.startsWith(r)) || pathname === '/') {
    return <>{children}</>;
  }

  return (
    <>
      <Sidebar />
      <div className="flex-1 flex flex-col h-full relative overflow-hidden md:ml-60">
        {children}
      </div>
    </>
  );
}
