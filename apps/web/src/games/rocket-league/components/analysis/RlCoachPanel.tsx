'use client';

import type { RlCoachInsight } from '@coachcore/shared';
import { RlGlass, RlSectionTitle, formatClock } from './ui';

export function RlCoachPanel({ insight }: { insight: RlCoachInsight | null }) {
  if (!insight) {
    return (
      <RlGlass className="p-5">
        <RlSectionTitle title="Coach" subtitle="Select a timeline event" />
        <p className="text-sm text-zinc-500">
          Click an event to open the 7-question SSL breakdown.
        </p>
      </RlGlass>
    );
  }

  const blocks = [
    { q: 'What happened?', a: insight.whatHappened },
    { q: 'Why did it happen?', a: insight.whyItHappened },
    { q: 'Why was it good/bad?', a: insight.whyBadOrGood },
    { q: 'What should you do instead?', a: insight.alternativePlay },
    { q: 'Expected outcome?', a: insight.expectedOutcome },
    { q: 'How to improve?', a: insight.howToImprove },
    { q: 'Mechanics or decision?', a: insight.mechanicsOrDecision },
  ];

  return (
    <RlGlass className="p-5">
      <RlSectionTitle title="Coach Panel" subtitle={`${formatClock(insight.timestamp)} · ${insight.eventType}`} />
      <h3 className="mb-1 text-lg font-semibold text-white">{insight.title}</h3>
      <div className="mb-4 flex flex-wrap gap-2 text-[11px]">
        <span className="rounded-md bg-white/10 px-2 py-0.5 text-zinc-300">{insight.category}</span>
        <span className="rounded-md bg-orange-500/20 px-2 py-0.5 text-orange-200">
          {insight.severity}
        </span>
        <span className="rounded-md bg-sky-500/20 px-2 py-0.5 text-sky-200">
          conf {insight.confidence}%
        </span>
        {insight.winProbabilityDelta != null && (
          <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 text-emerald-200">
            WP {insight.winProbabilityDelta > 0 ? '+' : ''}
            {insight.winProbabilityDelta}%
          </span>
        )}
        {insight.isEstimate && (
          <span className="rounded-md bg-amber-500/20 px-2 py-0.5 text-amber-200">estimated</span>
        )}
      </div>
      <div className="space-y-3">
        {blocks.map((b) => (
          <div key={b.q}>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-sky-300/80">
              {b.q}
            </p>
            <p className="mt-0.5 text-sm text-zinc-300">{b.a}</p>
          </div>
        ))}
      </div>
      {insight.practiceDrill && (
        <div className="mt-4 rounded-xl border border-orange-500/30 bg-orange-500/10 p-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-orange-200">
            Practice drill
          </p>
          <p className="mt-1 text-sm font-medium text-white">{insight.practiceDrill.title}</p>
          <p className="mt-1 text-xs text-zinc-400">{insight.practiceDrill.description}</p>
          <p className="mt-2 text-[11px] text-zinc-500">
            {insight.practiceDrill.durationMinutes} min · {insight.practiceDrill.difficulty} ·{' '}
            {insight.practiceDrill.successMetric}
          </p>
        </div>
      )}
      {insight.proExample && (
        <p className="mt-3 text-xs italic text-zinc-500">Pro example: {insight.proExample}</p>
      )}
    </RlGlass>
  );
}
