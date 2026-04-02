import { type HTMLAttributes } from 'react';

type SkeletonProps = HTMLAttributes<HTMLDivElement>;

export function Skeleton({ className = '', ...props }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded bg-slate-200 ${className}`}
      {...props}
    />
  );
}

export function SkeletonLine({ className = '' }: { className?: string }) {
  return <Skeleton className={`h-3 w-full ${className}`} />;
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
      <Skeleton className="h-6 w-6 shrink-0 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-3/5" />
        <Skeleton className="h-3 w-2/5" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-7 w-14 rounded-lg" />
        <Skeleton className="h-7 w-14 rounded-lg" />
      </div>
    </div>
  );
}

export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-3">
      <Skeleton className="h-4 w-1/3" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={`h-3 ${i === lines - 1 ? 'w-2/3' : 'w-full'}`}
        />
      ))}
    </div>
  );
}

export function SkeletonGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} lines={2} />
      ))}
    </div>
  );
}

export function SkeletonMetricCard() {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200/60">
      <Skeleton className="absolute inset-x-0 top-0 h-1" />
      <Skeleton className="h-3 w-16 mb-3" />
      <Skeleton className="h-8 w-20" />
    </div>
  );
}
