"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TerminalSquare, Mail, KeyRound, LogIn, UserPlus, Activity } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{ kind: 'error' | 'info'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pending) return;
    setPending(true);
    setMessage(null);
    const supabase = createClient();

    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          setMessage({ kind: 'error', text: error.message });
        } else {
          router.push('/dashboard');
          router.refresh();
        }
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) {
          setMessage({ kind: 'error', text: error.message });
        } else if (data.session) {
          router.push('/dashboard');
          router.refresh();
        } else {
          setMessage({ kind: 'info', text: 'Account created. Check your email to confirm, then sign in.' });
          setMode('signin');
        }
      }
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-obsidian-deep relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[15%] left-[25%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[140px]"></div>
        <div className="absolute bottom-[15%] right-[25%] w-[400px] h-[400px] bg-telemetry-blue/5 rounded-full blur-[120px]"></div>
      </div>

      <div className="glass-panel rounded-2xl w-full max-w-md p-8 relative z-10 mx-4">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-lg bg-primary-container/20 flex items-center justify-center">
            <TerminalSquare size={22} className="text-primary" />
          </div>
          <div>
            <h1 className="font-bold text-on-surface text-xl tracking-tight leading-none">IAS OS</h1>
            <p className="font-mono text-on-surface-variant text-[10px] uppercase tracking-wider opacity-70 mt-1">
              Operator Authentication
            </p>
          </div>
        </div>

        <div className="flex gap-1 mb-6 bg-surface-container-low rounded-lg p-1 border border-cyber-border">
          <button
            onClick={() => { setMode('signin'); setMessage(null); }}
            className={`flex-1 py-2 rounded-md font-mono text-[12px] uppercase tracking-wider transition-colors ${
              mode === 'signin' ? 'bg-primary text-on-primary-fixed font-bold' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setMode('signup'); setMessage(null); }}
            className={`flex-1 py-2 rounded-md font-mono text-[12px] uppercase tracking-wider transition-colors ${
              mode === 'signup' ? 'bg-primary text-on-primary-fixed font-bold' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="font-mono text-[11px] text-on-surface-variant uppercase tracking-wider block mb-2">
              Email
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operator@domain.com"
                className="w-full bg-surface-container-low border border-cyber-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-on-surface placeholder-on-surface-variant/40 outline-none focus:border-primary/60 transition-colors"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="font-mono text-[11px] text-on-surface-variant uppercase tracking-wider block mb-2">
              Password
            </label>
            <div className="relative">
              <KeyRound size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
              <input
                id="password"
                type="password"
                required
                minLength={8}
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-surface-container-low border border-cyber-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-on-surface placeholder-on-surface-variant/40 outline-none focus:border-primary/60 transition-colors"
              />
            </div>
          </div>

          {message && (
            <div
              role="alert"
              className={`text-[13px] rounded-lg px-3 py-2 border font-mono ${
                message.kind === 'error'
                  ? 'text-error border-error/30 bg-error/10'
                  : 'text-telemetry-blue border-telemetry-blue/30 bg-telemetry-blue/10'
              }`}
            >
              {message.text}
            </div>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary text-on-primary-fixed font-mono text-[13px] font-bold uppercase tracking-wider hover:brightness-110 transition-all disabled:opacity-50 mt-2"
          >
            {pending ? (
              <Activity size={16} className="animate-spin" />
            ) : mode === 'signin' ? (
              <LogIn size={16} />
            ) : (
              <UserPlus size={16} />
            )}
            {pending ? 'Authenticating...' : mode === 'signin' ? 'Access Console' : 'Create Operator'}
          </button>
        </form>

        <p className="font-mono text-[10px] text-on-surface-variant/60 text-center mt-6 uppercase tracking-wider">
          Isolated tenancy · Row-level security enforced
        </p>
      </div>
    </div>
  );
}
