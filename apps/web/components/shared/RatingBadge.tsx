import { Star } from 'lucide-react';

export function RatingBadge({ average, total }: { average: number; total: number }) {
  if (total === 0) return null;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{ background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.3)', color: '#92400e' }}>
      <Star size={10} className="fill-amber-400 text-amber-400" />
      {average.toFixed(1)}
    </span>
  );
}
