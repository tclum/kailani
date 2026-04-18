'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft, MapPin, DollarSign, Calendar, Star, CheckCircle2, XCircle,
  MessageSquare, Users, Tag, CheckCheck,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { apiFetch } from '@/lib/api';
import type { CampaignWithBrand, ApplicationWithModel, ApplicationStatus } from '@kailani/types';

const STATUS_CONFIG: Record<ApplicationStatus, { label: string; color: string }> = {
  PENDING:    { label: 'Pending',     color: 'bg-amber-100 text-amber-700' },
  SHORTLISTED:{ label: 'Shortlisted', color: 'bg-blue-100 text-blue-700' },
  ACCEPTED:   { label: 'Accepted',    color: 'bg-green-100 text-green-700' },
  REJECTED:   { label: 'Rejected',    color: 'bg-red-100 text-red-600' },
};

const APP_FILTERS: { value: ApplicationStatus | 'ALL'; label: string }[] = [
  { value: 'ALL',         label: 'All' },
  { value: 'PENDING',     label: 'Pending' },
  { value: 'SHORTLISTED', label: 'Shortlisted' },
  { value: 'ACCEPTED',    label: 'Accepted' },
  { value: 'REJECTED',    label: 'Rejected' },
];

function fmt(d?: string | null) {
  if (!d) return null;
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ─── Applicant card ───────────────────────────────────────────────────────────

function ApplicantCard({
  app,
  onStatus,
}: {
  app: ApplicationWithModel;
  onStatus: (id: string, status: ApplicationStatus) => void;
}) {
  const router = useRouter();
  const [messaging, setMessaging] = useState(false);
  const [updating, setUpdating] = useState(false);
  const m = app.model;
  const avatar = m.profileImage ?? m.coverImage ?? null;
  const initials = m.displayName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  const cfg = STATUS_CONFIG[app.status];

  async function handleStatus(status: ApplicationStatus) {
    if (updating) return;
    setUpdating(true);
    try {
      await apiFetch(`/api/campaigns/applications/${app.id}/status`, { method: 'PUT', body: { status } });
      onStatus(app.id, status);
    } finally {
      setUpdating(false);
    }
  }

  async function handleMessage() {
    const userId = m.user?.id ?? m.userId;
    if (!userId) return;
    setMessaging(true);
    try {
      const thread = await apiFetch<{ id: string }>('/api/threads', { method: 'POST', body: { recipientId: userId } });
      router.push(`/brand/inbox?thread=${thread.id}`);
    } catch { setMessaging(false); }
  }

  return (
    <div className="rounded-2xl border bg-card overflow-hidden">
      {/* Header row */}
      <div className="p-4 flex items-start gap-3">
        <Link href={`/model/${m.userId}`} className="flex-shrink-0">
          <div
            className="w-14 h-14 rounded-full overflow-hidden flex items-center justify-center text-xl font-bold text-white"
            style={{ background: avatar ? undefined : 'linear-gradient(135deg,#ec4899,#be185d)' }}
          >
            {avatar
              ? <Image src={avatar} alt={m.displayName} width={56} height={56} className="object-cover w-full h-full" />
              : initials}
          </div>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link href={`/model/${m.userId}`} className="font-bold text-base hover:text-pink-500 transition-colors">{m.displayName}</Link>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.color}`}>{cfg.label}</span>
          </div>
          {m.location && <p className="text-xs text-muted-foreground flex items-center gap-0.5 mt-0.5"><MapPin size={11} /> {m.location}</p>}
          {/* Measurements */}
          {(m.heightCm || m.bustCm || m.waistCm || m.hipsCm) && (
            <p className="text-xs text-muted-foreground mt-1 space-x-2">
              {m.heightCm && <span>H {m.heightCm}cm</span>}
              {m.bustCm && <span>B {m.bustCm}cm</span>}
              {m.waistCm && <span>W {m.waistCm}cm</span>}
              {m.hipsCm && <span>Hi {m.hipsCm}cm</span>}
            </p>
          )}
          {m.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {m.tags.slice(0, 5).map((t) => (
                <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">{t}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Cover note */}
      {app.coverNote && (
        <div className="px-4 pb-3">
          <p className="text-xs text-muted-foreground italic border-l-2 border-pink-200 pl-3 leading-relaxed">"{app.coverNote}"</p>
        </div>
      )}

      {/* Portfolio grid */}
      {m.portfolioImages.length > 0 && (
        <div className="px-4 pb-3 grid grid-cols-4 gap-1">
          {m.portfolioImages.slice(0, 4).map((url, i) => (
            <div key={i} className="aspect-square rounded-lg overflow-hidden bg-muted relative">
              <Image src={url} alt="" fill className="object-cover" />
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="px-4 pb-4 flex gap-2 flex-wrap">
        <button
          onClick={() => handleStatus('SHORTLISTED')}
          disabled={updating || app.status === 'SHORTLISTED'}
          className={`flex-1 h-9 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-all disabled:opacity-50 ${
            app.status === 'SHORTLISTED' ? 'bg-blue-500 text-white' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
          }`}
        >
          <Star size={12} /> Shortlist
        </button>
        <button
          onClick={() => handleStatus('ACCEPTED')}
          disabled={updating || app.status === 'ACCEPTED'}
          className={`flex-1 h-9 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-all disabled:opacity-50 ${
            app.status === 'ACCEPTED' ? 'bg-green-500 text-white' : 'bg-green-100 text-green-700 hover:bg-green-200'
          }`}
        >
          <CheckCircle2 size={12} /> Accept
        </button>
        <button
          onClick={() => handleStatus('REJECTED')}
          disabled={updating || app.status === 'REJECTED'}
          className={`flex-1 h-9 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-all disabled:opacity-50 ${
            app.status === 'REJECTED' ? 'bg-red-500 text-white' : 'bg-red-100 text-red-600 hover:bg-red-200'
          }`}
        >
          <XCircle size={12} /> Reject
        </button>
        {app.status === 'ACCEPTED' && (
          <button
            onClick={handleMessage}
            disabled={messaging}
            className="w-full h-9 rounded-xl text-xs font-semibold text-white flex items-center justify-center gap-1.5 mt-1 disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg,#ec4899,#be185d)' }}
          >
            <MessageSquare size={12} /> Message Model
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Mark Completed Modal ─────────────────────────────────────────────────────

function MarkCompletedModal({ onConfirm, onCancel, loading }: { onConfirm: () => void; onCancel: () => void; loading: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-card rounded-2xl w-full max-w-md p-6 space-y-4 shadow-xl">
        <h2 className="text-lg font-bold">Mark campaign as completed?</h2>
        <p className="text-sm text-muted-foreground">
          This will notify all accepted models and unlock structured reviews. This action cannot be undone.
        </p>
        <div className="flex gap-3 pt-2">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 h-10 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 h-10 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg,#ec4899,#be185d)' }}
          >
            {loading ? 'Completing…' : <><CheckCheck size={15} /> Mark Completed</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [campaign, setCampaign] = useState<CampaignWithBrand | null>(null);
  const [applications, setApplications] = useState<ApplicationWithModel[]>([]);
  const [filter, setFilter] = useState<ApplicationStatus | 'ALL'>('ALL');
  const [loading, setLoading] = useState(true);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    Promise.all([
      apiFetch<CampaignWithBrand>(`/api/campaigns/${id}`),
      apiFetch<ApplicationWithModel[]>(`/api/campaigns/${id}/applications`).catch(() => []),
    ]).then(([c, apps]) => {
      setCampaign(c);
      setApplications(Array.isArray(apps) ? apps : []);
    }).finally(() => setLoading(false));
  }, [id]);

  function handleStatus(appId: string, status: ApplicationStatus) {
    setApplications((prev) => prev.map((a) => a.id === appId ? { ...a, status } : a));
  }

  async function handleMarkCompleted() {
    setCompleting(true);
    try {
      const updated = await apiFetch<CampaignWithBrand>(`/api/campaigns/${id}`, {
        method: 'PUT',
        body: { status: 'COMPLETED' },
      });
      setCampaign(updated);
      setShowCompleteModal(false);
    } finally {
      setCompleting(false);
    }
  }

  const hasAccepted = applications.some((a) => a.status === 'ACCEPTED');
  const filtered = filter === 'ALL' ? applications : applications.filter((a) => a.status === filter);

  if (loading) return (
    <div className="flex justify-center py-16">
      <div className="w-8 h-8 rounded-full border-4 border-pink-300 border-t-pink-600 animate-spin" />
    </div>
  );
  if (!campaign) return <p className="text-muted-foreground">Campaign not found.</p>;

  return (
    <div className="space-y-6 max-w-5xl">
      {showCompleteModal && (
        <MarkCompletedModal
          onConfirm={handleMarkCompleted}
          onCancel={() => setShowCompleteModal(false)}
          loading={completing}
        />
      )}

      {/* Back */}
      <Link href="/brand/campaigns" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft size={15} /> All campaigns
      </Link>

      {/* Campaign header */}
      <div className="rounded-2xl border bg-card p-6 space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold">{campaign.title}</h1>
            <p className="text-muted-foreground mt-0.5">{campaign.brand?.brandName}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${
              campaign.status === 'OPEN' ? 'bg-green-100 text-green-700' :
              campaign.status === 'DRAFT' ? 'bg-amber-100 text-amber-700' :
              campaign.status === 'COMPLETED' ? 'bg-purple-100 text-purple-700' :
              'bg-muted text-muted-foreground'
            }`}>{campaign.status}</span>
            {campaign.status === 'OPEN' && hasAccepted && (
              <button
                onClick={() => setShowCompleteModal(true)}
                className="h-9 px-4 rounded-xl text-xs font-semibold text-white flex items-center gap-1.5"
                style={{ background: 'linear-gradient(135deg,#8b5cf6,#6d28d9)' }}
              >
                <CheckCheck size={13} /> Mark Completed
              </button>
            )}
            <Link
              href={`/brand/campaigns/${id}/edit`}
              className="h-9 px-4 rounded-xl text-xs font-semibold border border-border hover:bg-muted transition-colors flex items-center"
            >
              Edit
            </Link>
          </div>
        </div>

        <p className="text-sm leading-relaxed">{campaign.description}</p>

        <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
          {campaign.location && <span className="flex items-center gap-1.5"><MapPin size={14} /> {campaign.location}</span>}
          {campaign.budget && <span className="flex items-center gap-1.5"><DollarSign size={14} /> {campaign.budget}</span>}
          {campaign.startDate && (
            <span className="flex items-center gap-1.5">
              <Calendar size={14} /> {fmt(campaign.startDate)}{campaign.endDate ? ` – ${fmt(campaign.endDate)}` : ''}
            </span>
          )}
          {(campaign as any)._count?.applications != null && (
            <span className="flex items-center gap-1.5"><Users size={14} /> {(campaign as any)._count.applications} applicants</span>
          )}
        </div>

        {campaign.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {campaign.tags.map((t) => (
              <span key={t} className="text-xs px-2.5 py-1 rounded-full bg-pink-50 text-pink-700 border border-pink-200 font-medium">{t}</span>
            ))}
          </div>
        )}
      </div>

      {/* Applicants section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Users size={18} /> Applications
            <span className="text-sm font-normal text-muted-foreground">({applications.length})</span>
          </h2>
          {/* Filter tabs */}
          <div className="flex gap-1 p-1 rounded-xl bg-muted">
            {APP_FILTERS.map(({ value, label }) => {
              const count = value === 'ALL' ? applications.length : applications.filter((a) => a.status === value).length;
              return (
                <button
                  key={value}
                  onClick={() => setFilter(value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    filter === value ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {label} {count > 0 && <span className="ml-1 opacity-60">{count}</span>}
                </button>
              );
            })}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center py-12 gap-2 text-center rounded-2xl border bg-muted/30">
            <Users size={28} className="text-muted-foreground/40" />
            <p className="text-muted-foreground text-sm">{filter === 'ALL' ? 'No applications yet' : `No ${filter.toLowerCase()} applicants`}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((app) => (
              <ApplicantCard key={app.id} app={app} onStatus={handleStatus} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
