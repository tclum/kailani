import { cn } from '@/lib/utils';

export default function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse bg-muted rounded-xl', className)} />;
}

export function SkeletonAvatar({ size = 40 }: { size?: number }) {
  return (
    <div
      className="animate-pulse bg-muted rounded-full"
      style={{ width: size, height: size }}
    />
  );
}

export function SkeletonText({
  lines = 1,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  const widths = ['w-full', 'w-11/12', 'w-10/12', 'w-9/12', 'w-8/12'];
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'animate-pulse bg-muted rounded-xl h-3',
            widths[i % widths.length]
          )}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'rounded-2xl p-4 border bg-card space-y-3',
        className
      )}
    >
      <div className="flex items-center gap-3">
        <SkeletonAvatar size={40} />
        <div className="flex-1 space-y-2">
          <div className="animate-pulse bg-muted rounded-xl h-3 w-1/3" />
          <div className="animate-pulse bg-muted rounded-xl h-3 w-1/4" />
        </div>
      </div>
      <SkeletonText lines={2} />
      <div className="animate-pulse bg-muted rounded-xl h-32 w-full" />
    </div>
  );
}

export function SkeletonButton({ className }: { className?: string }) {
  return (
    <div
      className={cn('animate-pulse bg-muted rounded-xl h-9 w-24', className)}
    />
  );
}

export function SkeletonImage({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'animate-pulse bg-muted rounded-xl aspect-square w-full',
        className
      )}
    />
  );
}
