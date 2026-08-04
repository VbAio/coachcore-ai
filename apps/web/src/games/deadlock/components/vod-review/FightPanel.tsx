'use client';

import type { MatchTimeline, TeamFightBreakdown } from '@coachcore/shared';
import { formatClock } from './format';
import { cn } from '@/lib/utils';

interface Props {
  fights: TeamFightBreakdown[];
  timeline: MatchTimeline | null;
  activeFightId: string | null;
  onJump: (startTime: number, fightId: string) => void;
}

export function FightPanel({ fights, timeline, activeFightId, onJump }: Props) {
  const list =
    fights.length > 0
      ? fights
      : (timeline?.teamFights ?? []).map((f) => ({
          fightId: f.id,
          startTime: f.startTime,
          endTime: f.endTime,
          timeline: [],
          whoEngaged: f.participants[0] ?? 'Unknown',
          mistakes: [],
          goodPlays: [],
          positioningNotes: '',
          targetFocus: '',
          threatEvaluation: '',
          abilitySequencing: '',
          retreatTiming: '',
          ultimateValue: '',
          winProbabilityChange: f.outcome,
        }));

  if (list.length === 0) {
    return (
      <p className="text-xs text-zinc-500 px-1">No clustered teamfights detected in this parse.</p>
    );
  }

  return (
    <div className="space-y-1">
      <div className="px-1 text-[11px] uppercase tracking-wide text-zinc-500">Fights</div>
      {list.map((f) => {
        const outcome =
          timeline?.teamFights.find((x) => x.id === f.fightId)?.outcome ??
          (f.winProbabilityChange?.includes('+') ? 'won' : 'lost');
        return (
          <button
            key={f.fightId}
            type="button"
            onClick={() => onJump(f.startTime, f.fightId)}
            className={cn(
              'w-full rounded-lg border px-2.5 py-2 text-left text-sm transition',
              activeFightId === f.fightId
                ? 'border-sky-500/40 bg-sky-500/10'
                : 'border-zinc-800 bg-zinc-950/50 hover:bg-zinc-900'
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-xs text-sky-300">
                {formatClock(f.startTime)}–{formatClock(f.endTime)}
              </span>
              <span
                className={cn(
                  'text-[10px] uppercase',
                  outcome === 'won'
                    ? 'text-emerald-400'
                    : outcome === 'lost'
                      ? 'text-rose-400'
                      : 'text-zinc-400'
                )}
              >
                {outcome}
              </span>
            </div>
            <div className="mt-0.5 text-xs text-zinc-400">
              {f.mistakes.length} mistakes · {f.goodPlays.length} good plays
            </div>
          </button>
        );
      })}
    </div>
  );
}
