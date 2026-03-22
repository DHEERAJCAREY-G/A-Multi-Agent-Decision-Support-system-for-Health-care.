'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login, register } from '@/lib/api';

type Tab = 'login' | 'register';

export default function AuthPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!username || !password) { setError('Please fill in all fields.'); return; }

    setLoading(true);
    try {
      if (tab === 'login') {
        await login(username, password);
        router.push('/dashboard');
      } else {
        await register(username, password);
        setSuccess('Account created! Please log in.');
        setTab('login');
      }
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg">
      {/* Background subtle grid */}
      <div
        className="fixed inset-0 opacity-[0.03]"
        style={{ backgroundImage: 'linear-gradient(#E6EDF3 1px, transparent 1px), linear-gradient(90deg, #E6EDF3 1px, transparent 1px)', backgroundSize: '40px 40px' }}
      />

      <div className="relative w-full max-w-md mx-4 animate-fade-in mt-12 mb-12">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-brand to-emerald-400 mb-6 shadow-xl shadow-brand/30 ring-4 ring-bg-surface">
            <span className="text-3xl">🏥</span>
          </div>
          <h1 className="font-serif text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand to-emerald-500 tracking-tight">MediDecide</h1>
          <p className="text-ink-muted text-base mt-2 font-medium">AI Healthcare Decision Support</p>
        </div>

        {/* Card */}
        <div className="bg-bg-surface border border-border/60 rounded-card p-8 shadow-2xl shadow-brand/10 backdrop-blur-sm">
          {/* Tabs */}
          <div className="flex bg-bg-raised rounded-lg p-1 mb-6">
            {(['login', 'register'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(''); setSuccess(''); }}
                className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
                  tab === t
                    ? 'bg-brand text-white'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                {t === 'login' ? 'Sign In' : 'Register'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-ink-muted mb-2 font-semibold uppercase tracking-wider">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="w-full bg-bg-raised border border-border/80 rounded-lg px-4 py-3 text-base text-ink placeholder-ink-subtle focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm text-ink-muted mb-2 font-semibold uppercase tracking-wider">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-bg-raised border border-border/80 rounded-lg px-4 py-3 text-base text-ink placeholder-ink-subtle focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all"
              />
            </div>

            {error && (
              <div className="bg-risk-high-bg border border-risk-high text-risk-high-text text-sm px-3 py-2 rounded-lg">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-risk-low-bg border border-brand text-risk-low-text text-sm px-3 py-2 rounded-lg">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-brand to-emerald-500 hover:from-brand-hover hover:to-emerald-400 disabled:opacity-50 text-white font-semibold py-3.5 rounded-lg text-base shadow-lg shadow-brand/25 transition-all transform hover:-translate-y-0.5"
            >
              {loading ? 'Please wait…' : tab === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-ink-subtle mt-4">
          For medical guidance only — not a substitute for professional care.
        </p>
      </div>
    </div>
  );
}
