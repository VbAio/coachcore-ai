'use client';

import type { RlImprovementPlan as Plan, RlPlanStep } from '@clutchcore/shared';
import { RlGlass, RlSectionTitle } from './ui';

export function RlImprovementPlan({ plan }: { plan: Plan }) {
  const steps: Array<{ label: string; step: RlPlanStep }> = [
    { label: 'Today', step: plan.today },
    { label: 'Next 5 matches', step: plan.nextFiveMatches },
    { label: 'Next 20 matches', step: plan.nextTwentyMatches },
    { label: 'Long-term', step: plan.longTerm },
  ];

  return (
    <RlGlass className="p-4">
      <RlSectionTitle title="Improvement Plan" subtitle="Impact-ranked roadmap" />
      <div className="grid gap-3 md:grid-cols-2">
        {steps.map(({ label, step }) => (
          <div key={label} className="rounded-xl border border-white/5 bg-black/25 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-sky-300">
              {label}
            </p>
            <p className="mt-1 text-sm font-medium text-white">{step.title}</p>
            <p className="mt-1 text-xs text-zinc-400">{step.reason}</p>
            <p className="mt-2 text-xs text-emerald-300/90">{step.expectedImpact}</p>
            <ul className="mt-2 space-y-1">
              {step.drills.map((d) => (
                <li key={d} className="text-[11px] text-zinc-500">
                  · {d}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-[10px] text-zinc-600">
              {step.difficulty} · {step.priority}
              {step.estimatedMmrGain != null ? ` · ~${step.estimatedMmrGain} MMR` : ''}
            </p>
          </div>
        ))}
      </div>
    </RlGlass>
  );
}
