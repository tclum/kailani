'use client';
import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await apiFetch('/api/auth/forgot-password', {
        method: 'POST',
        body: { email },
      });
      setSubmitted(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-bg min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <CornerAccent position="top-left" />
      <CornerAccent position="top-right" />
      <CornerAccent position="bottom-left" />
      <CornerAccent position="bottom-right" />

      <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(244,114,182,0.06) 0%, transparent 70%)' }} />
      <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(192,192,192,0.05) 0%, transparent 70%)' }} />

      <div className="w-full max-w-sm relative z-10">
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

        <div className="auth-card rounded-2xl p-8">
          <AnimatePresence mode="wait">
            {submitted ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className="text-center space-y-4"
              >
                <div className="flex items-center justify-center mb-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(244,114,182,0.1)', border: '1px solid rgba(244,114,182,0.3)' }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f472b6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                  </div>
                </div>
                <h2 className="text-lg font-light tracking-wide" style={{ color: '#f4f4f5' }}>
                  Check your inbox
                </h2>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(161,161,170,0.7)' }}>
                  If that email exists in our system, you&apos;ll receive a reset link shortly.
                </p>
                <p className="text-xs" style={{ color: 'rgba(161,161,170,0.4)' }}>
                  Didn&apos;t receive it? Check your spam folder.
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
              >
                <div className="mb-6 text-center">
                  <h2 className="text-xl font-light tracking-wide" style={{ color: '#f4f4f5' }}>
                    Forgot Password
                  </h2>
                  <p className="text-xs mt-1 tracking-widest uppercase" style={{ color: 'rgba(161,161,170,0.6)' }}>
                    We&apos;ll send you a reset link
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

                  <button
                    type="submit"
                    disabled={loading}
                    className="auth-btn w-full h-11 rounded-lg text-sm mt-2"
                  >
                    {loading ? 'Sending…' : 'Send Reset Link'}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-6 pt-6" style={{ borderTop: '1px solid rgba(244,114,182,0.1)' }}>
            <p className="text-center text-xs tracking-wide" style={{ color: 'rgba(161,161,170,0.6)' }}>
              Remember your password?{' '}
              <Link href="/login"
                className="transition-colors hover:opacity-80"
                style={{ color: '#f472b6', textDecoration: 'none', letterSpacing: '0.05em' }}>
                Sign in
              </Link>
            </p>
          </div>
        </div>

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
