'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Briefcase, ArrowLeft, CheckCircle2, User } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { setTokens } from '@/lib/auth';
import type { AuthResponse } from '@kailani/types';

type Role = 'MODEL' | 'BRAND' | 'PHOTOGRAPHER';
type Step = 1 | 2 | 3;

const ROLES: { value: Role; icon: React.ReactNode; title: string; desc: string }[] = [
  {
    value: 'MODEL',
    icon: <User size={28} />,
    title: 'Model',
    desc: 'Build your portfolio and get discovered by top brands',
  },
  {
    value: 'BRAND',
    icon: <Briefcase size={28} />,
    title: 'Brand',
    desc: 'Find and hire the perfect talent for your campaigns',
  },
  {
    value: 'PHOTOGRAPHER',
    icon: <Camera size={28} />,
    title: 'Photographer',
    desc: 'Connect with models and brands for creative work',
  },
];

const variants = {
  enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
};

function getDashboardHref(role: Role) {
  if (role === 'MODEL') return '/model/profile';
  if (role === 'BRAND') return '/brand/dashboard';
  return '/model/dashboard';
}

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [dir, setDir] = useState(1);
  const [role, setRole] = useState<Role | null>(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [createdRole, setCreatedRole] = useState<Role>('MODEL');

  function advance(nextStep: Step) {
    setDir(1);
    setStep(nextStep);
  }

  function back() {
    setDir(-1);
    setStep((s) => (s - 1) as Step);
  }

  function selectRole(r: Role) {
    setRole(r);
    advance(2);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!role) return;
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const data = await apiFetch<AuthResponse>('/api/auth/register', {
        method: 'POST',
        body: { email, password, role },
      });
      setTokens(data.accessToken, data.refreshToken);

      // Pre-populate profile with the entered name
      try {
        if (role === 'MODEL') {
          await apiFetch('/api/models/me', { method: 'PUT', body: { displayName: fullName } });
        } else if (role === 'BRAND') {
          await apiFetch('/api/brands/me', { method: 'PUT', body: { brandName: fullName } });
        } else if (role === 'PHOTOGRAPHER') {
          await apiFetch('/api/photographers/me', { method: 'PUT', body: { displayName: fullName } });
        }
      } catch {
        // Profile creation is best-effort; don't block the flow
      }

      setCreatedRole(role);
      advance(3);
    } catch (err: any) {
      setError(err?.error ?? 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  const selectedRoleInfo = ROLES.find((r) => r.value === role);

  return (
    <div className="auth-bg min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <CornerAccent position="top-left" />
      <CornerAccent position="top-right" />
      <CornerAccent position="bottom-left" />
      <CornerAccent position="bottom-right" />

      <div className="absolute top-1/3 right-1/3 w-56 h-56 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(244,114,182,0.07) 0%, transparent 70%)' }} />

      <div className="w-full relative z-10" style={{ maxWidth: step === 1 ? '680px' : '400px', transition: 'max-width 0.4s ease' }}>

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="auth-divider w-12" />
            <span className="silver-dot" />
            <div className="auth-divider w-12" />
          </div>
          <h1 className="kailani-logo-animated text-7xl font-light"
            style={{ fontFamily: 'var(--font-cormorant), Georgia, serif' }}>
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

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {([1, 2, 3] as Step[]).map((s) => (
            <div
              key={s}
              className="rounded-full transition-all duration-300"
              style={{
                width: step === s ? '24px' : '8px',
                height: '8px',
                background: step >= s
                  ? 'linear-gradient(90deg,#ec4899,#be185d)'
                  : 'rgba(212,212,216,0.2)',
              }}
            />
          ))}
        </div>

        <AnimatePresence mode="wait" custom={dir}>
          {step === 1 && (
            <motion.div
              key="step1"
              custom={dir}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: 'easeInOut' }}
            >
              <div className="auth-card rounded-2xl p-8">
                <div className="text-center mb-8">
                  <h2 className="text-xl font-light tracking-wide" style={{ color: '#f4f4f5' }}>
                    Choose your role
                  </h2>
                  <p className="text-xs mt-1 tracking-widest uppercase" style={{ color: 'rgba(161,161,170,0.6)' }}>
                    How will you use Kailani?
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {ROLES.map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => selectRole(r.value)}
                      className="group flex flex-col items-center gap-4 p-6 rounded-xl border text-center transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                      style={{
                        background: 'rgba(255,255,255,0.03)',
                        borderColor: 'rgba(244,114,182,0.2)',
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.background = 'rgba(244,114,182,0.08)';
                        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(244,114,182,0.5)';
                        (e.currentTarget as HTMLElement).style.boxShadow = '0 0 24px rgba(244,114,182,0.15)';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)';
                        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(244,114,182,0.2)';
                        (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                      }}
                    >
                      <div
                        className="w-14 h-14 rounded-full flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg, rgba(236,72,153,0.2), rgba(190,24,93,0.15))', color: '#f472b6' }}
                      >
                        {r.icon}
                      </div>
                      <div>
                        <p className="font-semibold tracking-wide mb-1" style={{ color: '#f4f4f5' }}>{r.title}</p>
                        <p className="text-xs leading-relaxed" style={{ color: 'rgba(161,161,170,0.7)' }}>{r.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="mt-8 pt-6" style={{ borderTop: '1px solid rgba(244,114,182,0.1)' }}>
                  <p className="text-center text-xs tracking-wide" style={{ color: 'rgba(161,161,170,0.6)' }}>
                    Already a member?{' '}
                    <Link href="/login" className="transition-colors hover:opacity-80"
                      style={{ color: '#f472b6', textDecoration: 'none', letterSpacing: '0.05em' }}>
                      Sign in
                    </Link>
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              custom={dir}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: 'easeInOut' }}
            >
              <div className="auth-card rounded-2xl p-8">
                {/* Selected role badge + back button */}
                <div className="flex items-center justify-between mb-6">
                  <button
                    type="button"
                    onClick={back}
                    className="flex items-center gap-1.5 text-xs transition-opacity hover:opacity-70"
                    style={{ color: 'rgba(161,161,170,0.7)' }}
                  >
                    <ArrowLeft size={13} /> Change role
                  </button>
                  {selectedRoleInfo && (
                    <div
                      className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
                      style={{
                        background: 'linear-gradient(135deg, rgba(236,72,153,0.15), rgba(190,24,93,0.1))',
                        border: '1px solid rgba(244,114,182,0.3)',
                        color: '#f472b6',
                      }}
                    >
                      <span>{selectedRoleInfo.icon && <span className="[&>svg]:w-3 [&>svg]:h-3">{selectedRoleInfo.icon}</span>}</span>
                      {selectedRoleInfo.title}
                    </div>
                  )}
                </div>

                <div className="mb-6 text-center">
                  <h2 className="text-xl font-light tracking-wide" style={{ color: '#f4f4f5' }}>
                    Create your account
                  </h2>
                  <p className="text-xs mt-1 tracking-widest uppercase" style={{ color: 'rgba(161,161,170,0.6)' }}>
                    Join the community
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="rounded-lg px-4 py-2.5 text-sm text-center"
                      style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)', color: '#fb7185' }}>
                      {error}
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="auth-label block" htmlFor="fullName">
                      {role === 'BRAND' ? 'Brand Name' : 'Full Name'}
                    </label>
                    <input
                      id="fullName"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      placeholder={role === 'BRAND' ? 'Your brand name' : 'Your name'}
                      className="auth-input w-full h-11 rounded-lg px-4 text-sm outline-none border"
                    />
                  </div>

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
                    <label className="auth-label block" htmlFor="password">Password</label>
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
                      autoComplete="new-password"
                      placeholder="••••••••"
                      className="auth-input w-full h-11 rounded-lg px-4 text-sm outline-none border"
                    />
                    <p className="text-xs" style={{ color: 'rgba(161,161,170,0.45)', letterSpacing: '0.04em' }}>
                      Minimum 8 characters
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="auth-label block" htmlFor="confirm">Confirm Password</label>
                    <input
                      id="confirm"
                      type="password"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      required
                      autoComplete="new-password"
                      placeholder="••••••••"
                      className="auth-input w-full h-11 rounded-lg px-4 text-sm outline-none border"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="auth-btn w-full h-11 rounded-lg text-sm mt-1 inline-flex items-center justify-center gap-2"
                  >
                    {loading && <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />}
                    {loading ? 'Creating account…' : 'Create Account'}
                  </button>
                </form>

                <div className="mt-6 pt-6" style={{ borderTop: '1px solid rgba(244,114,182,0.1)' }}>
                  <p className="text-center text-xs tracking-wide" style={{ color: 'rgba(161,161,170,0.6)' }}>
                    Already a member?{' '}
                    <Link href="/login" className="transition-colors hover:opacity-80"
                      style={{ color: '#f472b6', textDecoration: 'none', letterSpacing: '0.05em' }}>
                      Sign in
                    </Link>
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              custom={dir}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: 'easeInOut' }}
            >
              <div className="auth-card rounded-2xl p-8 text-center">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
                  style={{ background: 'linear-gradient(135deg, rgba(236,72,153,0.2), rgba(190,24,93,0.15))' }}
                >
                  <CheckCircle2 size={32} style={{ color: '#f472b6' }} />
                </div>

                <h2 className="text-2xl font-light tracking-wide mb-3" style={{ color: '#f4f4f5' }}>
                  Welcome to Kailani
                </h2>

                <p className="text-sm leading-relaxed mb-2" style={{ color: 'rgba(212,212,216,0.8)' }}>
                  Your account has been created successfully.
                </p>
                <p className="text-sm leading-relaxed mb-8" style={{ color: 'rgba(161,161,170,0.7)' }}>
                  Your account is pending admin verification. We&apos;ll notify you by email once approved. In the meantime, you can fill out your profile.
                </p>

                <button
                  type="button"
                  onClick={() => router.push(getDashboardHref(createdRole))}
                  className="auth-btn w-full h-11 rounded-lg text-sm"
                >
                  Complete Your Profile
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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
        <line x1={isRight ? 64 : 0} y1={isBottom ? 64 : 0} x2={isRight ? 64 : 0} y2={isBottom ? 20 : 44}
          stroke="rgba(244,114,182,0.25)" strokeWidth="1" />
        <line x1={isRight ? 20 : 0} y1={isBottom ? 64 : 0} x2={isRight ? 64 : 44} y2={isBottom ? 64 : 0}
          stroke="rgba(244,114,182,0.25)" strokeWidth="1" />
        <circle cx={isRight ? 64 : 0} cy={isBottom ? 64 : 0} r="2" fill="rgba(212,212,216,0.4)" />
      </svg>
    </div>
  );
}
