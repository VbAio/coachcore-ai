'use client';

import Image from 'next/image';
import { useMemo } from 'react';
import type { MatchTimeline, MatchTimelineTrack } from '@coachcore/shared';
import { cn } from '@/lib/utils';
import {
  interpolateSamples,
  looksLikeWorldCoords,
  MIDTOWN_BOUNDS,
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
  playing?: boolean;
}

type TrackSample = { t: number; x: number; y: number; z?: number };

/** Build tracks from timeline; if empty, synthesize from event positions. */
function resolveTracks(timeline: MatchTimeline | null): MatchTimelineTrack[] {
  const existing = timeline?.tracks?.filter((tr) => tr.samples.length > 0) ?? [];
  if (existing.length > 0) return existing;

  const byPlayer = new Map<string, TrackSample[]>();
  for (const e of timeline?.events ?? []) {
    if (!e.position) continue;
    const pid =
      e.targetId && (e.type === 'death' || e.type === 'assist')
        ? e.targetId
        : e.actorId ?? timeline?.subjectPlayerId;
    if (!pid) continue;
    if (!byPlayer.has(pid)) byPlayer.set(pid, []);
    byPlayer.get(pid)!.push({
      t: e.timestamp,
      x: e.position.x,
      y: e.position.y,
      z: 0,
    });
  }
  return [...byPlayer.entries()].map(([playerId, samples]) => ({
    playerId,
    samples: samples
      .sort((a, b) => a.t - b.t)
      .map((s) => ({ t: s.t, x: s.x, y: s.y, z: s.z ?? 0 })),
  }));
}

/**
 * If the parser stamped every sample with ~the same match clock, redistribute
 * times across the match so playback still animates (legacy reports only).
 */
function normalizeSampleTimes(
  samples: Array<{ t: number; x: number; y: number }>,
  duration: number
): Array<{ t: number; x: number; y: number }> {
  if (samples.length < 2) return samples;
  const sorted = [...samples].sort((a, b) => a.t - b.t);
  const span = sorted[sorted.length - 1].t - sorted[0].t;
  const dur = Math.max(duration, 1);
  if (span >= Math.min(30, dur * 0.05)) return sorted;
  return sorted.map((s, i) => ({
    ...s,
    t: (i / Math.max(1, sorted.length - 1)) * dur,
  }));
}

export function MatchMap({
  timeline,
  t,
  highlightPlayerIds,
  marker,
  playing = false,
}: Props) {
  const players = timeline?.players ?? [];
  const subjectId = timeline?.subjectPlayerId;
  const subjectTeam = players.find((p) => p.steamId === subjectId)?.team;
  const duration = Math.max(1, timeline?.durationSeconds ?? 600);

  const tracks = useMemo(() => resolveTracks(timeline), [timeline]);

  const planeTracks = useMemo(() => {
    return tracks.map((tr) => ({
      playerId: tr.playerId,
      // Deadlock ground plane is XY (Z is height) — same as deadlock-api-assets
      samples: normalizeSampleTimes(
        tr.samples.map((s) => ({ t: s.t, x: s.x, y: s.y })),
        duration
      ),
    }));
  }, [tracks, duration]);

  const allSamples = useMemo(
    () => planeTracks.flatMap((tr) => tr.samples),
    [planeTracks]
  );
  const coordsOk = looksLikeWorldCoords(allSamples);

  const rendered = useMemo(() => {
    if (!coordsOk) return [];
    return planeTracks
      .map((track) => {
        const pos = interpolateSamples(track.samples, t);
        if (!pos) return null;
        const { cx, cy } = worldToMapPercent(pos.x, pos.y, MIDTOWN_BOUNDS);
        const player = players.find((p) => p.steamId === track.playerId);
        const isSubject = track.playerId === subjectId;
        const highlighted = highlightPlayerIds.includes(track.playerId);
        const ally = player?.team === subjectTeam;
        const trail = isSubject
          ? trailSamples(track.samples, t).map((p) =>
              worldToMapPercent(p.x, p.y, MIDTOWN_BOUNDS)
            )
          : [];
        return {
          id: track.playerId,
          cx,
          cy,
          isSubject,
          highlighted,
          ally,
          name: player?.name ?? '?',
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
      trail: Array<{ cx: number; cy: number }>;
    }>;
  }, [planeTracks, t, players, subjectId, subjectTeam, highlightPlayerIds, coordsOk]);

  const markerPct =
    marker && coordsOk ? worldToMapPercent(marker.x, marker.y, MIDTOWN_BOUNDS) : null;
  const sampleCount = allSamples.length;
  const hasMotion = rendered.length > 0;

  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-zinc-700/80 bg-[#0a0e0c] shadow-[inset_0_0_60px_rgba(0,0,0,0.55)]">
      <div className="absolute inset-0 z-0">
        <Image
          src={MINIMAP_SRC}
          alt="Deadlock map"
          fill
          priority
          className="object-contain opacity-95"
          sizes="(max-width: 1024px) 100vw, 480px"
        />
      </div>

      <div
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          background:
            'radial-gradient(circle at center, transparent 42%, rgba(0,0,0,0.45) 100%)',
        }}
      />

      <svg
        viewBox="0 0 100 100"
        className="pointer-events-none absolute inset-0 z-[2] h-full w-full"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="trailGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity="0" />
            <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.9" />
          </linearGradient>
        </defs>
        {rendered
          .filter((p) => p.isSubject && p.trail.length > 1)
          .map((p) => (
            <polyline
              key={`trail-${p.id}`}
              points={p.trail.map((pt) => `${pt.cx},${pt.cy}`).join(' ')}
              fill="none"
              stroke="url(#trailGrad)"
              strokeWidth="0.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
      </svg>

      <div className="absolute inset-0 z-[3]">
        {rendered.map((p) => {
          const color = p.isSubject ? '#fbbf24' : p.ally ? '#38bdf8' : '#f43f5e';
          const size = p.isSubject ? 14 : p.highlighted ? 12 : 10;
          return (
            <div
              key={p.id}
              className="absolute"
              style={{
                left: `${p.cx}%`,
                top: `${p.cy}%`,
                transform: 'translate(-50%, -50%)',
                transition: playing ? 'none' : 'left 120ms linear, top 120ms linear',
                zIndex: p.isSubject || p.highlighted ? 5 : 4,
              }}
            >
              {p.isSubject && (
                <span
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-ping rounded-full opacity-40"
                  style={{
                    width: size + 10,
                    height: size + 10,
                    background: color,
                  }}
                />
              )}
              <span
                className="relative block rounded-full border-2 border-black/70 shadow-md"
                style={{
                  width: size,
                  height: size,
                  background: color,
                  boxShadow: `0 0 10px ${color}aa`,
                }}
              />
              {(p.isSubject || p.highlighted) && (
                <span className="absolute left-1/2 top-[-1.1rem] -translate-x-1/2 whitespace-nowrap rounded bg-black/70 px-1 text-[10px] font-semibold text-white">
                  {p.isSubject ? 'YOU' : p.name.slice(0, 8)}
                </span>
              )}
            </div>
          );
        })}

        {markerPct && (
          <div
            className="absolute z-[6]"
            style={{
              left: `${markerPct.cx}%`,
              top: `${markerPct.cy}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <span className="block h-5 w-5 rounded-full border-2 border-rose-400 bg-rose-500/30" />
            <span className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-rose-400" />
          </div>
        )}
      </div>

      {!hasMotion && (
        <div className="absolute inset-0 z-[4] flex items-center justify-center bg-black/55 px-4 text-center text-xs text-zinc-100 backdrop-blur-[1px]">
          {sampleCount > 0 && !coordsOk
            ? 'This report has invalid map coordinates (cell offsets, not world space). Re-upload the .dem after the latest API deploy to rebuild positions.'
            : 'No movement data in this report. Re-upload the .dem after the latest API deploy so positions can be extracted.'}
        </div>
      )}

      <div className="absolute left-2 top-2 z-[5] rounded-md bg-black/60 px-2 py-1 font-mono text-[11px] text-amber-200/90 backdrop-blur-sm">
        {formatClock(t)}
        {hasMotion && (
          <span className="ml-2 text-[10px] text-zinc-400">
            {rendered.length} heroes · {sampleCount} pts
          </span>
        )}
      </div>

      <div
        className={cn(
          'absolute bottom-2 left-2 z-[5] flex gap-2 rounded-md bg-black/60 px-2 py-1 text-[10px] text-zinc-200 backdrop-blur-sm'
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
