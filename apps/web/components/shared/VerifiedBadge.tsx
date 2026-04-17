import { CheckCircle2 } from 'lucide-react';

interface Props {
  size?: 'sm' | 'md';
}

export function VerifiedBadge({ size = 'sm' }: Props) {
  const iconSize = size === 'md' ? 14 : 11;
  const textSize = size === 'md' ? 'text-xs' : 'text-[10px]';
  const px = size === 'md' ? 'px-2 py-1' : 'px-1.5 py-0.5';

  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full font-semibold ${px} ${textSize}`}
      style={{
        background: 'linear-gradient(135deg, rgba(236,72,153,0.12), rgba(190,24,93,0.1))',
        border: '1px solid rgba(236,72,153,0.3)',
        color: '#be185d',
      }}
    >
      <CheckCircle2 size={iconSize} className="text-pink-500 flex-shrink-0" />
      Verified
    </span>
  );
}
