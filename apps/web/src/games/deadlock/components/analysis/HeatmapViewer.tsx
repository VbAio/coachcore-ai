'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import type { HeatmapData } from '@coachcore/shared';
import { MINIMAP_SRC, MIDTOWN_BOUNDS, worldToMapPercent } from '../vod-review/map-coords';
import { formatClock } from '../vod-review/format';
import { GlassCard, SectionTitle } from './ui';
import { cn } from '@/lib/utils';

const LAYERS: Array<{ id: HeatmapData['type']; label: string }> = [
  { id: 'movement', label: 'Movement' },
  { id: 'deaths', label: 'Deaths' },
  { id: 'kills', label: 'Kills' },
  { id: 'objective', label: 'Objectives' },
  { id: 'danger', label: 'Danger' },
  { id: 'safe_zones', label: 'Safe' },
  { id: 'farming', label: 'Farm' },
  { id: 'rotations', label: 'Rotations' },
];

interface Props {
  heatmaps: HeatmapData[];
  onJump?: (t: number) => void;
  estimated?: boolean;
}

export function HeatmapViewer({ heatmaps, onJump, estimated }: Props) {
  const [layer, setLayer] = useState<HeatmapData['type']>('deaths');
  const active = heatmaps.find((h) => h.type === layer) ?? heatmaps[0];

  const points = useMemo(() => {
    if (!active?.points?.length) return [];
    return active.points.slice(0, 500).map((p) => {
      const { cx, cy } = worldToMapPercent(p.x, p.y, MIDTOWN_BOUNDS);
      return { ...p, cx, cy };
    });
  }, [active]);

  return (
    <GlassCard className="p-4">
      <SectionTitle
        title="Interactive heatmaps"
        subtitle={estimated ? 'Estimated / sparse position data' : 'Hover points for timestamps'}
      />
      <div className="mb-3 flex flex-wrap gap-1.5">
        {LAYERS.map((l) => (
          <button
            key={l.id}
            type="button"
            onClick={() => setLayer(l.id)}
            className={cn(
              'rounded-full border px-2.5 py-1 text-[11px] transition',
              layer === l.id
                ? 'border-amber-400/50 bg-amber-500/20 text-amber-100'
                : 'border-white/10 text-zinc-400 hover:text-zinc-200'
            )}
          >
            {l.label}
          </button>
        ))}
      </div>
      <div className="relative mx-auto aspect-square max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#0a0e0c]">
        <Image src={MINIMAP_SRC} alt="Map" fill className="object-contain opacity-90" unoptimized />
        <div className="absolute inset-0">
          {points.map((p, i) => (
            <button
              key={i}
              type="button"
              title={p.t != null ? `${p.label ?? layer} @ ${formatClock(p.t)}` : layer}
              onClick={() => p.t != null && onJump?.(p.t)}
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full opacity-80 transition hover:scale-125 hover:opacity-100"
              style={{
                left: `${p.cx}%`,
                top: `${p.cy}%`,
                width: 6 + Math.min(10, p.weight * 2),
                height: 6 + Math.min(10, p.weight * 2),
                background:
                  layer === 'deaths' || layer === 'danger'
                    ? '#f43f5e'
                    : layer === 'kills'
                      ? '#34d399'
                      : layer === 'objective'
                        ? '#38bdf8'
                        : '#fbbf24',
                boxShadow: '0 0 8px rgba(0,0,0,0.5)',
              }}
            />
          ))}
        </div>
        {!points.length && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-xs text-zinc-300">
            No points for this layer
          </div>
        )}
      </div>
    </GlassCard>
  );
}
