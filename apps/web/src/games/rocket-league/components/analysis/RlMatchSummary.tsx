'use client';

import type { RlMatchSummaryStats } from '@clutchcore/shared';
import { RlGlass, RlSectionTitle } from './ui';
import { RlPerformanceScore } from './RlPerformanceScore';

export function RlMatchSummary({ summary }: { summary: RlMatchSummaryStats }) {
  const kpis = [
    { label: 'Goals', value: summary.goals },
    { label: 'Assists', value: summary.assists },
    { label: 'Saves', value: summary.saves },
    { label: 'Shots', value: summary.shots },
    { label: 'Demos', value: summary.demos },
    { label: 'Boost Eff.', value: `${summary.boostEfficiency}%` },
  ];

  return (
    <RlGlass className="p-5">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div>
          <RlSectionTitle title="Match Summary" subtitle={summary.playlist.replace(/_/g, ' ')} />
          <p className="text-2xl font-bold text-white">
            {summary.currentRank}{' '}
            <span className="text-base font-normal text-zinc-400">
              → est. {summary.estimatedRank}
            </span>
          </p>
          <p className="mt-2 max-w-xl text-sm text-zinc-400">
            Strength: <span className="text-emerald-300">{summary.biggestStrength}</span>
            <br />
            Focus: <span className="text-orange-300">{summary.biggestWeakness}</span>
          </p>
        </div>
        <RlPerformanceScore grade={summary.letterGrade} score={summary.overallScore} />
      </div>
      <div className="mt-5 grid grid-cols-3 gap-3 md:grid-cols-6">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-xl bg-black/25 px-3 py-2 text-center">
            <p className="text-lg font-semibold text-white">{k.value}</p>
            <p className="text-[10px] uppercase tracking-wider text-zinc-500">{k.label}</p>
          </div>
        ))}
      </div>
    </RlGlass>
  );
}
