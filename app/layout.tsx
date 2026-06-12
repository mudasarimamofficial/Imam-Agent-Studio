import type {Metadata} from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { AppShell } from '@/components/layout/AppShell';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

export const metadata: Metadata = {
  title: 'IAS OS - Visual AI Operating System',
  description: 'The definitive visual AI operating system managing cross-functional autonomous agents.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} dark`}>
      <body suppressHydrationWarning className="flex h-screen overflow-hidden antialiased bg-obsidian-deep text-on-surface font-sans">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
