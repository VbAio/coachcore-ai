'use client';

import { Pause, Play, SkipBack, SkipForward } from 'lucide-react';
import { formatClock } from './format';
import { cn } from '@/lib/utils';

interface Props {
  t: number;
  duration: number;
  playing: boolean;
  speed: number;
  onSeek: (t: number) => void;
  onTogglePlay: () => void;
  onSpeed: (speed: number) => void;
  onStep: (delta: number) => void;
}

export function PlaybackControls({
  t,
  duration,
  playing,
  speed,
  onSeek,
  onTogglePlay,
  onSpeed,
  onStep,
}: Props) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2">
      <input
        type="range"
        min={0}
        max={Math.max(1, duration)}
        step={0.5}
        value={Math.min(t, duration)}
        onChange={(e) => onSeek(Number(e.target.value))}
        className="w-full accent-amber-500"
        aria-label="Match clock"
      />
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onStep(-1)}
            className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white"
            aria-label="Step back 1s"
          >
            <SkipBack className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onTogglePlay}
            className="rounded-md bg-amber-500/20 p-1.5 text-amber-300 hover:bg-amber-500/30"
            aria-label={playing ? 'Pause' : 'Play'}
          >
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={() => onStep(1)}
            className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white"
            aria-label="Step forward 1s"
          >
            <SkipForward className="h-4 w-4" />
          </button>
        </div>
        <span className="font-mono text-sm text-zinc-300">
          {formatClock(t)} <span className="text-zinc-600">/</span> {formatClock(duration)}
        </span>
        <div className="flex gap-1">
          {[0.5, 1, 2].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onSpeed(s)}
              className={cn(
                'rounded px-2 py-0.5 text-xs font-medium',
                speed === s
                  ? 'bg-amber-500/25 text-amber-200'
                  : 'text-zinc-500 hover:text-zinc-300'
              )}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
