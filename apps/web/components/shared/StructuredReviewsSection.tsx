'use client';
import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { Star, MessageSquarePlus, AlertTriangle, Clock, ThumbsUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { StructuredReviewForm, type RevieweeRole } from './StructuredReviewForm';
import { apiFetch } from '@/lib/api';
import { getCurrentUser } from '@/lib/auth';

interface ProfileInfo {
  id: string;
  role: string;
  email: string;
  modelProfile: { displayName: string; profileImage?: string | null } | null;
  brandProfile: { brandName: string; profileImage?: string | null; logoUrl?: string | null } | null;
  photographerProfile: { displayName: string; profileImage?: string | null } | null;
}

interface StructuredReview {
  id: string;
  dimensions: Record<string, number | boolean>;
  overallRating: number;
  comment?: string | null;
  reviewerResponse?: string | null;
  responseDeadline: string;
  isPublic: boolean;
  adminFlagged: boolean;
  createdAt: string;
  reviewer: ProfileInfo;
  campaign: { id: string; title: string };
}

interface ReviewsData {
  reviews: StructuredReview[];
  pendingForMe: StructuredReview[];
  total: number;
  avgRating: number | null;
  wouldWorkAgainPct: number | null;
  communityFlagged: boolean;
  revieweeRole: RevieweeRole | null;
  canReview: boolean;
  eligibleCampaigns: { campaignId: string; title: string }[];
}

function getUserName(p: ProfileInfo) {
  return p.modelProfile?.displayName ?? p.brandProfile?.brandName ?? p.photographerProfile?.displayName ?? p.email;
}

function getUserImage(p: ProfileInfo): string | null {
  return p.modelProfile?.profileImage ?? p.brandProfile?.profileImage ?? p.brandProfile?.logoUrl ?? p.photographerProfile?.profileImage ?? null;
}

function DimensionBar({ label, value }: { label: string; value: number }) {
  const pct = (value / 5) * 100;
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground w-32 flex-shrink-0">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full bg-amber-400 transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-semibold text-amber-600 w-6 text-right">{value.toFixed(1)}</span>
    </div>
  );
}

function timeUntil(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return 'expired';
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

const DIM_LABELS: Record<string, string> = {
  communication: 'Communication',
  punctuality: 'Punctuality',
  professionalism: 'Professionalism',
  creativity: 'Creative Collaboration',
  paymentPromptness: 'Payment Promptness',
  briefClarity: 'Brief Clarity',
  respectOnSet: 'Respect on Set',
  technicalSkill: 'Technical Skill',
  creativeDirection: 'Creative Direction',
};

function ReviewCard({ review, showRespond, onRespond }: {
  review: StructuredReview;
  showRespond?: boolean;
  onRespond?: (id: string, text: string) => void;
}) {
  const name = getUserName(review.reviewer);
  const img = getUserImage(review.reviewer);
  const initials = name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  const [respondText, setRespondText] = useState('');
  const [responding, setResponding] = useState(false);
  const [showResponseInput, setShowResponseInput] = useState(false);

  const numericDims = Object.entries(review.dimensions).filter(([, v]) => typeof v === 'number') as [string, number][];
  const wouldWorkAgain = review.dimensions.wouldWorkAgain;

  async function submitResponse() {
    if (!respondText.trim() || !onRespond) return;
    setResponding(true);
    try {
      await apiFetch(`/api/structured-reviews/${review.id}/respond`, {
        method: 'POST',
        body: { response: respondText.trim() },
      });
      onRespond(review.id, respondText.trim());
    } finally {
      setResponding(false);
    }
  }

  return (
    <div className={`rounded-2xl border bg-card overflow-hidden ${!review.isPublic ? 'border-amber-200 bg-amber-50/30' : ''}`}>
      {!review.isPublic && (
        <div className="px-4 py-2 bg-amber-50 border-b border-amber-200 flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 text-xs text-amber-700 font-medium">
            <Clock size={12} /> This review goes public in {timeUntil(review.responseDeadline)} — add your perspective
          </span>
        </div>
      )}

      <div className="p-5 space-y-4">
        {/* Reviewer header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center text-sm font-bold text-white"
              style={{ background: img ? undefined : 'linear-gradient(135deg,#ec4899,#be185d)' }}
            >
              {img ? (
                <Image src={img} alt={name} width={40} height={40} className="object-cover w-full h-full" />
              ) : initials}
            </div>
            <div>
              <p className="font-semibold text-sm">{name}</p>
              <p className="text-xs text-muted-foreground">{review.campaign.title}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="flex items-center gap-0.5">
              {[1,2,3,4,5].map((i) => (
                <Star key={i} size={12} className={i <= Math.round(review.overallRating) ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/30 fill-muted-foreground/30'} />
              ))}
            </div>
            <span className="text-xs font-bold text-amber-600">{review.overallRating.toFixed(1)}</span>
          </div>
        </div>

        {/* Dimension bars */}
        {numericDims.length > 0 && (
          <div className="space-y-2">
            {numericDims.map(([key, val]) => (
              <DimensionBar key={key} label={DIM_LABELS[key] ?? key} value={val} />
            ))}
          </div>
        )}

        {/* Would work again */}
        {wouldWorkAgain !== undefined && (
          <div className="flex items-center gap-1.5">
            <ThumbsUp size={12} className={wouldWorkAgain ? 'text-green-600' : 'text-muted-foreground'} />
            <span className="text-xs font-medium text-muted-foreground">
              {wouldWorkAgain ? 'Would work together again' : 'Would not work together again'}
            </span>
          </div>
        )}

        {/* Comment */}
        {review.comment && (
          <p className="text-sm text-muted-foreground leading-relaxed">&ldquo;{review.comment}&rdquo;</p>
        )}

        {/* Reviewee response */}
        {review.reviewerResponse && (
          <div className="rounded-xl bg-muted/60 px-4 py-3 border-l-4 border-pink-300">
            <p className="text-xs font-semibold text-pink-600 mb-1">Response</p>
            <p className="text-sm text-muted-foreground leading-relaxed">{review.reviewerResponse}</p>
          </div>
        )}

        {/* Respond button (for reviewee during window) */}
        {showRespond && !review.reviewerResponse && (
          <div className="space-y-2">
            {!showResponseInput ? (
              <button
                onClick={() => setShowResponseInput(true)}
                className="text-xs font-medium text-pink-600 hover:text-pink-700 transition-colors"
              >
                + Add your perspective
              </button>
            ) : (
              <>
                <textarea
                  value={respondText}
                  onChange={(e) => setRespondText(e.target.value)}
                  placeholder="Add your perspective (optional, max 500 chars)…"
                  rows={3}
                  maxLength={500}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm resize-none outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-200 transition-all"
                />
                <div className="flex gap-2">
                  <button onClick={() => setShowResponseInput(false)} className="px-3 py-1.5 rounded-lg border border-border text-xs hover:bg-muted transition-colors">Cancel</button>
                  <button
                    onClick={submitResponse}
                    disabled={responding || !respondText.trim()}
                    className="px-3 py-1.5 rounded-lg bg-pink-500 hover:bg-pink-600 text-white text-xs font-semibold transition-colors disabled:opacity-40"
                  >
                    {responding ? 'Saving…' : 'Submit Response'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          {new Date(review.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </p>
      </div>
    </div>
  );
}

// ─── Campaign picker modal ────────────────────────────────────────────────────
function CampaignPickerModal({ campaigns, onSelect, onCancel }: {
  campaigns: { campaignId: string; title: string }[];
  onSelect: (c: { campaignId: string; title: string }) => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-card rounded-2xl border shadow-2xl w-full max-w-sm p-6 space-y-4">
        <h2 className="font-bold text-lg">Select Campaign</h2>
        <p className="text-sm text-muted-foreground">Which completed campaign would you like to review?</p>
        <div className="space-y-2">
          {campaigns.map((c) => (
            <button key={c.campaignId} onClick={() => onSelect(c)} className="w-full text-left px-4 py-3 rounded-xl border border-border hover:bg-muted transition-colors text-sm font-medium">
              {c.title}
            </button>
          ))}
        </div>
        <button onClick={onCancel} className="w-full h-10 rounded-xl border border-border text-sm hover:bg-muted transition-colors">Cancel</button>
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export function StructuredReviewsSection({ revieweeUserId, revieweeName }: { revieweeUserId: string; revieweeName: string }) {
  const [data, setData] = useState<ReviewsData | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<{ campaignId: string; title: string } | null>(null);
  const me = getCurrentUser();
  const isOwnProfile = me?.userId === revieweeUserId;

  const load = useCallback(async () => {
    apiFetch<ReviewsData>(`/api/structured-reviews/${revieweeUserId}`)
      .then(setData)
      .catch(() => {});
  }, [revieweeUserId]);

  useEffect(() => { load(); }, [load]);

  function handleReviewDone() {
    setSelectedCampaign(null);
    load();
  }

  function handleResponded(reviewId: string, text: string) {
    setData((prev) => prev ? {
      ...prev,
      pendingForMe: prev.pendingForMe.map((r) => r.id === reviewId ? { ...r, reviewerResponse: text, isPublic: true } : r),
    } : prev);
  }

  if (!data) return null;

  const { reviews, pendingForMe, total, avgRating, wouldWorkAgainPct, communityFlagged, revieweeRole, canReview, eligibleCampaigns } = data;

  // Aggregate dimension averages
  const dimSums: Record<string, { sum: number; count: number }> = {};
  for (const r of reviews) {
    for (const [key, val] of Object.entries(r.dimensions)) {
      if (typeof val === 'number') {
        if (!dimSums[key]) dimSums[key] = { sum: 0, count: 0 };
        dimSums[key].sum += val;
        dimSums[key].count += 1;
      }
    }
  }
  const dimAverages = Object.entries(dimSums).map(([key, { sum, count }]) => ({ key, avg: sum / count }));

  return (
    <>
      {showPicker && (
        <CampaignPickerModal
          campaigns={eligibleCampaigns}
          onSelect={(c) => { setShowPicker(false); setSelectedCampaign(c); }}
          onCancel={() => setShowPicker(false)}
        />
      )}

      {selectedCampaign && revieweeRole && (
        <StructuredReviewForm
          revieweeId={revieweeUserId}
          revieweeName={revieweeName}
          revieweeRole={revieweeRole}
          campaignId={selectedCampaign.campaignId}
          campaignTitle={selectedCampaign.title}
          onDone={handleReviewDone}
          onCancel={() => setSelectedCampaign(null)}
        />
      )}

      <div className="space-y-6">
        {/* Community flagged banner */}
        {communityFlagged && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700">
            <AlertTriangle size={16} className="flex-shrink-0" />
            <p className="text-sm font-medium">Community Flagged — this profile has received multiple similar concerns and is under admin review.</p>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold">Reviews</h2>
              {total > 0 && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-0.5">
                    {[1,2,3,4,5].map((i) => (
                      <Star key={i} size={14} className={i <= Math.round(avgRating ?? 0) ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/30 fill-muted-foreground/30'} />
                    ))}
                  </div>
                  <span className="text-sm font-bold">{avgRating?.toFixed(1)}</span>
                  <span className="text-sm text-muted-foreground">({total})</span>
                </div>
              )}
            </div>
            {wouldWorkAgainPct !== null && total > 0 && (
              <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                <ThumbsUp size={13} className="text-green-600" />
                <strong>{wouldWorkAgainPct}%</strong> would work again
              </p>
            )}
          </div>
          {canReview && eligibleCampaigns.length > 0 && (
            <button
              onClick={() => eligibleCampaigns.length === 1 ? setSelectedCampaign(eligibleCampaigns[0]) : setShowPicker(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors"
            >
              <MessageSquarePlus size={14} />
              Leave a Review
            </button>
          )}
        </div>

        {/* Dimension summary */}
        {dimAverages.length > 0 && (
          <div className="rounded-2xl border bg-card p-5 space-y-3">
            <p className="text-sm font-semibold text-muted-foreground">Average by dimension</p>
            {dimAverages.map(({ key, avg }) => (
              <DimensionBar key={key} label={DIM_LABELS[key] ?? key} value={avg} />
            ))}
          </div>
        )}

        {/* Pending reviews (visible only to reviewee) */}
        {isOwnProfile && pendingForMe.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-semibold text-amber-700 flex items-center gap-2">
              <Clock size={14} /> Pending reviews ({pendingForMe.length}) — only visible to you
            </p>
            {pendingForMe.map((r) => (
              <ReviewCard key={r.id} review={r} showRespond onRespond={handleResponded} />
            ))}
          </div>
        )}

        {/* Public reviews */}
        {total === 0 && pendingForMe.length === 0 ? (
          <p className="text-sm text-muted-foreground">No reviews yet.</p>
        ) : (
          <div className="space-y-4">
            {reviews.map((r) => <ReviewCard key={r.id} review={r} />)}
          </div>
        )}
      </div>
    </>
  );
}
