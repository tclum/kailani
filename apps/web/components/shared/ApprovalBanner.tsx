'use client';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { getCurrentUser } from '@/lib/auth';

export function ApprovalBanner() {
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user || user.role === 'ADMIN') return;

    apiFetch<{ approved: boolean }>('/api/auth/me')
      .then((me) => { if (!me.approved) setPending(true); })
      .catch(() => {});
  }, []);

  if (!pending) return null;

  return (
    <div
      className="w-full text-center text-sm py-2.5 px-4 font-medium"
      style={{
        background: 'linear-gradient(90deg, rgba(251,191,36,0.15), rgba(245,158,11,0.12))',
        borderBottom: '1px solid rgba(245,158,11,0.3)',
        color: '#fbbf24',
      }}
    >
      Your account is pending admin approval. Some features are limited until verified.
    </div>
  );
}
