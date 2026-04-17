'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Star, MessageSquarePlus } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { getCurrentUser } from '@/lib/auth';

interface ReviewerInfo {
  id: string;
  role: string;
  modelProfile: { displayName: string; profileImage?: string | null } | null;
  brandProfile: { brandName: string; profileImage?: string | null; logoUrl?: string | null } | null;
  photographerProfile: { displayName: string; profileImage?: string | null } | null;
}

interface Review {
  id: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
  reviewer: ReviewerInfo;
  campaign: { id: string; title: string };
}

interface ReviewsData {
  reviews: Review[];
  total: number;
  average: number | null;
}

function StarRow({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          className={i <= rating ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/30 fill-muted-foreground/30'}
        />
      ))}
    </div>
  );
}

function ReviewerName(reviewer: ReviewerInfo) {
  return reviewer.modelProfile?.displayName ?? reviewer.brandProfile?.brandName ?? reviewer.photographerProfile?.displayName ?? 'User';
}

function ReviewerImage(reviewer: ReviewerInfo): string | null {
  return reviewer.modelProfile?.profileImage ?? reviewer.brandProfile?.profileImage ?? reviewer.brandProfile?.logoUrl ?? reviewer.photographerProfile?.profileImage ?? null;
}

// ─── Leave a review modal ──────────────────────────────────────────────────────
function ReviewModal({
  revieweeId,
  campaignId,
  campaignTitle,
  onDone,
  onCancel,
}: {
  revieweeId: string;
  campaignId: string;
  campaignTitle: string;
  onDone: (review: Review) => void;
  onCancel: () => void;
}) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    if (rating === 0) { setError('Please select a rating'); return; }
    setLoading(true);
    setError('');
    try {
      const review = await apiFetch<Review>('/api/reviews', {
        method: 'POST',
        body: { revieweeId, campaignId, rating, comment: comment.trim() || undefined },
      });
      onDone(review);
    } catch (err: any) {
      setError(err?.error ?? 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-card rounded-2xl border shadow-2xl w-full max-w-md p-6 space-y-5">
        <div>
          <h2 className="font-bold text-lg">Leave a Review</h2>
          <p className="text-sm text-muted-foreground mt-0.5">For campaign: {campaignTitle}</p>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Rating</p>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <button
                key={i}
                type="button"
                onClick={() => setRating(i)}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(0)}
                className="p-1 transition-transform hover:scale-110"
              >
                <Star
                  size={28}
                  className={
                    i <= (hovered || rating)
                      ? 'text-amber-400 fill-amber-400'
                      : 'text-muted-foreground/30 fill-muted-foreground/30'
                  }
                />
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Comment (optional)</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience…"
            rows={3}
            maxLength={1000}
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm resize-none outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-200 transition-all"
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 h-11 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={loading || rating === 0}
            className="flex-1 h-11 rounded-xl bg-pink-500 hover:bg-pink-600 text-white text-sm font-semibold transition-colors disabled:opacity-40"
          >
            {loading ? 'Submitting…' : 'Submit Review'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Shared campaign selector modal ───────────────────────────────────────────
interface SharedCampaign {
  campaignId: string;
  title: string;
}

function CampaignPickerModal({
  campaigns,
  onSelect,
  onCancel,
}: {
  campaigns: SharedCampaign[];
  onSelect: (c: SharedCampaign) => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-card rounded-2xl border shadow-2xl w-full max-w-sm p-6 space-y-4">
        <h2 className="font-bold text-lg">Select Campaign</h2>
        <p className="text-sm text-muted-foreground">Which completed campaign would you like to review?</p>
        <div className="space-y-2">
          {campaigns.map((c) => (
            <button
              key={c.campaignId}
              onClick={() => onSelect(c)}
              className="w-full text-left px-4 py-3 rounded-xl border border-border hover:bg-muted transition-colors text-sm font-medium"
            >
              {c.title}
            </button>
          ))}
        </div>
        <button
          onClick={onCancel}
          className="w-full h-10 rounded-xl border border-border text-sm hover:bg-muted transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export function ReviewsSection({ revieweeUserId }: { revieweeUserId: string }) {
  const [data, setData] = useState<ReviewsData | null>(null);
  const [eligibleCampaigns, setEligibleCampaigns] = useState<SharedCampaign[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<SharedCampaign | null>(null);
  const me = getCurrentUser();
  const isOwnProfile = me?.userId === revieweeUserId;

  useEffect(() => {
    apiFetch<ReviewsData>(`/api/reviews/${revieweeUserId}`)
      .then(setData)
      .catch(() => {});
  }, [revieweeUserId]);

  useEffect(() => {
    if (!me || isOwnProfile) return;
    // Find shared completed campaigns
    apiFetch<{ applications: any[] }>('/api/campaigns/my-applications')
      .then(({ applications }) => {
        const completed = applications
          .filter((a) => a.status === 'ACCEPTED' && a.campaign?.status === 'COMPLETED')
          .map((a) => ({ campaignId: a.campaignId, title: a.campaign.title }));
        // Deduplicate
        const seen = new Set<string>();
        const unique = completed.filter((c) => {
          if (seen.has(c.campaignId)) return false;
          seen.add(c.campaignId);
          return true;
        });
        setEligibleCampaigns(unique);
      })
      .catch(() => {});
  }, [me, isOwnProfile, revieweeUserId]);

  function handleReviewDone(review: Review) {
    setSelectedCampaign(null);
    setData((prev) => {
      if (!prev) return { reviews: [review], total: 1, average: review.rating };
      const newReviews = [review, ...prev.reviews];
      const avg = newReviews.reduce((s, r) => s + r.rating, 0) / newReviews.length;
      return { reviews: newReviews, total: newReviews.length, average: avg };
    });
  }

  const canLeaveReview = !isOwnProfile && me && eligibleCampaigns.length > 0;

  return (
    <div className="space-y-4">
      {showPicker && eligibleCampaigns.length > 0 && (
        <CampaignPickerModal
          campaigns={eligibleCampaigns}
          onSelect={(c) => { setShowPicker(false); setSelectedCampaign(c); }}
          onCancel={() => setShowPicker(false)}
        />
      )}

      {selectedCampaign && (
        <ReviewModal
          revieweeId={revieweeUserId}
          campaignId={selectedCampaign.campaignId}
          campaignTitle={selectedCampaign.title}
          onDone={handleReviewDone}
          onCancel={() => setSelectedCampaign(null)}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold">Reviews</h2>
          {data && data.total > 0 && (
            <div className="flex items-center gap-2">
              <StarRow rating={Math.round(data.average ?? 0)} size={16} />
              <span className="text-sm font-semibold">{data.average?.toFixed(1)}</span>
              <span className="text-sm text-muted-foreground">({data.total})</span>
            </div>
          )}
        </div>
        {canLeaveReview && (
          <button
            onClick={() => eligibleCampaigns.length === 1 ? setSelectedCampaign(eligibleCampaigns[0]) : setShowPicker(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
          >
            <MessageSquarePlus size={14} />
            Leave a Review
          </button>
        )}
      </div>

      {/* Reviews list */}
      {!data ? (
        <p className="text-sm text-muted-foreground">Loading reviews…</p>
      ) : data.total === 0 ? (
        <p className="text-sm text-muted-foreground">No reviews yet.</p>
      ) : (
        <div className="space-y-3">
          {data.reviews.map((r) => {
            const name = ReviewerName(r.reviewer);
            const img = ReviewerImage(r.reviewer);
            const initials = name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
            return (
              <div key={r.id} className="rounded-xl border bg-card p-4 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center text-sm font-bold text-white"
                      style={{ background: img ? undefined : 'linear-gradient(135deg,#ec4899,#be185d)' }}
                    >
                      {img ? (
                        <Image src={img} alt={name} width={36} height={36} className="object-cover w-full h-full" />
                      ) : initials}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{name}</p>
                      <p className="text-xs text-muted-foreground">{r.campaign.title}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <StarRow rating={r.rating} size={13} />
                    <p className="text-xs text-muted-foreground">
                      {new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                {r.comment && <p className="text-sm text-muted-foreground leading-relaxed">{r.comment}</p>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
