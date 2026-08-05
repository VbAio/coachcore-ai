'use client';

export function AnalysisSkeleton() {
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="h-40 rounded-2xl bg-white/5 shimmer" />
      <div className="grid gap-4 lg:grid-cols-12">
        <div className="h-[420px] rounded-2xl bg-white/5 shimmer lg:col-span-5" />
        <div className="h-[420px] rounded-2xl bg-white/5 shimmer lg:col-span-3" />
        <div className="h-[420px] rounded-2xl bg-white/5 shimmer lg:col-span-4" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="h-64 rounded-2xl bg-white/5 shimmer" />
        <div className="h-64 rounded-2xl bg-white/5 shimmer" />
      </div>
    </div>
  );
}
