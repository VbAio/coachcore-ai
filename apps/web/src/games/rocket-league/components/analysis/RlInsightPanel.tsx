'use client';

import type { RlAiInsights } from '@coachcore/shared';
import { RlGlass, RlSectionTitle } from './ui';

export function RlInsightPanel({ insights }: { insights: RlAiInsights }) {
  return (
    <RlGlass className="p-4">
      <RlSectionTitle title="AI Insights" subtitle={insights.confidenceSummary} />
      <div className="grid gap-3 md:grid-cols-2">
        <List title="Strengths" items={insights.biggestStrengths} tone="emerald" />
        <List title="Costly mistakes" items={insights.mostCostlyMistakes} tone="orange" />
        <List title="Hidden patterns" items={insights.hiddenPatterns} tone="sky" />
        <List title="Habits" items={insights.recurringHabits} tone="zinc" />
      </div>
      <div className="mt-3 space-y-1 text-xs text-zinc-400">
        <p>
          <span className="text-sky-300">Highest impact:</span> {insights.highestImpactImprovement}
        </p>
        <p>
          <span className="text-orange-300">Lost opportunity:</span> {insights.biggestLostOpportunity}
        </p>
        <p>
          <span className="text-zinc-300">Risk:</span> {insights.riskAssessment}
        </p>
      </div>
    </RlGlass>
  );
}

function List({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: 'emerald' | 'orange' | 'sky' | 'zinc';
}) {
  const color =
    tone === 'emerald'
      ? 'text-emerald-300'
      : tone === 'orange'
        ? 'text-orange-300'
        : tone === 'sky'
          ? 'text-sky-300'
          : 'text-zinc-300';
  return (
    <div>
      <p className={`text-[11px] font-semibold uppercase tracking-wider ${color}`}>{title}</p>
      <ul className="mt-1 space-y-1">
        {items.map((i) => (
          <li key={i} className="text-xs text-zinc-400">
            · {i}
          </li>
        ))}
      </ul>
    </div>
  );
}
