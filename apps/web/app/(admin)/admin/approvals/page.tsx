'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { CheckCircle2, XCircle, Clock, ShieldCheck, User, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { apiFetch } from '@/lib/api';

type VerifStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

interface VerifUser {
  email: string;
  role: string;
  verified: boolean;
  modelProfile: { displayName: string; profileImage?: string | null; coverImage?: string | null } | null;
  brandProfile: { brandName: string; logoUrl?: string | null; profileImage?: string | null } | null;
  photographerProfile: { displayName: string; profileImage?: string | null } | null;
}

interface VerifRequest {
  id: string;
  userId: string;
  idImageUrl: string;
  selfieUrl?: string | null;
  status: VerifStatus;
  adminNote?: string | null;
  submittedAt: string;
  reviewedAt?: string | null;
  user: VerifUser;
}

type Tab = 'PENDING' | 'APPROVED' | 'REJECTED';

function getName(user: VerifUser) {
  return user.modelProfile?.displayName ?? user.brandProfile?.brandName ?? user.photographerProfile?.displayName ?? user.email;
}

function getImage(user: VerifUser) {
  return (
    user.modelProfile?.profileImage ?? user.modelProfile?.coverImage ??
    user.brandProfile?.profileImage ?? user.brandProfile?.logoUrl ??
    user.photographerProfile?.profileImage ?? null
  );
}

// ─── Reject modal ──────────────────────────────────────────────────────────────
function RejectModal({ onConfirm, onCancel }: { onConfirm: (note: string) => void; onCancel: () => void }) {
  const [note, setNote] = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-card rounded-2xl border shadow-2xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
            <XCircle size={20} className="text-red-500" />
          </div>
          <div>
            <h2 className="font-bold text-lg">Reject Verification</h2>
            <p className="text-sm text-muted-foreground">This reason will be emailed to the user</p>
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Reason for rejection *</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. ID image is blurry or unclear — please resubmit with a clearer photo"
            rows={3}
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm resize-none outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-200 transition-all"
          />
        </div>
        <div className="flex gap-3 pt-1">
          <button
            onClick={onCancel}
            className="flex-1 h-11 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => note.trim() && onConfirm(note.trim())}
            disabled={!note.trim()}
            className="flex-1 h-11 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors disabled:opacity-40"
          >
            Reject &amp; Notify
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Verification card ─────────────────────────────────────────────────────────
function VerifCard({
  req,
  onApprove,
  onReject,
}: {
  req: VerifRequest;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
}) {
  const name = getName(req.user);
  const image = getImage(req.user);
  const initials = name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
  const [showId, setShowId] = useState(false);

  return (
    <>
      {showId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm cursor-pointer"
          onClick={() => setShowId(false)}
        >
          <div className="relative max-w-2xl max-h-[80vh] w-full mx-4">
            <Image src={req.idImageUrl} alt="ID Document" width={800} height={600} className="rounded-2xl object-contain w-full" />
            <p className="text-white/60 text-sm text-center mt-3">Click anywhere to close</p>
          </div>
        </div>
      )}

      <div className="rounded-2xl border bg-card overflow-hidden">
        {/* Profile row */}
        <div className="p-5 flex items-start gap-4">
          <div
            className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center text-xl font-bold text-white"
            style={{ background: image ? undefined : 'linear-gradient(135deg,#ec4899,#be185d)' }}
          >
            {image ? (
              <Image src={image} alt={name} width={56} height={56} className="object-cover w-full h-full" />
            ) : initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-base">{name}</span>
              {req.user.verified && (
                <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                  style={{ background: 'rgba(236,72,153,0.1)', border: '1px solid rgba(236,72,153,0.3)', color: '#be185d' }}>
                  <CheckCircle2 size={10} /> Verified
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">{req.user.email}</p>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <Badge variant="outline" className="text-xs capitalize">{req.user.role.toLowerCase()}</Badge>
              <StatusPill status={req.status} />
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">
              Submitted {new Date(req.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
            {req.reviewedAt && (
              <p className="text-xs text-muted-foreground">
                Reviewed {new Date(req.reviewedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            )}
            {req.adminNote && (
              <p className="text-xs text-red-500 mt-1"><strong>Note:</strong> {req.adminNote}</p>
            )}
          </div>
        </div>

        {/* ID image thumbnail */}
        <div className="px-5 pb-5">
          <button
            onClick={() => setShowId(true)}
            className="group relative w-full h-36 rounded-xl overflow-hidden bg-muted hover:opacity-90 transition-opacity block"
          >
            <Image src={req.idImageUrl} alt="ID Document" fill sizes="(max-width: 640px) 100vw, 400px" className="object-cover" />
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-sm font-medium">
              <ExternalLink size={14} /> View full size
            </div>
          </button>
        </div>

        {/* Actions */}
        {req.status === 'PENDING' && onApprove && onReject && (
          <div className="px-5 pb-5 flex gap-3">
            <button
              onClick={() => onApprove(req.id)}
              className="flex-1 h-10 rounded-xl bg-green-500 hover:bg-green-600 text-white text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <CheckCircle2 size={15} /> Approve
            </button>
            <button
              onClick={() => onReject(req.id)}
              className="flex-1 h-10 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <XCircle size={15} /> Reject
            </button>
          </div>
        )}
      </div>
    </>
  );
}

function StatusPill({ status }: { status: VerifStatus }) {
  if (status === 'PENDING') return (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium bg-amber-100 text-amber-700">
      <Clock size={10} /> Pending
    </span>
  );
  if (status === 'APPROVED') return (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-700">
      <ShieldCheck size={10} /> Approved
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium bg-red-100 text-red-600">
      <XCircle size={10} /> Rejected
    </span>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function AdminApprovalsPage() {
  const [requests, setRequests] = useState<VerifRequest[]>([]);
  const [tab, setTab] = useState<Tab>('PENDING');
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<{ requests: VerifRequest[] }>('/api/admin/verification-queue')
      .then((r) => setRequests(r.requests))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function approve(id: string) {
    await apiFetch(`/api/admin/verification/${id}/approve`, { method: 'PUT' });
    setRequests((prev) =>
      prev.map((r) => r.id === id ? { ...r, status: 'APPROVED' as VerifStatus, user: { ...r.user, verified: true } } : r)
    );
  }

  async function reject(id: string, note: string) {
    await apiFetch(`/api/admin/verification/${id}/reject`, { method: 'PUT', body: { adminNote: note } });
    setRequests((prev) =>
      prev.map((r) => r.id === id ? { ...r, status: 'REJECTED' as VerifStatus, adminNote: note } : r)
    );
    setRejectingId(null);
  }

  const filtered = requests.filter((r) => r.status === tab);
  const counts: Record<Tab, number> = {
    PENDING: requests.filter((r) => r.status === 'PENDING').length,
    APPROVED: requests.filter((r) => r.status === 'APPROVED').length,
    REJECTED: requests.filter((r) => r.status === 'REJECTED').length,
  };

  return (
    <>
      {rejectingId && (
        <RejectModal
          onConfirm={(note) => reject(rejectingId, note)}
          onCancel={() => setRejectingId(null)}
        />
      )}

      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#ec4899,#be185d)', boxShadow: '0 4px 14px rgba(236,72,153,0.3)' }}
          >
            <ShieldCheck size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Verification Queue</h1>
            <p className="text-sm text-muted-foreground">Review and approve identity submissions</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl bg-muted w-fit">
          {(['PENDING', 'APPROVED', 'REJECTED'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === t ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t === 'PENDING' && <Clock size={13} />}
              {t === 'APPROVED' && <ShieldCheck size={13} />}
              {t === 'REJECTED' && <XCircle size={13} />}
              {t.charAt(0) + t.slice(1).toLowerCase()}
              {counts[t] > 0 && (
                <span className={`rounded-full px-1.5 py-0.5 text-xs font-bold ${
                  t === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                  t === 'APPROVED' ? 'bg-green-100 text-green-700' :
                  'bg-red-100 text-red-600'
                }`}>
                  {counts[t]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 rounded-full border-4 border-pink-300 border-t-pink-600 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-2 text-center">
            <User size={32} className="text-muted-foreground/40" />
            <p className="text-muted-foreground">No {tab.toLowerCase()} requests</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((req) => (
              <VerifCard
                key={req.id}
                req={req}
                onApprove={tab === 'PENDING' ? approve : undefined}
                onReject={tab === 'PENDING' ? (id) => setRejectingId(id) : undefined}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
