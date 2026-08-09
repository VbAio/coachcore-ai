'use client';

import { useVirtualizer } from '@tanstack/react-virtual';
import { useMemo, useRef } from 'react';
import type { CoachInsight } from '@clutchcore/shared';
import { cn } from '@/lib/utils';
import { formatClock } from '../vod-review/format';
import { GlassCard, SectionTitle } from './ui';

export interface AnalysisTimelineRow {
  id: string;
  timestamp: number;
  label: string;
  kind: string;
  insight?: CoachInsight;
  involvedPlayerIds?: string[];
  position?: { x: number; y: number };
}

interface Props {
  rows: AnalysisTimelineRow[];
  selectedId: string | null;
  t: number;
  onSelect: (row: AnalysisTimelineRow) => void;
}

export function AnalysisTimeline({ rows, selectedId, t, onSelect }: Props) {
  const parentRef = useRef<HTMLDivElement>(null);
  const sorted = useMemo(
    () => [...rows].sort((a, b) => a.timestamp - b.timestamp),
    [rows]
  );

  const virtualizer = useVirtualizer({
    count: sorted.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 64,
    overscan: 10,
  });

  return (
    <GlassCard className="flex h-full min-h-[420px] flex-col overflow-hidden">
      <div className="border-b border-white/10 px-4 py-3">
        <SectionTitle title="Match timeline" subtitle="Click any moment for coaching" />
      </div>
      <div ref={parentRef} className="flex-1 overflow-auto px-2 py-2">
        <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
          {virtualizer.getVirtualItems().map((v) => {
            const row = sorted[v.index];
            const active = selectedId === row.id;
            const near = Math.abs(row.timestamp - t) < 2;
            const sev = row.insight?.severity;
            return (
              <button
                key={row.id}
                type="button"
                onClick={() => onSelect(row)}
                className={cn(
                  'absolute left-0 right-0 mx-1 flex items-start gap-3 rounded-xl border px-3 py-2 text-left transition-all duration-300 ease-out-soft',
                  active
                    ? 'scale-[1.01] border-amber-400/40 bg-amber-500/15 shadow-[0_0_24px_rgba(251,191,36,0.12)]'
                    : near
                      ? 'border-white/15 bg-white/[0.06]'
                      : 'border-transparent hover:border-white/10 hover:bg-white/[0.04]'
                )}
                style={{
                  height: v.size - 4,
                  transform: `translateY(${v.start}px)`,
                }}
              >
                <span className="w-12 shrink-0 font-mono text-xs text-amber-200/90">
                  {formatClock(row.timestamp)}
                </span>
                <span
                  className={cn(
                    'mt-1 h-2 w-2 shrink-0 rounded-full',
                    row.kind === 'excellent' || row.insight?.polarity === 'excellent'
                      ? 'bg-emerald-400'
                      : row.kind === 'mistake' || row.insight?.polarity === 'mistake'
                        ? sev === 'critical' || sev === 'game_losing'
                          ? 'bg-rose-500'
                          : 'bg-orange-400'
                        : 'bg-sky-400'
                  )}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">{row.label}</p>
                  <p className="truncate text-[11px] text-zinc-500">
                    {row.insight?.category?.replace(/_/g, ' ') ?? row.kind}
                    {row.insight?.confidence != null ? ` · ${row.insight.confidence}% conf` : ''}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </GlassCard>
  );
}
