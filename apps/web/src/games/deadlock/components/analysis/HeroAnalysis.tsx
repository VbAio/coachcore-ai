'use client';

import type { CoachInsight, CoachingReport } from '@coachcore/shared';
import { GlassCard, SectionTitle } from './ui';

export function HeroAnalysis({
  report,
  onJump,
}: {
  report: CoachingReport;
  onJump: (insight: CoachInsight) => void;
}) {
  const hero = report.matchSummary?.hero ?? 'Hero';
  const items = report.heroSpecificCoaching.slice(0, 6);

  return (
    <GlassCard className="p-4">
      <SectionTitle
        title="Hero-specific analysis"
        subtitle={`${hero} — advice tied to this match’s evidence`}
      />
      <div className="space-y-3">
        {items.length === 0 ? (
          <p className="text-sm text-zinc-500">No hero-specific notes for this report.</p>
        ) : (
          items.map((insight, i) => (
            <button
              key={insight.id ?? i}
              type="button"
              onClick={() => onJump(insight)}
              className="w-full rounded-xl border border-white/10 bg-black/25 p-3 text-left transition hover:border-sky-400/30"
            >
              <p className="font-medium text-white">{insight.title}</p>
              {insight.heroSpecificAdvice && (
                <p className="mt-1 text-sm text-sky-200/90">{insight.heroSpecificAdvice}</p>
              )}
              <p className="mt-1 line-clamp-2 text-sm text-zinc-400">{insight.whatHappened}</p>
            </button>
          ))
        )}
      </div>
    </GlassCard>
  );
}
