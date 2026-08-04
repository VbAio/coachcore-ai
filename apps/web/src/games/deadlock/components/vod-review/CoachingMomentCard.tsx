'use client';

import { ChevronDown, Info } from 'lucide-react';
import { useState } from 'react';
import type { CoachInsight } from '@coachcore/shared';
import { cn } from '@/lib/utils';
import { formatClock } from './format';

interface Props {
  insight: CoachInsight | null;
  emptyHint?: string;
}

export function CoachingMomentCard({ insight, emptyHint }: Props) {
  const [open, setOpen] = useState(true);

  if (!insight) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-4 text-sm text-zinc-500">
        {emptyHint ?? 'Select a timeline moment for coaching detail.'}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/80 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start justify-between gap-2 px-4 py-3 text-left hover:bg-zinc-900/50"
      >
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm text-amber-300">{formatClock(insight.timestamp)}</span>
            <span className="text-[10px] uppercase tracking-wide text-zinc-500">
              {insight.severity} · {insight.severity}
            </span>
            {insight.isEstimate && (
              <span className="inline-flex items-center gap-1 rounded bg-yellow-500/15 px-1.5 py-0.5 text-[10px] text-yellow-300">
                <Info className="h-3 w-3" /> Estimate
              </span>
            )}
            {insight.confidence != null && (
              <span className="text-[10px] text-zinc-500">Conf. {insight.confidence}%</span>
            )}
          </div>
          <h3 className="mt-1 text-base font-semibold text-white">{insight.title}</h3>
        </div>
        <ChevronDown
          className={cn('h-4 w-4 shrink-0 text-zinc-500 transition', open && 'rotate-180')}
        />
      </button>
      {open && (
        <div className="space-y-3 border-t border-zinc-800/80 px-4 py-3 text-sm">
          <Section label="What happened" body={insight.whatHappened} />
          <Section label="Why" body={insight.whyItHappened} />
          <Section label="Impact" body={insight.whyBadOrGood} />
          <Section label="Recommended play" body={insight.alternativePlay} tone="good" />
          <Section label="How to improve" body={insight.howToImprove} />
          {insight.expectedOutcome && (
            <Section label="Expected result" body={insight.expectedOutcome} />
          )}
          {insight.impactEstimate && (
            <div className="rounded-lg bg-zinc-900/80 px-3 py-2 text-xs text-zinc-400">
              Impact estimate: {insight.impactEstimate.label}
              {insight.impactEstimate.winProbabilityDelta != null && (
                <>
                  {' '}
                  · win prob{' '}
                  {insight.impactEstimate.winProbabilityDelta > 0 ? '+' : ''}
                  {Math.round(insight.impactEstimate.winProbabilityDelta * 100)}%
                </>
              )}
              {insight.impactEstimate.mmrDelta != null && (
                <>
                  {' '}
                  · MMR {insight.impactEstimate.mmrDelta > 0 ? '+' : ''}
                  {insight.impactEstimate.mmrDelta}
                </>
              )}
              <span className="ml-1 text-yellow-500/80">(estimate)</span>
            </div>
          )}
          {insight.drills?.length > 0 && (
            <div>
              <div className="mb-1 text-[11px] uppercase tracking-wide text-zinc-500">Drills</div>
              <ul className="space-y-1">
                {insight.drills.map((d, i) => (
                  <li key={i} className="text-xs text-zinc-400">
                    · {d}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {insight.relatedEventIds && insight.relatedEventIds.length > 0 && (
            <p className="text-[10px] text-zinc-600">
              Evidence: {insight.relatedEventIds.slice(0, 4).join(', ')}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function Section({
  label,
  body,
  tone,
}: {
  label: string;
  body: string;
  tone?: 'good';
}) {
  if (!body) return null;
  return (
    <div>
      <div className="mb-0.5 text-[11px] uppercase tracking-wide text-zinc-500">{label}</div>
      <p className={cn('text-zinc-300 leading-relaxed', tone === 'good' && 'text-emerald-300/90')}>
        {body}
      </p>
    </div>
  );
}
