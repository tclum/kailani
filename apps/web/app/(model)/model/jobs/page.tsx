'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Clock, Star, CheckCircle2, XCircle, MessageSquare, Calendar, DollarSign, MapPin,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { getCurrentUser } from '@/lib/auth';
import { SkeletonCard } from '@/components/shared/Skeleton';
import type { ApplicationWithCampaign, ApplicationStatus } from '@kailani/types';

const STATUS_META: Record<ApplicationStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  PENDING:    { label: 'Pending',     color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200',  icon: <Clock size={12} /> },
  SHORTLISTED:{ label: 'Shortlisted', color: 'text-blue-700',  bg: 'bg-blue-50 border-blue-200',    icon: <Star size={12} /> },
  ACCEPTED:   { label: 'Accepted',    color: 'text-green-700', bg: 'bg-green-50 border-green-200',  icon: <CheckCircle2 size={12} /> },
  REJECTED:   { label: 'Rejected',    color: 'text-red-600',   bg: 'bg-red-50 border-red-200',      icon: <XCircle size={12} /> },
};

function StatusBadge({ status }: { status: ApplicationStatus }) {
  const m = STATUS_META[status];
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${m.color} ${m.bg}`}>
      {m.icon} {m.label}
    </span>
  );
}

function fmt(d?: string | null) {
  if (!d) return null;
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function ApplicationRow({ app }: { app: ApplicationWithCampaign }) {
  const router = useRouter();
  const me = getCurrentUser();
  const [messaging, setMessaging] = useState(false);

  async function handleMessage() {
    if (!app.campaign.brand.userId || !me) return;
    setMessaging(true);
    try {
      const thread = await apiFetch<{ id: string }>('/api/threads', {
        method: 'POST',
        body: { recipientId: app.campaign.brand.userId },
      });
      router.push(`/model/inbox?thread=${thread.id}`);
    } catch { setMessaging(false); }
  }

  const c = app.campaign;
  return (
    <div className="flex items-center gap-4 p-4 rounded-2xl border bg-card hover:shadow-sm transition-shadow">
      <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 flex-shrink-0">
        {(c.brand.profileImage ?? c.brand.logoUrl) ? (
          <Image src={(c.brand.profileImage ?? c.brand.logoUrl)!} alt={c.brand.brandName} width={40} height={40} className="object-cover w-full h-full rounded-full" />
        ) : (
          <div className="w-full h-full rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg,#ec4899,#be185d)' }}>
            {c.brand.brandName[0]}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <Link href={`/campaigns/${c.id}`} className="font-semibold text-sm hover:text-pink-500 transition-colors line-clamp-1">
          {c.title}
        </Link>
        <p className="text-xs text-muted-foreground mt-0.5">{c.brand.brandName}</p>
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground mt-1">
          {c.location && <span className="flex items-center gap-0.5"><MapPin size={10} /> {c.location}</span>}
          {c.startDate && <span className="flex items-center gap-0.5"><Calendar size={10} /> {fmt(c.startDate)}</span>}
          {c.budget && <span className="flex items-center gap-0.5"><DollarSign size={10} /> {c.budget}</span>}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <StatusBadge status={app.status} />
        {app.status === 'ACCEPTED' && (
          <button
            onClick={handleMessage}
            disabled={messaging}
            className="h-8 px-3 rounded-xl text-xs font-semibold text-white flex items-center gap-1.5 disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg,#ec4899,#be185d)' }}
          >
            <MessageSquare size={12} /> Message
          </button>
        )}
      </div>
    </div>
  );
}

const GROUPS: { status: ApplicationStatus; label: string }[] = [
  { status: 'SHORTLISTED', label: 'Shortlisted' },
  { status: 'ACCEPTED',    label: 'Accepted' },
  { status: 'PENDING',     label: 'Pending Review' },
  { status: 'REJECTED',    label: 'Not Selected' },
];

export default function ModelJobsPage() {
  const [apps, setApps] = useState<ApplicationWithCampaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<ApplicationWithCampaign[]>('/api/campaigns/my-applications')
      .then(setApps)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Applications</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Loading your applications…</p>
      </div>
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Applications</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{apps.length} application{apps.length !== 1 ? 's' : ''} across all campaigns</p>
      </div>

      {apps.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground">
            <Clock size={24} />
          </div>
          <div>
            <h3 className="text-base font-semibold">No jobs yet</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">Apply to campaigns and track them here.</p>
          </div>
          <Link
            href="/model/discover"
            className="h-9 px-5 rounded-xl text-sm font-medium text-white inline-flex items-center"
            style={{ background: 'linear-gradient(135deg,#ec4899,#be185d)' }}
          >
            Browse Campaigns
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {GROUPS.map(({ status, label }) => {
            const group = apps.filter((a) => a.status === status);
            if (group.length === 0) return null;
            const meta = STATUS_META[status];
            return (
              <div key={status} className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-semibold ${meta.color}`}>{label}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full border font-bold ${meta.color} ${meta.bg}`}>{group.length}</span>
                </div>
                <div className="space-y-2">
                  {group.map((app) => <ApplicationRow key={app.id} app={app} />)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
