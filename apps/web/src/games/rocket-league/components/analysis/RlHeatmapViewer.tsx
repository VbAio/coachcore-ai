'use client';

import { useMemo, useState } from 'react';
import type { RlHeatmapData } from '@clutchcore/shared';
import { RlGlass, RlSectionTitle } from './ui';
import { cn } from '@/lib/utils';

const FIELD_W = 8192;
const FIELD_H = 10240;

export function RlHeatmapViewer({ heatmaps }: { heatmaps: RlHeatmapData[] }) {
  const types = useMemo(() => heatmaps.map((h) => h.type), [heatmaps]);
  const [active, setActive] = useState(types[0] ?? 'movement');
  const layer = heatmaps.find((h) => h.type === active) ?? heatmaps[0];

  return (
    <RlGlass className="p-4">
      <RlSectionTitle title="Heatmaps" subtitle="Layer toggles" />
      <div className="mb-3 flex flex-wrap gap-1.5">
        {types.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setActive(type)}
            className={cn(
              'rounded-md px-2 py-1 text-[11px] capitalize',
              active === type
                ? 'bg-sky-500/30 text-sky-100'
                : 'bg-white/5 text-zinc-400 hover:bg-white/10'
            )}
          >
            {type.replace(/_/g, ' ')}
          </button>
        ))}
      </div>
      <div
        className="relative aspect-[4/5] w-full overflow-hidden rounded-xl border border-white/10 bg-[#0b1220]"
      >
        <div className="absolute inset-[6%] rounded-lg border border-white/10" />
        {layer?.points.map((p, i) => {
          const left = ((p.x + FIELD_W / 2) / FIELD_W) * 100;
          const top = (1 - (p.y + FIELD_H / 2) / FIELD_H) * 100;
          const size = 8 + Math.min(18, p.weight * 4);
          return (
            <div
              key={`${p.x}-${p.y}-${i}`}
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-400/50 blur-[1px]"
              style={{
                left: `${left}%`,
                top: `${top}%`,
                width: size,
                height: size,
                opacity: Math.min(0.9, 0.25 + p.weight * 0.15),
              }}
            />
          );
        })}
      </div>
    </RlGlass>
  );
}
