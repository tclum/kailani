'use client';
import Link from 'next/link';
import { Eye, Pencil, Circle } from 'lucide-react';

interface CompletenessItem {
  label: string;
  done: boolean;
}

export function OwnProfileBanner({
  editHref,
  completenessItems,
}: {
  editHref: string;
  completenessItems: CompletenessItem[];
}) {
  const done = completenessItems.filter((i) => i.done).length;
  const pct = Math.round((done / completenessItems.length) * 100);
  const missing = completenessItems.filter((i) => !i.done);

  return (
    <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Eye size={15} className="text-blue-600 flex-shrink-0" />
          <p className="text-sm font-semibold text-blue-800">This is how others see your profile</p>
        </div>
        <Link
          href={editHref}
          className="flex items-center gap-1.5 h-8 px-4 rounded-xl text-xs font-semibold text-white"
          style={{ background: 'linear-gradient(135deg,#ec4899,#be185d)' }}
        >
          <Pencil size={11} /> Edit Profile
        </Link>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs text-blue-700 font-medium">Profile {pct}% complete</span>
          <span className="text-xs text-blue-600">{done}/{completenessItems.length} fields</span>
        </div>
        <div className="h-2 rounded-full bg-blue-200 overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${pct}%`,
              background:
                pct >= 80 ? 'linear-gradient(90deg,#22c55e,#16a34a)'
                : pct >= 50 ? 'linear-gradient(90deg,#f59e0b,#d97706)'
                : 'linear-gradient(90deg,#ec4899,#be185d)',
            }}
          />
        </div>
      </div>

      {missing.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {missing.slice(0, 5).map((item) => (
            <span key={item.label} className="flex items-center gap-1 text-xs text-blue-700 bg-blue-100 px-2.5 py-1 rounded-lg">
              <Circle size={9} className="text-blue-400" /> {item.label}
            </span>
          ))}
          {missing.length > 5 && (
            <span className="text-xs text-blue-600 self-center">+{missing.length - 5} more</span>
          )}
        </div>
      )}
    </div>
  );
}
