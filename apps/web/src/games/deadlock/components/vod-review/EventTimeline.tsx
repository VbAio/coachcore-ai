'use client';

import { cn } from '@/lib/utils';
import { formatClock } from './format';
import type { TimelineFilter, TimelineRow } from './types';

const FILTERS: { id: TimelineFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'mistake', label: 'Mistakes' },
  { id: 'excellent', label: 'Excellent' },
  { id: 'death', label: 'Deaths' },
  { id: 'kill', label: 'Kills' },
  { id: 'assist', label: 'Assists' },
  { id: 'teamfight', label: 'Fights' },
  { id: 'objective', label: 'Objectives' },
  { id: 'item_purchase', label: 'Items' },
];

interface Props {
  rows: TimelineRow[];
  filter: TimelineFilter;
  selectedId: string | null;
  onFilter: (f: TimelineFilter) => void;
  onSelect: (row: TimelineRow) => void;
}

function kindColor(kind: TimelineFilter, polarity?: TimelineRow['polarity']) {
  if (kind === 'mistake' || polarity === 'mistake') return 'border-l-rose-500';
  if (kind === 'excellent' || polarity === 'excellent') return 'border-l-emerald-500';
  if (kind === 'death') return 'border-l-rose-400';
  if (kind === 'kill') return 'border-l-emerald-400';
  if (kind === 'teamfight') return 'border-l-sky-400';
  if (kind === 'objective') return 'border-l-amber-400';
  if (kind === 'item_purchase') return 'border-l-violet-400';
  return 'border-l-zinc-600';
}

export function EventTimeline({ rows, filter, selectedId, onFilter, onSelect }: Props) {
  const filtered =
    filter === 'all'
      ? rows
      : rows.filter((r) => {
          if (filter === 'mistake') return r.kind === 'mistake' || r.polarity === 'mistake';
          if (filter === 'excellent') return r.kind === 'excellent' || r.polarity === 'excellent';
          return r.kind === filter;
        });

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-2 flex flex-wrap gap-1">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => onFilter(f.id)}
            className={cn(
              'rounded px-2 py-0.5 text-[11px] uppercase tracking-wide',
              filter === f.id
                ? 'bg-amber-500/20 text-amber-200'
                : 'bg-zinc-900 text-zinc-500 hover:text-zinc-300'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>
      <div className="min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
        {filtered.length === 0 && (
          <p className="px-2 py-6 text-center text-xs text-zinc-500">No events in this filter.</p>
        )}
        {filtered.map((row) => (
          <button
            key={row.id}
            type="button"
            onClick={() => onSelect(row)}
            className={cn(
              'w-full rounded-lg border border-zinc-800/80 border-l-4 bg-zinc-950/60 px-2.5 py-2 text-left transition',
              kindColor(row.kind, row.polarity),
              selectedId === row.id
                ? 'ring-1 ring-amber-400/50 bg-zinc-900'
                : 'hover:bg-zinc-900/80'
            )}
          >
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-amber-300/90">{formatClock(row.timestamp)}</span>
              {row.insight?.isEstimate && (
                <span className="text-[10px] uppercase text-yellow-500/80">est.</span>
              )}
            </div>
            <div className="mt-0.5 text-sm text-zinc-200 line-clamp-2">{row.label}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
