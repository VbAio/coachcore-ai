'use client';

import type { RlShotBreakdown } from '@coachcore/shared';
import { RlGlass, RlSectionTitle, formatClock } from './ui';

export function RlShotAnalysis({ shots }: { shots: RlShotBreakdown[] }) {
  return (
    <RlGlass className="p-4">
      <RlSectionTitle title="Shots" subtitle={`${shots.length} attempts`} />
      {!shots.length ? (
        <p className="text-sm text-zinc-500">No shot breakdown available.</p>
      ) : (
        <div className="max-h-64 space-y-2 overflow-y-auto">
          {shots.map((s) => (
            <div key={s.eventId} className="rounded-lg bg-black/25 px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm text-white">
                  {formatClock(s.timestamp)} · {s.placement}
                </p>
                <p className="text-xs text-sky-300">xG {s.xg.toFixed(2)}</p>
              </div>
              <p className="mt-1 text-[11px] text-zinc-500">
                Quality {s.shotQuality} · Power {s.power} · Angle {s.angle}
                {s.isEstimate ? ' · estimated' : ''}
              </p>
              {s.alternativeShot && (
                <p className="mt-1 text-xs text-orange-200/90">Alt: {s.alternativeShot}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </RlGlass>
  );
}
