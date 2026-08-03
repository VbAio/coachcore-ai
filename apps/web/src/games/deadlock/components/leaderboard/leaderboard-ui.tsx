'use client';

import { cn } from '@/lib/utils';
import type { LeaderboardSortField } from '@/types/leaderboard';

export function LiveStatus({ lastFetchedAt }: { lastFetchedAt?: string }) {
  const ago = lastFetchedAt
    ? Math.max(0, Math.floor((Date.now() - new Date(lastFetchedAt).getTime()) / 60000))
    : null;

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="relative flex h-2.5 w-2.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-60" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
      </span>
      <span className="font-medium text-green-400">Live</span>
      {ago !== null && (
        <span className="text-zinc-500">
          · Updated {ago === 0 ? 'just now' : `${ago} min ago`}
        </span>
      )}
    </div>
  );
}

export function RankChange({ change }: { change: number | null }) {
  if (change === null || change === 0) {
    return <span className="text-zinc-600 text-xs">—</span>;
  }
  if (change > 0) {
    return (
      <span className="text-green-400 text-xs font-semibold">▲ +{change}</span>
    );
  }
  return (
    <span className="text-red-400 text-xs font-semibold">▼ {change}</span>
  );
}

export function StreakBadge({
  streak,
}: {
  streak: { type: 'win' | 'loss' | 'none'; count: number };
}) {
  if (streak.type === 'none' || streak.count === 0) return null;
  const isWin = streak.type === 'win';
  return (
    <span
      className={cn(
        'ml-2 inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold',
        isWin ? 'bg-orange-500/15 text-orange-300' : 'bg-cyan-500/15 text-cyan-300'
      )}
    >
      {isWin ? '🔥' : '❄️'} {streak.count} {isWin ? 'Wins' : 'Losses'}
    </span>
  );
}

export function SortHeader({
  label,
  field,
  current,
  dir,
  onSort,
  className,
}: {
  label: string;
  field: LeaderboardSortField;
  current: LeaderboardSortField;
  dir: 'asc' | 'desc';
  onSort: (field: LeaderboardSortField) => void;
  className?: string;
}) {
  const active = current === field;
  return (
    <button
      type="button"
      onClick={() => onSort(field)}
      className={cn(
        'flex items-center gap-1 text-left text-xs font-semibold uppercase tracking-wider transition-colors hover:text-purple-300',
        active ? 'text-purple-400' : 'text-zinc-500',
        className
      )}
    >
      {label}
      {active && <span className="text-[10px]">{dir === 'asc' ? '↑' : '↓'}</span>}
    </button>
  );
}

export function TableSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex animate-pulse items-center gap-4 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3"
        >
          <div className="h-4 w-8 rounded bg-white/10" />
          <div className="h-8 w-8 rounded-full bg-white/10" />
          <div className="h-4 flex-1 rounded bg-white/10" />
          <div className="hidden h-4 w-16 rounded bg-white/10 md:block" />
          <div className="hidden h-4 w-12 rounded bg-white/10 lg:block" />
        </div>
      ))}
    </div>
  );
}

export function formatWinRate(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return Math.round(n).toLocaleString();
}

export function formatKda(kda: number): string {
  return kda.toFixed(2);
}

export function getRegionFlag(region: string): string {
  const flags: Record<string, string> = {
    Global: '🌍',
    NAmerica: '🇺🇸',
    Europe: '🇪🇺',
    SAmerica: '🇧🇷',
    Asia: '🌏',
    Oceania: '🇦🇺',
  };
  return flags[region] ?? '🌍';
}
