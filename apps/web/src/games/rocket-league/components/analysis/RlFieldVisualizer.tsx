'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { RlCoachInsight, RlMatchTimeline, RlVec3 } from '@coachcore/shared';
import { RlGlass, RlSectionTitle } from './ui';

/** RL field approx: X ±4096, Y ±5120 (goals on Y) */
const FIELD_W = 8192;
const FIELD_H = 10240;

function toPct(pos: RlVec3 | undefined | null): { left: string; top: string } | null {
  if (!pos) return null;
  const left = ((pos.x + FIELD_W / 2) / FIELD_W) * 100;
  const top = (1 - (pos.y + FIELD_H / 2) / FIELD_H) * 100;
  return {
    left: `${Math.max(2, Math.min(98, left))}%`,
    top: `${Math.max(2, Math.min(98, top))}%`,
  };
}

function sampleAt<T extends { t: number }>(track: T[], t: number): T | null {
  if (!track.length) return null;
  let best = track[0];
  let bestD = Math.abs(best.t - t);
  for (const s of track) {
    const d = Math.abs(s.t - t);
    if (d < bestD) {
      best = s;
      bestD = d;
    }
    if (s.t > t + 1) break;
  }
  return best;
}

interface Props {
  timeline: RlMatchTimeline | null;
  t: number;
  highlightPlayerIds: string[];
  insight: RlCoachInsight | null;
}

export function RlFieldVisualizer({ timeline, t, highlightPlayerIds, insight }: Props) {
  const cars = useMemo(() => {
    if (!timeline) return [];
    return timeline.players.map((p) => {
      const samples = timeline.playerTracks.filter((s) => s.playerId === p.id);
      const sample = sampleAt(samples, t);
      return {
        ...p,
        x: sample?.x ?? 0,
        y: sample?.y ?? (p.team === 'blue' ? -2000 : 2000),
        boost: sample?.boost ?? 33,
        highlighted: highlightPlayerIds.includes(p.id) || p.isSubject,
      };
    });
  }, [timeline, t, highlightPlayerIds]);

  const ball = useMemo(() => {
    if (!timeline?.ballTrack?.length) return { x: 0, y: 0 };
    const s = sampleAt(timeline.ballTrack, t);
    return { x: s?.x ?? 0, y: s?.y ?? 0 };
  }, [timeline, t]);

  const recommended = toPct(insight?.recommendedPosition ?? null);
  const marker = toPct(insight?.position ?? null);

  return (
    <RlGlass className="overflow-hidden p-4">
      <RlSectionTitle title="Field" subtitle="Space / J L / , . — scrub the clock" />
      <div
        className="relative mx-auto aspect-[4/5] w-full max-w-md overflow-hidden rounded-xl border border-white/10"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(56,189,248,0.12), transparent 55%), linear-gradient(180deg, #0b1220 0%, #102033 45%, #1a120c 100%)',
        }}
      >
        {/* field lines */}
        <div className="absolute inset-[6%] rounded-lg border border-white/15">
          <div className="absolute left-0 right-0 top-1/2 h-px bg-white/20" />
          <div className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/15" />
          <div className="absolute left-1/2 top-0 h-8 w-24 -translate-x-1/2 -translate-y-1/2 rounded-b-md border border-orange-400/40 bg-orange-500/10" />
          <div className="absolute bottom-0 left-1/2 h-8 w-24 -translate-x-1/2 translate-y-1/2 rounded-t-md border border-sky-400/40 bg-sky-500/10" />
        </div>

        {cars.map((car) => {
          const pct = toPct({ x: car.x, y: car.y, z: 0 });
          if (!pct) return null;
          return (
            <motion.div
              key={car.id}
              className="absolute h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-sm"
              style={{
                left: pct.left,
                top: pct.top,
                background: car.team === 'blue' ? '#38bdf8' : '#f97316',
                boxShadow: car.highlighted
                  ? '0 0 12px rgba(255,255,255,0.55)'
                  : '0 0 0 transparent',
                zIndex: car.highlighted ? 5 : 2,
              }}
              animate={{ scale: car.highlighted ? 1.35 : 1 }}
              title={`${car.name} · boost ${Math.round(car.boost)}`}
            />
          );
        })}

        <motion.div
          className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.7)]"
          style={{
            left: toPct({ ...ball, z: 0 })?.left,
            top: toPct({ ...ball, z: 0 })?.top,
            zIndex: 6,
          }}
        />

        {marker && (
          <div
            className="absolute h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-rose-400/80"
            style={{ left: marker.left, top: marker.top, zIndex: 4 }}
          />
        )}
        {recommended && (
          <div
            className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
            style={{ left: recommended.left, top: recommended.top }}
          >
            <div className="h-0 w-0 border-l-[6px] border-r-[6px] border-b-[10px] border-l-transparent border-r-transparent border-b-emerald-400 drop-shadow" />
            <p className="mt-0.5 whitespace-nowrap text-[9px] text-emerald-300">Recommended</p>
          </div>
        )}
      </div>
    </RlGlass>
  );
}
