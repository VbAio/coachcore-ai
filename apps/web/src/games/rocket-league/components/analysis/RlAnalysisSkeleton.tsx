'use client';

export function RlAnalysisSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-28 rounded-2xl bg-white/5" />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="h-80 rounded-2xl bg-white/5 lg:col-span-2" />
        <div className="h-80 rounded-2xl bg-white/5" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="h-56 rounded-2xl bg-white/5" />
        <div className="h-56 rounded-2xl bg-white/5" />
      </div>
    </div>
  );
}
