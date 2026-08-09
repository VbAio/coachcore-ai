'use client';

import { useMemo, useRef, useEffect } from 'react';
import type { RlCoachInsight, RlMatchTimeline } from '@clutchcore/shared';
import { RlGlass, RlSectionTitle, formatClock } from './ui';
import { cn } from '@/lib/utils';

export interface RlTimelineRow {
  id: string;
  t: number;
  label: string;
  kind: string;
  insight?: RlCoachInsight;
  actorId?: string;
}

interface Props {
  rows: RlTimelineRow[];
  selectedId: string | null;
  t: number;
  onSelect: (row: RlTimelineRow) => void;
  timeline: RlMatchTimeline | null;
}

export function RlTimeline({ rows, selectedId, t, onSelect, timeline }: Props) {
  const listRef = useRef<HTMLDivElement>(null);
  const sorted = useMemo(() => [...rows].sort((a, b) => a.t - b.t), [rows]);

  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-row="${selectedId}"]`);
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [selectedId]);

  return (
    <RlGlass className="flex h-full min-h-[320px] flex-col p-4">
      <RlSectionTitle
        title="Timeline"
        subtitle={timeline ? `${timeline.events.length} events` : 'Insight events'}
      />
      <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-black/40">
        <div
          className="h-full bg-gradient-to-r from-sky-500 to-orange-500 transition-[width]"
          style={{
            width: `${timeline ? Math.min(100, (t / Math.max(1, timeline.durationSeconds)) * 100) : 0}%`,
          }}
        />
      </div>
      <div ref={listRef} className="min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
        {sorted.map((row) => {
          const severity = row.insight?.severity;
          return (
            <button
              key={row.id}
              type="button"
              data-row={row.id}
              onClick={() => onSelect(row)}
              className={cn(
                'flex w-full items-start gap-3 rounded-xl px-3 py-2 text-left transition',
                selectedId === row.id
                  ? 'bg-sky-500/20 ring-1 ring-sky-400/40'
                  : 'hover:bg-white/5'
              )}
            >
              <span className="w-14 shrink-0 font-mono text-xs text-zinc-500">
                {formatClock(row.t)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm text-white">{row.label}</span>
                {row.insight && (
                  <span className="mt-0.5 block truncate text-[11px] text-zinc-500">
                    {row.insight.category} · {severity}
                    {row.insight.winProbabilityDelta != null &&
                      ` · WP ${row.insight.winProbabilityDelta > 0 ? '+' : ''}${row.insight.winProbabilityDelta}%`}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </RlGlass>
  );
}
