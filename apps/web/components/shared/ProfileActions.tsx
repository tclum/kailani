'use client';
import { useState, useRef, useEffect } from 'react';
import { MoreVertical, Flag, Ban, Check } from 'lucide-react';
import { apiFetch } from '@/lib/api';

const REPORT_REASONS = ['Fake profile', 'Inappropriate content', 'Spam', 'Harassment', 'Other'] as const;
type ReportReason = (typeof REPORT_REASONS)[number];

// ─── Report modal ──────────────────────────────────────────────────────────────
function ReportModal({
  targetName,
  onConfirm,
  onCancel,
}: {
  targetName: string;
  onConfirm: (reason: ReportReason, details: string) => void;
  onCancel: () => void;
}) {
  const [reason, setReason] = useState<ReportReason | ''>('');
  const [details, setDetails] = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-card rounded-2xl border shadow-2xl w-full max-w-md p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
            <Flag size={18} className="text-red-500" />
          </div>
          <div>
            <h2 className="font-bold text-lg">Report {targetName}</h2>
            <p className="text-sm text-muted-foreground">This will be reviewed by our team</p>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Reason *</label>
          <div className="space-y-1.5">
            {REPORT_REASONS.map((r) => (
              <button
                key={r}
                onClick={() => setReason(r)}
                className={`w-full text-left px-4 py-2.5 rounded-xl border text-sm transition-colors ${
                  reason === r
                    ? 'border-pink-400 bg-pink-50 text-pink-700 font-medium'
                    : 'border-border hover:bg-muted'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Additional details (optional)</label>
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Describe the issue…"
            rows={3}
            maxLength={1000}
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm resize-none outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-200 transition-all"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 h-11 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => reason && onConfirm(reason, details)}
            disabled={!reason}
            className="flex-1 h-11 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors disabled:opacity-40"
          >
            Submit Report
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Block confirmation dialog ─────────────────────────────────────────────────
function BlockModal({
  targetName,
  isBlocked,
  onConfirm,
  onCancel,
}: {
  targetName: string;
  isBlocked: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-card rounded-2xl border shadow-2xl w-full max-w-sm p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isBlocked ? 'bg-green-100' : 'bg-orange-100'}`}>
            <Ban size={18} className={isBlocked ? 'text-green-600' : 'text-orange-500'} />
          </div>
          <div>
            <h2 className="font-bold text-lg">{isBlocked ? 'Unblock' : 'Block'} {targetName}?</h2>
            {!isBlocked && (
              <p className="text-sm text-muted-foreground mt-0.5">
                They won&apos;t be able to see your profile or contact you.
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 h-11 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 h-11 rounded-xl text-white text-sm font-semibold transition-colors ${
              isBlocked ? 'bg-green-500 hover:bg-green-600' : 'bg-orange-500 hover:bg-orange-600'
            }`}
          >
            {isBlocked ? 'Unblock' : 'Confirm Block'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export function ProfileActions({
  targetUserId,
  targetName,
}: {
  targetUserId: string;
  targetName: string;
}) {
  const [open, setOpen] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showBlock, setShowBlock] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [reportDone, setReportDone] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Load block status
  useEffect(() => {
    apiFetch<{ blockedIds: string[] }>('/api/blocks')
      .then(({ blockedIds }) => setIsBlocked(blockedIds.includes(targetUserId)))
      .catch(() => {});
  }, [targetUserId]);

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  async function submitReport(reason: ReportReason, details: string) {
    try {
      await apiFetch('/api/reports', { method: 'POST', body: { reportedId: targetUserId, reason, details: details || undefined } });
      setReportDone(true);
    } catch {}
    setShowReport(false);
  }

  async function toggleBlock() {
    setShowBlock(false);
    try {
      if (isBlocked) {
        await apiFetch(`/api/blocks/${targetUserId}`, { method: 'DELETE' });
        setIsBlocked(false);
      } else {
        await apiFetch('/api/blocks', { method: 'POST', body: { blockedId: targetUserId } });
        setIsBlocked(true);
      }
    } catch {}
  }

  return (
    <>
      {showReport && (
        <ReportModal
          targetName={targetName}
          onConfirm={submitReport}
          onCancel={() => setShowReport(false)}
        />
      )}
      {showBlock && (
        <BlockModal
          targetName={targetName}
          isBlocked={isBlocked}
          onConfirm={toggleBlock}
          onCancel={() => setShowBlock(false)}
        />
      )}

      <div ref={ref} className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="w-9 h-9 flex items-center justify-center rounded-lg border border-border hover:bg-muted transition-colors"
          aria-label="More options"
        >
          <MoreVertical size={16} />
        </button>

        {open && (
          <div className="absolute right-0 top-10 z-30 w-52 bg-card rounded-xl border shadow-lg overflow-hidden">
            <button
              onClick={() => { setOpen(false); setShowReport(true); }}
              disabled={reportDone}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-muted transition-colors text-left disabled:opacity-50"
            >
              {reportDone ? <Check size={15} className="text-green-500" /> : <Flag size={15} className="text-red-500" />}
              {reportDone ? 'Reported' : 'Report this user'}
            </button>
            <div className="h-px bg-border" />
            <button
              onClick={() => { setOpen(false); setShowBlock(true); }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-muted transition-colors text-left ${isBlocked ? 'text-green-600' : 'text-orange-600'}`}
            >
              <Ban size={15} />
              {isBlocked ? 'Unblock this user' : 'Block this user'}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
