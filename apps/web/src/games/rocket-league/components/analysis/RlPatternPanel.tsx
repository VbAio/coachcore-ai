'use client';

import type { RlMistakePattern } from '@coachcore/shared';
import { RlGlass, RlSectionTitle } from './ui';

export function RlPatternPanel({
  patterns,
  onJump,
}: {
  patterns: RlMistakePattern[];
  onJump?: (timestamp: number, insightId?: string) => void;
}) {
  return (
    <RlGlass className="p-4">
      <RlSectionTitle title="Patterns" subtitle="Repeated habits" />
      <div className="space-y-3">
        {patterns.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onJump?.(p.timestamps[0] ?? 0, p.insightIds[0])}
            className="w-full rounded-xl bg-black/25 px-3 py-3 text-left transition hover:bg-black/40"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium text-white">{p.title}</p>
              <span className="text-xs text-orange-300">×{p.count}</span>
            </div>
            <p className="mt-1 text-xs text-zinc-400">{p.patternExplanation}</p>
            <p className="mt-2 text-[11px] text-sky-300/90">
              Drill: {p.practiceDrill.title} — {p.expectedImprovement}
            </p>
          </button>
        ))}
        {!patterns.length && <p className="text-sm text-zinc-500">No clustered patterns.</p>}
      </div>
    </RlGlass>
  );
}
