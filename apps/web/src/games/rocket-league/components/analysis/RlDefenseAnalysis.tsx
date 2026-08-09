'use client';

import type { RlDefenseBreakdown } from '@clutchcore/shared';
import { RlGlass, RlSectionTitle } from './ui';

export function RlDefenseAnalysis({ data }: { data: RlDefenseBreakdown }) {
  const rows = [
    ['Goal-line saves', data.goalLineSaves],
    ['Shadow defense', data.shadowDefenseScore],
    ['Backboard', data.backboardDefenseScore],
    ['Challenge timing', data.challengeTimingScore],
    ['Save quality', data.saveQuality],
    ['Clear quality', data.clearQuality],
  ] as const;

  return (
    <RlGlass className="p-4">
      <RlSectionTitle title="Defense" subtitle={data.isEstimate ? 'Estimated' : undefined} />
      <div className="grid grid-cols-2 gap-2">
        {rows.map(([label, value]) => (
          <div key={label} className="rounded-lg bg-black/25 px-3 py-2">
            <p className="text-base font-semibold text-white">{value}</p>
            <p className="text-[10px] uppercase tracking-wider text-zinc-500">{label}</p>
          </div>
        ))}
      </div>
      <ul className="mt-3 space-y-1">
        {data.notes.map((n) => (
          <li key={n} className="text-xs text-zinc-400">
            · {n}
          </li>
        ))}
      </ul>
    </RlGlass>
  );
}
