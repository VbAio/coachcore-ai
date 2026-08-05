'use client';

export function AnalysisSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-40 rounded-2xl bg-white/5" />
      <div className="grid gap-4 lg:grid-cols-12">
        <div className="h-[420px] rounded-2xl bg-white/5 lg:col-span-5" />
        <div className="h-[420px] rounded-2xl bg-white/5 lg:col-span-3" />
        <div className="h-[420px] rounded-2xl bg-white/5 lg:col-span-4" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="h-64 rounded-2xl bg-white/5" />
        <div className="h-64 rounded-2xl bg-white/5" />
      </div>
    </div>
  );
}
