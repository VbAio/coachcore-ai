'use client';

import type { MistakePattern } from '@coachcore/shared';
import { formatClock } from '../vod-review/format';
import { GlassCard, SectionTitle } from './ui';

interface Props {
  patterns: MistakePattern[];
  onJump: (t: number) => void;
}

export function PatternPanel({ patterns, onJump }: Props) {
  if (!patterns.length) {
    return (
      <GlassCard className="p-4">
        <SectionTitle title="Mistake patterns" subtitle="No repeated patterns detected" />
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-4">
      <SectionTitle
        title="Mistake patterns"
        subtitle="Repeated failure modes grouped across the match"
      />
      <div className="space-y-3">
        {patterns.slice(0, 6).map((p) => (
          <div
            key={p.id}
            className="rounded-xl border border-white/10 bg-black/25 p-3 transition hover:border-rose-400/30"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium text-white">{p.title}</p>
                <p className="mt-1 text-xs text-zinc-500">
                  {p.count}× · priority {p.priorityScore} · {p.category.replace(/_/g, ' ')}
                </p>
              </div>
              <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] uppercase text-rose-200">
                {p.severity}
              </span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-zinc-300">{p.patternExplanation}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {p.timestamps.slice(0, 8).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => onJump(t)}
                  className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-0.5 font-mono text-[11px] text-amber-200 hover:border-amber-400/40"
                >
                  {formatClock(t)}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-emerald-300/90">{p.expectedImprovement}</p>
            <p className="mt-1 text-xs text-zinc-500">
              Drill: {p.practiceDrill.title} ({p.practiceDrill.durationMinutes}m)
            </p>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
