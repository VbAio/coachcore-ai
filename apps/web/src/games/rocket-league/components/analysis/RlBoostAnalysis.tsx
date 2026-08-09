'use client';

import type { RlBoostAnalysis as Boost } from '@clutchcore/shared';
import { RlGlass, RlSectionTitle } from './ui';

export function RlBoostAnalysis({ data }: { data: Boost }) {
  return (
    <RlGlass className="p-4">
      <RlSectionTitle
        title="Boost"
        subtitle={data.isEstimate ? 'Estimated from fixture / partial extract' : 'From replay'}
      />
      <div className="grid grid-cols-2 gap-3 text-sm">
        <Stat label="Wasted" value={`${data.boostWasted}`} />
        <Stat label="Big pads" value={data.bigPadPickups} />
        <Stat label="Small pads" value={data.smallPadPickups} />
        <Stat label="Starvation" value={data.starvationEvents} />
        <Stat label="Big-pad dependency" value={`${data.bigPadDependency}%`} />
        <Stat label="Avg on aerial" value={data.avgBoostOnAerial} />
      </div>
      <ul className="mt-3 space-y-1">
        {data.pathNotes.map((n) => (
          <li key={n} className="text-xs text-zinc-400">
            · {n}
          </li>
        ))}
      </ul>
    </RlGlass>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg bg-black/25 px-3 py-2">
      <p className="text-base font-semibold text-white">{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-zinc-500">{label}</p>
    </div>
  );
}
