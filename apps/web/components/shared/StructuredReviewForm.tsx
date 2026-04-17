'use client';
import { useState } from 'react';
import { Star, ThumbsUp, ThumbsDown } from 'lucide-react';
import { apiFetch } from '@/lib/api';

export type RevieweeRole = 'MODEL' | 'BRAND' | 'PHOTOGRAPHER';

interface Dimension {
  key: string;
  label: string;
  isBoolean?: boolean;
}

const DIMENSIONS: Record<RevieweeRole, Dimension[]> = {
  MODEL: [
    { key: 'communication', label: 'Communication' },
    { key: 'punctuality', label: 'Punctuality' },
    { key: 'professionalism', label: 'Professionalism' },
    { key: 'creativity', label: 'Creative Collaboration' },
    { key: 'wouldWorkAgain', label: 'Would work again', isBoolean: true },
  ],
  BRAND: [
    { key: 'communication', label: 'Communication' },
    { key: 'paymentPromptness', label: 'Payment Promptness' },
    { key: 'briefClarity', label: 'Brief Clarity' },
    { key: 'respectOnSet', label: 'Respect on Set' },
    { key: 'wouldWorkAgain', label: 'Would work again', isBoolean: true },
  ],
  PHOTOGRAPHER: [
    { key: 'technicalSkill', label: 'Technical Skill' },
    { key: 'communication', label: 'Communication' },
    { key: 'punctuality', label: 'Punctuality' },
    { key: 'creativeDirection', label: 'Creative Direction' },
    { key: 'wouldWorkAgain', label: 'Would work again', isBoolean: true },
  ],
};

interface Props {
  revieweeId: string;
  revieweeName: string;
  revieweeRole: RevieweeRole;
  campaignId: string;
  campaignTitle: string;
  onDone: () => void;
  onCancel: () => void;
}

function StarSelector({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i)}
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered(0)}
          className="p-0.5 transition-transform hover:scale-110"
        >
          <Star
            size={22}
            className={i <= (hovered || value) ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/30 fill-muted-foreground/30'}
          />
        </button>
      ))}
      {value > 0 && <span className="text-xs text-muted-foreground ml-1 self-center">{['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'][value]}</span>}
    </div>
  );
}

export function StructuredReviewForm({ revieweeId, revieweeName, revieweeRole, campaignId, campaignTitle, onDone, onCancel }: Props) {
  const dims = DIMENSIONS[revieweeRole] ?? DIMENSIONS.MODEL;
  const [scores, setScores] = useState<Record<string, number | boolean>>({});
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const numericDims = dims.filter((d) => !d.isBoolean);
  const allNumericFilled = numericDims.every((d) => ((scores[d.key] as number) ?? 0) > 0);

  async function submit() {
    if (!allNumericFilled) { setError('Please rate all dimensions'); return; }
    setLoading(true);
    setError('');
    try {
      await apiFetch('/api/structured-reviews', {
        method: 'POST',
        body: { revieweeId, campaignId, dimensions: scores, comment: comment.trim() || undefined },
      });
      onDone();
    } catch (err: any) {
      setError(err?.error ?? 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 overflow-y-auto py-8">
      <div className="bg-card rounded-2xl border shadow-2xl w-full max-w-md p-6 space-y-5 my-auto">
        <div>
          <h2 className="font-bold text-lg">Leave a Review</h2>
          <p className="text-sm text-muted-foreground mt-0.5">For campaign: <strong>{campaignTitle}</strong></p>
          <div className="mt-2 px-3 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs leading-relaxed">
            Your review will be shared with <strong>{revieweeName}</strong> for 48 hours before going public. Keep it professional and constructive.
          </div>
        </div>

        <div className="space-y-4">
          {dims.map((dim) => (
            <div key={dim.key} className="flex items-center justify-between gap-3">
              <label className="text-sm font-medium flex-shrink-0">{dim.label}</label>
              {dim.isBoolean ? (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setScores((prev) => ({ ...prev, [dim.key]: true }))}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors ${
                      scores[dim.key] === true
                        ? 'bg-green-50 border-green-300 text-green-700'
                        : 'border-border hover:bg-muted'
                    }`}
                  >
                    <ThumbsUp size={12} /> Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => setScores((prev) => ({ ...prev, [dim.key]: false }))}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors ${
                      scores[dim.key] === false
                        ? 'bg-red-50 border-red-300 text-red-700'
                        : 'border-border hover:bg-muted'
                    }`}
                  >
                    <ThumbsDown size={12} /> No
                  </button>
                </div>
              ) : (
                <StarSelector
                  value={(scores[dim.key] as number) ?? 0}
                  onChange={(v) => setScores((prev) => ({ ...prev, [dim.key]: v }))}
                />
              )}
            </div>
          ))}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Comment (optional)</label>
            <span className="text-xs text-muted-foreground">{comment.length}/500</span>
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value.slice(0, 500))}
            placeholder="Share your experience working together…"
            rows={3}
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm resize-none outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-200 transition-all"
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 h-11 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors">
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={loading || !allNumericFilled}
            className="flex-1 h-11 rounded-xl bg-pink-500 hover:bg-pink-600 text-white text-sm font-semibold transition-colors disabled:opacity-40"
          >
            {loading ? 'Submitting…' : 'Submit Review'}
          </button>
        </div>
      </div>
    </div>
  );
}
