'use client';

import { useMemo } from 'react';
import type { MatchTimeline } from '@coachcore/shared';
import { cn } from '@/lib/utils';

interface Props {
  timeline: MatchTimeline | null;
  t: number;
  highlightPlayerIds: string[];
  marker?: { x: number; y: number } | null;
  onSeekNear?: (t: number) => void;
}

function interpolate(
  samples: Array<{ t: number; x: number; y: number }>,
  time: number
): { x: number; y: number } | null {
  if (samples.length === 0) return null;
  if (time <= samples[0].t) return { x: samples[0].x, y: samples[0].y };
  if (time >= samples[samples.length - 1].t) {
    const last = samples[samples.length - 1];
    return { x: last.x, y: last.y };
  }
  for (let i = 1; i < samples.length; i++) {
    const a = samples[i - 1];
    const b = samples[i];
    if (time <= b.t) {
      const u = (time - a.t) / Math.max(0.001, b.t - a.t);
      return { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u };
    }
  }
  return null;
}

export function MatchMap({ timeline, t, highlightPlayerIds, marker }: Props) {
  const bounds = useMemo(() => {
    const pts: Array<{ x: number; y: number }> = [];
    for (const track of timeline?.tracks ?? []) {
      for (const s of track.samples) pts.push(s);
    }
    if (marker) pts.push(marker);
    if (pts.length === 0) return { minX: -2000, maxX: 2000, minY: -2000, maxY: 2000 };
    let minX = Infinity,
      maxX = -Infinity,
      minY = Infinity,
      maxY = -Infinity;
    for (const p of pts) {
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y);
      maxY = Math.max(maxY, p.y);
    }
    const pad = 400;
    return { minX: minX - pad, maxX: maxX + pad, minY: minY - pad, maxY: maxY + pad };
  }, [timeline, marker]);

  const w = bounds.maxX - bounds.minX || 1;
  const h = bounds.maxY - bounds.minY || 1;

  const project = (x: number, y: number) => ({
    cx: ((x - bounds.minX) / w) * 100,
    cy: 100 - ((y - bounds.minY) / h) * 100,
  });

  const players = timeline?.players ?? [];
  const subjectId = timeline?.subjectPlayerId;

  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-zinc-800 bg-[#0c1210]">
      <svg viewBox="0 0 100 100" className="h-full w-full">
        <defs>
          <radialGradient id="mapGlow" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="#1a2e24" />
            <stop offset="100%" stopColor="#0c1210" />
          </radialGradient>
        </defs>
        <rect width="100" height="100" fill="url(#mapGlow)" />
        {/* schematic lanes */}
        <line x1="10" y1="90" x2="90" y2="10" stroke="#2a3d32" strokeWidth="0.4" />
        <line x1="50" y1="5" x2="50" y2="95" stroke="#24352c" strokeWidth="0.35" strokeDasharray="1 1" />
        <line x1="5" y1="50" x2="95" y2="50" stroke="#24352c" strokeWidth="0.35" strokeDasharray="1 1" />
        <circle cx="50" cy="50" r="8" fill="none" stroke="#3d5a48" strokeWidth="0.35" />

        {(timeline?.tracks ?? []).map((track) => {
          const pos = interpolate(track.samples, t);
          if (!pos) return null;
          const { cx, cy } = project(pos.x, pos.y);
          const player = players.find((p) => p.steamId === track.playerId);
          const isSubject = track.playerId === subjectId;
          const highlighted = highlightPlayerIds.includes(track.playerId);
          const ally = player?.team === players.find((p) => p.steamId === subjectId)?.team;
          return (
            <g key={track.playerId}>
              <circle
                cx={cx}
                cy={cy}
                r={isSubject ? 2.4 : 1.6}
                className={cn(
                  isSubject
                    ? 'fill-amber-400'
                    : ally
                      ? 'fill-sky-400'
                      : 'fill-rose-400',
                  highlighted && 'opacity-100'
                )}
                opacity={highlighted || isSubject ? 1 : 0.55}
              />
              {isSubject && (
                <circle
                  cx={cx}
                  cy={cy}
                  r={3.6}
                  fill="none"
                  stroke="#fbbf24"
                  strokeWidth="0.35"
                  opacity="0.7"
                />
              )}
            </g>
          );
        })}

        {marker && (
          (() => {
            const { cx, cy } = project(marker.x, marker.y);
            return (
              <g>
                <circle cx={cx} cy={cy} r={3} fill="none" stroke="#f43f5e" strokeWidth="0.5" />
                <circle cx={cx} cy={cy} r={1} fill="#f43f5e" />
              </g>
            );
          })()
        )}
      </svg>
      {!timeline?.tracks?.length && (
        <div className="absolute inset-0 flex items-center justify-center text-xs text-zinc-500">
          No position track for this parse
        </div>
      )}
      <div className="absolute bottom-2 left-2 flex gap-2 text-[10px] text-zinc-400">
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-amber-400" /> You
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-sky-400" /> Ally
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-rose-400" /> Enemy
        </span>
      </div>
    </div>
  );
}
