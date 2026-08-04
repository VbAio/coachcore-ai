'use client';

import { Search } from 'lucide-react';
import type { LeaderboardRegion } from '@/types/leaderboard';
import { REGIONS } from '@/types/leaderboard';
import { cn } from '@/lib/utils';

interface LeaderboardFiltersProps {
  region: LeaderboardRegion;
  onRegionChange: (region: LeaderboardRegion) => void;
  search: string;
  onSearchChange: (v: string) => void;
  minWinRate: string;
  onMinWinRateChange: (v: string) => void;
  minGames: string;
  onMinGamesChange: (v: string) => void;
  limit: number;
  onLimitChange: (v: number) => void;
}

export function LeaderboardFilters({
  region,
  onRegionChange,
  search,
  onSearchChange,
  minWinRate,
  onMinWinRateChange,
  minGames,
  onMinGamesChange,
  limit,
  onLimitChange,
}: LeaderboardFiltersProps) {
  return (
    <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4 backdrop-blur-sm">
      <div className="flex flex-wrap gap-2">
        {REGIONS.map((r) => (
          <button
            key={r.value}
            type="button"
            onClick={() => onRegionChange(r.value)}
            className={cn(
              'rounded-full border px-3 py-1.5 text-sm font-medium transition-all',
              region === r.value
                ? 'border-emerald-500/50 bg-emerald-500/20 text-emerald-200'
                : 'border-white/10 bg-white/[0.03] text-zinc-400 hover:border-white/20 hover:text-zinc-200'
            )}
          >
            {r.flag} {r.label}
          </button>
        ))}
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by player name..."
          className="w-full rounded-xl border border-white/10 bg-black/30 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-emerald-500/50"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <FilterInput
          label="Min Win %"
          value={minWinRate}
          onChange={onMinWinRateChange}
          placeholder="0"
        />
        <FilterInput
          label="Min Games"
          value={minGames}
          onChange={onMinGamesChange}
          placeholder="0"
        />
        <FilterSelect
          label="Show"
          value={String(limit)}
          onChange={(v) => onLimitChange(Number(v))}
          options={[
            { value: '100', label: 'Top 100' },
            { value: '500', label: 'Top 500' },
          ]}
        />
      </div>
    </div>
  );
}

function FilterInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
        {label}
      </span>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500/50"
      />
    </label>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500/50"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
