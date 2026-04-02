import {
  Skeleton,
  SkeletonLine,
  SkeletonRow,
} from './components/skeletons/Skeleton';

export default function ProtectedLoading() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8">
      {/* Top two-column area (form + sidebar) */}
      <section className="grid gap-6 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-3">
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-3 w-2/3" />
          <div className="grid gap-2 md:grid-cols-2 pt-2">
            <Skeleton className="h-9 w-full rounded-lg" />
            <Skeleton className="h-9 w-full rounded-lg" />
          </div>
          <Skeleton className="h-9 w-full rounded-lg" />
          <Skeleton className="h-9 w-28 rounded-lg" />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-3">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-9 w-full rounded-lg" />
        </div>
      </section>

      {/* List area */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <div className="flex gap-3">
            <Skeleton className="h-8 w-20 rounded-lg" />
            <Skeleton className="h-8 w-20 rounded-lg" />
          </div>
        </div>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
        <div className="flex justify-center gap-1 pt-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-8 rounded" />
          ))}
        </div>
      </section>

      <SkeletonLine className="sr-only" />
    </div>
  );
}
