'use client';

import type { ImprovementPlan } from '@coachcore/shared';
import { GlassCard, SectionTitle } from './ui';

export function ImprovementPlanPanel({ plan }: { plan: ImprovementPlan }) {
  const goals = [
    { key: 'Today', goal: plan.today },
    { key: 'This week', goal: plan.thisWeek },
    { key: 'Next 10 matches', goal: plan.nextTenMatches },
    { key: 'Long-term', goal: plan.longTerm },
  ].filter((g) => g.goal);

  return (
    <GlassCard className="p-4">
      <SectionTitle title="Improvement plan" subtitle="Personalized roadmap from this VOD" />
      <div className="grid gap-3 md:grid-cols-2">
        {goals.map(({ key, goal }) =>
          goal ? (
            <div key={key} className="rounded-xl border border-white/10 bg-black/25 p-3">
              <p className="text-[10px] uppercase tracking-wider text-amber-200/80">{key}</p>
              <p className="mt-1 font-medium text-white">{goal.title}</p>
              <p className="mt-1 text-sm text-zinc-400">{goal.reason}</p>
              <p className="mt-2 text-xs text-emerald-300/90">{goal.expectedImpact}</p>
              <p className="mt-1 text-[11px] text-zinc-500">
                {goal.difficulty} · {goal.progressHint}
              </p>
            </div>
          ) : null
        )}
      </div>
      {plan.practiceDrills.length > 0 && (
        <div className="mt-4">
          <p className="text-[10px] uppercase tracking-wider text-zinc-500">Drills</p>
          <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-zinc-300">
            {plan.practiceDrills.slice(0, 5).map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        </div>
      )}
    </GlassCard>
  );
}
