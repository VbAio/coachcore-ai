'use client';

import type { AiInsights } from '@coachcore/shared';
import { GlassCard, SectionTitle } from './ui';

export function InsightPanel({ insights }: { insights: AiInsights }) {
  return (
    <GlassCard className="p-4">
      <SectionTitle title="AI insights" subtitle="Evidence-weighted narrative from this match" />
      <div className="grid gap-3 md:grid-cols-2">
        <List title="Biggest strengths" items={insights.biggestStrengths} tone="good" />
        <List title="Most costly mistakes" items={insights.mostCostlyMistakes} tone="bad" />
        <List title="Hidden patterns" items={insights.hiddenPatterns} />
        <List title="Recurring habits" items={insights.recurringHabits} />
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Note label="Highest impact improvement" body={insights.highestImpactImprovement} />
        <Note label="Biggest lost opportunity" body={insights.biggestLostOpportunity} />
        <Note label="Risk assessment" body={insights.riskAssessment} />
        <Note label="Confidence summary" body={insights.confidenceSummary} />
      </div>
    </GlassCard>
  );
}

function List({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone?: 'good' | 'bad';
}) {
  return (
    <div
      className={`rounded-xl border p-3 ${
        tone === 'good'
          ? 'border-emerald-500/20 bg-emerald-500/5'
          : tone === 'bad'
            ? 'border-rose-500/20 bg-rose-500/5'
            : 'border-white/10 bg-black/20'
      }`}
    >
      <p className="text-[10px] uppercase tracking-wider text-zinc-500">{title}</p>
      <ul className="mt-2 space-y-1.5 text-sm text-zinc-200">
        {(items.length ? items : ['—']).map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function Note({ label, body }: { label: string; body: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
      <p className="text-[10px] uppercase tracking-wider text-zinc-500">{label}</p>
      <p className="mt-1 text-sm text-zinc-200">{body}</p>
    </div>
  );
}
