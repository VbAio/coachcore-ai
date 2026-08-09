'use client';

import type { RlSkillAxisMeta, RlSkillScores } from '@clutchcore/shared';
import { RlGlass, RlSectionTitle } from './ui';

export function RlMechanicsPanel({
  scores,
  axes,
}: {
  scores: RlSkillScores;
  axes: RlSkillAxisMeta[];
}) {
  const mechAxes = axes.filter((a) =>
    ['mechanical', 'aerial', 'recovery', 'kickoff', 'consistency'].includes(a.key)
  );

  return (
    <RlGlass className="p-4">
      <RlSectionTitle title="Mechanics" subtitle={`Overall mechanical ${scores.mechanical}`} />
      <div className="space-y-3">
        {mechAxes.map((a) => (
          <div key={a.key}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-zinc-300">{a.label}</span>
              <span className="text-zinc-500">
                {a.grade} · {a.score}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-black/40">
              <div
                className="h-full rounded-full bg-gradient-to-r from-sky-500 to-orange-500"
                style={{ width: `${a.score}%` }}
              />
            </div>
            <p className="mt-1 text-[11px] text-zinc-500">{a.practiceRecommendation}</p>
          </div>
        ))}
      </div>
    </RlGlass>
  );
}
