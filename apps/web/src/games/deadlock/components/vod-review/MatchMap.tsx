'use client';

import Image from 'next/image';
import { useMemo } from 'react';
import type { MatchTimeline } from '@coachcore/shared';
import { cn } from '@/lib/utils';
import {
  interpolateSamples,
  MINIMAP_SRC,
  trailSamples,
  worldToMapPercent,
} from './map-coords';
import { formatClock } from './format';

interface Props {
  timeline: MatchTimeline | null;
  t: number;
  highlightPlayerIds: string[];
  marker?: { x: number; y: number } | null;
  onSeekNear?: (t: number) => void;
}

export function MatchMap({ timeline, t, highlightPlayerIds, marker }: Props) {
  const players = timeline?.players ?? [];
  const subjectId = timeline?.subjectPlayerId;
  const subjectTeam = players.find((p) => p.steamId === subjectId)?.team;

  const rendered = useMemo(() => {
    return (timeline?.tracks ?? [])
      .map((track) => {
        const pos = interpolateSamples(track.samples, t);
        if (!pos) return null;
        const { cx, cy } = worldToMapPercent(pos.x, pos.y);
        const player = players.find((p) => p.steamId === track.playerId);
        const isSubject = track.playerId === subjectId;
        const highlighted = highlightPlayerIds.includes(track.playerId);
        const ally = player?.team === subjectTeam;
        const trail = isSubject
          ? trailSamples(track.samples, t).map((p) => worldToMapPercent(p.x, p.y))
          : [];
        return {
          id: track.playerId,
          cx,
          cy,
          isSubject,
          highlighted,
          ally,
          name: player?.name ?? '?',
          hero: player?.hero ?? '',
          trail,
        };
      })
      .filter(Boolean) as Array<{
      id: string;
      cx: number;
      cy: number;
      isSubject: boolean;
      highlighted: boolean;
      ally: boolean;
      name: string;
      hero: string;
      trail: Array<{ cx: number; cy: number }>;
    }>;
  }, [timeline, t, players, subjectId, subjectTeam, highlightPlayerIds]);

  const markerPct = marker ? worldToMapPercent(marker.x, marker.y) : null;

  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-zinc-700/80 bg-[#0a0e0c] shadow-[inset_0_0_60px_rgba(0,0,0,0.55)]">
      {/* Real Deadlock minimap */}
      <Image
        src={MINIMAP_SRC}
        alt="Deadlock map"
        fill
        priority
        className="object-cover opacity-95"
        sizes="(max-width: 1024px) 100vw, 480px"
      />

      {/* Soft vignette so markers pop */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at center, transparent 42%, rgba(0,0,0,0.45) 100%)',
        }}
      />

      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <filter id="glowSoft" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="0.6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="trailGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity="0" />
            <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.85" />
          </linearGradient>
        </defs>

        {/* Subject trail */}
        {rendered
          .filter((p) => p.isSubject && p.trail.length > 1)
          .map((p) => (
            <polyline
              key={`trail-${p.id}`}
              points={p.trail.map((pt) => `${pt.cx},${pt.cy}`).join(' ')}
              fill="none"
              stroke="url(#trailGrad)"
              strokeWidth="0.55"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.9"
            />
          ))}

        {rendered.map((p) => {
          const fill = p.isSubject ? '#fbbf24' : p.ally ? '#38bdf8' : '#f43f5e';
          const r = p.isSubject ? 2.1 : p.highlighted ? 1.85 : 1.45;
          return (
            <g key={p.id} filter={p.isSubject || p.highlighted ? 'url(#glowSoft)' : undefined}>
              {/* Smooth motion via CSS is on the group; SVG attrs update each frame */}
              {p.isSubject && (
                <circle
                  cx={p.cx}
                  cy={p.cy}
                  r={r + 2.2}
                  fill="none"
                  stroke={fill}
                  strokeWidth="0.35"
                  opacity="0.55"
                >
                  <animate
                    attributeName="r"
                    values={`${r + 1.6};${r + 2.6};${r + 1.6}`}
                    dur="1.8s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0.65;0.25;0.65"
                    dur="1.8s"
                    repeatCount="indefinite"
                  />
                </circle>
              )}
              <circle
                cx={p.cx}
                cy={p.cy}
                r={r}
                fill={fill}
                stroke="rgba(0,0,0,0.55)"
                strokeWidth="0.35"
                opacity={p.highlighted || p.isSubject ? 1 : 0.72}
              />
              {(p.isSubject || p.highlighted) && (
                <text
                  x={p.cx}
                  y={p.cy - r - 1.2}
                  textAnchor="middle"
                  className="fill-white"
                  style={{ fontSize: '2.2px', fontWeight: 600 }}
                  paintOrder="stroke"
                  stroke="rgba(0,0,0,0.75)"
                  strokeWidth="0.35"
                >
                  {p.isSubject ? 'YOU' : p.name.slice(0, 8)}
                </text>
              )}
            </g>
          );
        })}

        {markerPct && (
          <g>
            <circle
              cx={markerPct.cx}
              cy={markerPct.cy}
              r={3.2}
              fill="none"
              stroke="#fb7185"
              strokeWidth="0.45"
              opacity="0.9"
            />
            <circle cx={markerPct.cx} cy={markerPct.cy} r={1.1} fill="#fb7185" />
          </g>
        )}
      </svg>

      {!timeline?.tracks?.length && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 px-4 text-center text-xs text-zinc-300 backdrop-blur-[1px]">
          No position track for this parse — map still shows Midtown; re-upload after the
          position-extraction fix for live hero dots.
        </div>
      )}

      <div className="absolute left-2 top-2 rounded-md bg-black/55 px-2 py-1 font-mono text-[11px] text-amber-200/90 backdrop-blur-sm">
        {formatClock(t)}
      </div>

      <div
        className={cn(
          'absolute bottom-2 left-2 flex gap-2 rounded-md bg-black/55 px-2 py-1 text-[10px] text-zinc-200 backdrop-blur-sm'
        )}
      >
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
