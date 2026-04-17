'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { setTokens } from '@/lib/auth';
import type { AuthResponse } from '@kailani/types';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await apiFetch<AuthResponse>('/api/auth/login', {
        method: 'POST',
        body: { email, password },
      });
      setTokens(data.accessToken, data.refreshToken);
      if (data.user.role === 'MODEL') router.push('/model/dashboard');
      else if (data.user.role === 'BRAND') router.push('/brand/dashboard');
      else if (data.user.role === 'PHOTOGRAPHER') router.push('/photographer/dashboard');
      else if (data.user.role === 'ADMIN') router.push('/admin/dashboard');
    } catch (err: any) {
      setError(err?.error ?? 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-bg min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">

      {/* Decorative corner accents */}
      <CornerAccent position="top-left" />
      <CornerAccent position="top-right" />
      <CornerAccent position="bottom-left" />
      <CornerAccent position="bottom-right" />

      {/* Floating orbs */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(244,114,182,0.06) 0%, transparent 70%)' }} />
      <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(192,192,192,0.05) 0%, transparent 70%)' }} />

      <div className="w-full max-w-sm relative z-10">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="auth-divider w-12" />
            <span className="silver-dot" />
            <div className="auth-divider w-12" />
          </div>

          <h1
            className="kailani-logo-animated text-7xl font-light"
            style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}
          >
            Kailani
          </h1>

          <div className="flex items-center justify-center gap-3 mt-3">
            <div className="auth-divider w-12" />
            <span className="silver-dot" />
            <div className="auth-divider w-12" />
          </div>

          <p className="mt-4 text-xs tracking-[0.25em] uppercase"
            style={{ color: 'rgba(161,161,170,0.7)' }}>
            Where Fashion Meets Talent
          </p>
        </div>

        {/* Card */}
        <div className="auth-card rounded-2xl p-8">
          <div className="mb-6 text-center">
            <h2 className="text-xl font-light tracking-wide" style={{ color: '#f4f4f5' }}>
              Welcome Back
            </h2>
            <p className="text-xs mt-1 tracking-widest uppercase" style={{ color: 'rgba(161,161,170,0.6)' }}>
              Sign in to continue
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-lg px-4 py-2.5 text-sm text-center"
                style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)', color: '#fb7185' }}>
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="auth-label block" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@example.com"
                className="auth-input w-full h-11 rounded-lg px-4 text-sm outline-none border"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="auth-label block" htmlFor="password">Password</label>
                <Link href="/forgot-password"
                  className="text-xs transition-colors hover:opacity-80"
                  style={{ color: 'rgba(244,114,182,0.7)', textDecoration: 'none' }}>
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="auth-input w-full h-11 rounded-lg px-4 text-sm outline-none border"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="auth-btn w-full h-11 rounded-lg text-sm mt-2"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 pt-6" style={{ borderTop: '1px solid rgba(244,114,182,0.1)' }}>
            <p className="text-center text-xs tracking-wide" style={{ color: 'rgba(161,161,170,0.6)' }}>
              New to Kailani?{' '}
              <Link href="/signup"
                className="transition-colors hover:opacity-80"
                style={{ color: '#f472b6', textDecoration: 'none', letterSpacing: '0.05em' }}>
                Create an account
              </Link>
            </p>
          </div>
        </div>

        {/* Bottom mark */}
        <p className="text-center mt-6 text-xs tracking-widest uppercase"
          style={{ color: 'rgba(161,161,170,0.3)' }}>
          ◆ &nbsp; Kailani &nbsp; ◆
        </p>
      </div>
    </div>
  );
}

function CornerAccent({ position }: { position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' }) {
  const base = 'absolute w-16 h-16 pointer-events-none';
  const posClass = {
    'top-left': 'top-6 left-6',
    'top-right': 'top-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'bottom-right': 'bottom-6 right-6',
  }[position];

  const isRight = position.includes('right');
  const isBottom = position.includes('bottom');

  return (
    <div className={`${base} ${posClass}`}>
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
        <line
          x1={isRight ? 64 : 0} y1={isBottom ? 64 : 0}
          x2={isRight ? 64 : 0} y2={isBottom ? 20 : 44}
          stroke="rgba(244,114,182,0.25)" strokeWidth="1"
        />
        <line
          x1={isRight ? 20 : 0} y1={isBottom ? 64 : 0}
          x2={isRight ? 64 : 44} y2={isBottom ? 64 : 0}
          stroke="rgba(244,114,182,0.25)" strokeWidth="1"
        />
        <circle
          cx={isRight ? 64 : 0} cy={isBottom ? 64 : 0}
          r="2" fill="rgba(212,212,216,0.4)"
        />
      </svg>
    </div>
  );
}
