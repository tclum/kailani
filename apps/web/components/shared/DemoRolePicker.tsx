'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Briefcase, Camera, ShieldCheck, ChevronRight } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { setTokens } from '@/lib/auth';
import { DEMO_PERSONAS } from '@/lib/demo/personas';
import type { AuthResponse, Role } from '@kailani/types';

const ICONS: Record<Role, React.ReactNode> = {
  MODEL: <User size={22} />,
  BRAND: <Briefcase size={22} />,
  PHOTOGRAPHER: <Camera size={22} />,
  ADMIN: <ShieldCheck size={22} />,
};

/** Demo-mode replacement for the credential form: one card per enabled role. */
export function DemoRolePicker() {
  const router = useRouter();
  const [pending, setPending] = useState<Role | null>(null);
  const [error, setError] = useState('');

  async function enter(role: Role, dashboard: string) {
    setError('');
    setPending(role);
    try {
      const data = await apiFetch<AuthResponse>('/api/auth/login', { method: 'POST', body: { role } });
      setTokens(data.accessToken, data.refreshToken);
      router.push(dashboard);
    } catch (err: any) {
      setError(err?.error ?? 'Could not start the demo');
      setPending(null);
    }
  }

  return (
    <>
      <div className="mb-6 text-center">
        <h2 className="text-xl font-light tracking-wide" style={{ color: '#f4f4f5' }}>
          Enter the demo
        </h2>
        <p className="text-xs mt-1 tracking-widest uppercase" style={{ color: 'rgba(161,161,170,0.6)' }}>
          Pick a role. No account needed.
        </p>
      </div>

      {error && (
        <div className="rounded-lg px-4 py-2.5 mb-4 text-sm text-center"
          style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)', color: '#fb7185' }}>
          {error}
        </div>
      )}

      <div className="space-y-3">
        {DEMO_PERSONAS.map((p) => (
          <button
            key={p.role}
            type="button"
            onClick={() => enter(p.role, p.dashboard)}
            disabled={pending !== null}
            className="w-full text-left rounded-xl p-4 flex items-center gap-4 border transition-colors disabled:opacity-60 hover:border-pink-400/60"
            style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(244,114,182,0.2)' }}
          >
            <span className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-white"
              style={{ background: 'linear-gradient(135deg,#ec4899,#be185d)' }}>
              {ICONS[p.role]}
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-sm font-medium tracking-wide" style={{ color: '#f4f4f5' }}>{p.title}</span>
              <span className="block text-xs mt-0.5 leading-relaxed" style={{ color: 'rgba(161,161,170,0.8)' }}>{p.description}</span>
            </span>
            {pending === p.role ? (
              <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin flex-shrink-0" />
            ) : (
              <ChevronRight size={16} className="flex-shrink-0" style={{ color: 'rgba(244,114,182,0.7)' }} />
            )}
          </button>
        ))}
      </div>

      <p className="mt-6 pt-6 text-center text-xs tracking-wide"
        style={{ borderTop: '1px solid rgba(244,114,182,0.1)', color: 'rgba(161,161,170,0.6)' }}>
        More roles are on the way.
      </p>
    </>
  );
}
