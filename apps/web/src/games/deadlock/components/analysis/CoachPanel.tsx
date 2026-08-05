'use client';

import { AnimatePresence, motion } from 'framer-motion';
import type { CoachInsight } from '@coachcore/shared';
import { formatClock } from '../vod-review/format';
import { GlassCard, SectionTitle } from './ui';
import { easeOutSoft } from '@/lib/motion';

interface Props {
  insight: CoachInsight | null;
  emptyHint?: string;
}

export function CoachPanel({ insight, emptyHint }: Props) {
  return (
    <GlassCard className="flex h-full min-h-[420px] flex-col overflow-hidden">
      <AnimatePresence mode="wait">
        {!insight ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-1 items-center justify-center p-6 text-center text-sm text-zinc-500"
          >
            {emptyHint ?? 'Select a timeline moment for a full coaching breakdown.'}
          </motion.div>
        ) : (
          <motion.div
            key={insight.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: easeOutSoft }}
            className="flex h-full min-h-[420px] flex-col"
          >
            <div className="border-b border-white/10 px-4 py-3">
              <SectionTitle title="Coaching breakdown" subtitle={formatClock(insight.timestamp)} />
              <h3 className="text-lg font-semibold text-white">{insight.title}</h3>
              <div className="mt-2 flex flex-wrap gap-2 text-[10px] uppercase tracking-wider">
                <Chip>{insight.severity}</Chip>
                <Chip>{insight.category.replace(/_/g, ' ')}</Chip>
                {insight.confidence != null && <Chip>{insight.confidence}% confidence</Chip>}
                {insight.difficulty != null && <Chip>Difficulty {insight.difficulty}/10</Chip>}
                {(() => {
                  const wp =
                    insight.winProbabilityDelta ?? insight.impactEstimate?.winProbabilityDelta;
                  if (wp == null) return null;
                  return (
                    <Chip tone={wp < 0 ? 'bad' : 'good'}>
                      WP {wp >= 0 ? '+' : ''}
                      {Math.round(wp * 100)}%
                    </Chip>
                  );
                })()}
                {insight.isEstimate && <Chip tone="warn">Estimated</Chip>}
              </div>
            </div>

            <div className="flex-1 space-y-4 overflow-auto px-4 py-4 text-sm">
              <Block title="What happened" body={insight.whatHappened} />
              <Block title="Why it happened" body={insight.whyItHappened} />
              <Block title="Why it was good or bad" body={insight.whyBadOrGood} />
              <Block title="What you should have done" body={insight.alternativePlay} tone="good" />
              <Block title="Expected outcome" body={insight.expectedOutcome} />
              <Block title="How to avoid this again" body={insight.howToImprove} />
              {insight.heroSpecificAdvice && (
                <Block title="Hero-specific advice" body={insight.heroSpecificAdvice} tone="accent" />
              )}
              {insight.proExample && <Block title="Pro example" body={insight.proExample} />}
              {insight.practiceDrill && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
                  <p className="text-[10px] uppercase tracking-wider text-amber-200/80">
                    Practice drill
                  </p>
                  <p className="mt-1 font-medium text-white">{insight.practiceDrill.title}</p>
                  <p className="mt-1 text-zinc-300">{insight.practiceDrill.description}</p>
                  <p className="mt-2 text-xs text-zinc-500">
                    {insight.practiceDrill.durationMinutes} min · {insight.practiceDrill.difficulty} ·{' '}
                    {insight.practiceDrill.successMetric}
                  </p>
                </div>
              )}
              {insight.drills?.length > 0 && !insight.practiceDrill && (
                <ul className="list-disc space-y-1 pl-4 text-zinc-300">
                  {insight.drills.map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </GlassCard>
  );
}

function Block({
  title,
  body,
  tone,
}: {
  title: string;
  body: string;
  tone?: 'good' | 'accent';
}) {
  return (
    <div>
      <p
        className={`text-[10px] uppercase tracking-wider ${
          tone === 'good'
            ? 'text-emerald-300/80'
            : tone === 'accent'
              ? 'text-sky-300/80'
              : 'text-zinc-500'
        }`}
      >
        {title}
      </p>
      <p className="mt-1 leading-relaxed text-zinc-200">{body}</p>
    </div>
  );
}

function Chip({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone?: 'good' | 'bad' | 'warn';
}) {
  const cls =
    tone === 'good'
      ? 'border-emerald-500/40 text-emerald-200'
      : tone === 'bad'
        ? 'border-rose-500/40 text-rose-200'
        : tone === 'warn'
          ? 'border-amber-500/40 text-amber-200'
          : 'border-white/15 text-zinc-300';
  return (
    <span className={`rounded-full border px-2 py-0.5 ${cls}`}>{children}</span>
  );
}
