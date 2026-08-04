'use client';

import { useVirtualizer } from '@tanstack/react-virtual';
import Image from 'next/image';
import Link from 'next/link';
import { useRef } from 'react';
import type { LeaderboardPlayer, LeaderboardSortField } from '@/types/leaderboard';
import { useGamePath } from '@/shared/context/game-context';
import {
  formatWinRate,
  getRegionFlag,
  RankChange,
  SortHeader,
} from './leaderboard-ui';

interface LeaderboardTableProps {
  players: LeaderboardPlayer[];
  sortBy: LeaderboardSortField;
  sortDir: 'asc' | 'desc';
  onSort: (field: LeaderboardSortField) => void;
}

const ROW_HEIGHT = 64;
const GRID_COLS =
  'grid-cols-[56px_minmax(180px,2fr)_minmax(110px,1fr)_72px_minmax(110px,1fr)_88px_64px_56px]';

export function LeaderboardTable({
  players,
  sortBy,
  sortDir,
  onSort,
}: LeaderboardTableProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const playerPath = useGamePath('player');

  const virtualizer = useVirtualizer({
    count: players.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 8,
  });

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] shadow-xl shadow-black/20">
      <div className="sticky top-0 z-10 hidden border-b border-white/10 bg-black/80 backdrop-blur-xl lg:block">
        <div className={`grid ${GRID_COLS} gap-3 px-4 py-3`}>
          <SortHeader label="#" field="rank" current={sortBy} dir={sortDir} onSort={onSort} />
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Player
          </span>
          <SortHeader label="Rank" field="mmr" current={sortBy} dir={sortDir} onSort={onSort} />
          <SortHeader label="Points" field="points" current={sortBy} dir={sortDir} onSort={onSort} />
          <SortHeader
            label="Perf Rank"
            field="ppScore"
            current={sortBy}
            dir={sortDir}
            onSort={onSort}
          />
          <SortHeader label="Season" field="wins" current={sortBy} dir={sortDir} onSort={onSort} />
          <SortHeader label="WR" field="winRate" current={sortBy} dir={sortDir} onSort={onSort} />
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Region
          </span>
        </div>
      </div>

      <div ref={parentRef} className="max-h-[600px] overflow-auto">
        <div style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}>
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const player = players[virtualRow.index];
            return (
              <div
                key={player.steamId}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <Link
                  href={`${playerPath}/${player.steamId}`}
                  className={`group flex h-full items-center gap-3 border-b border-white/5 px-4 transition-colors hover:bg-emerald-500/5 lg:grid ${GRID_COLS} lg:gap-3`}
                >
                  <div className="flex w-14 shrink-0 items-center gap-1 lg:w-auto">
                    <span className="font-bold text-zinc-300">#{player.rank}</span>
                    <RankChange change={player.rankChange} />
                  </div>

                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full border border-white/10 bg-zinc-800">
                      <Image
                        src={player.avatar}
                        alt=""
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    <p
                      className="truncate font-medium text-white group-hover:text-emerald-200"
                      title={player.playerName}
                    >
                      {player.playerName}
                    </p>
                  </div>

                  <div className="hidden min-w-0 lg:block">
                    <p className="truncate font-semibold text-amber-200/90">
                      {player.rankName ?? '—'}
                    </p>
                  </div>

                  <span className="hidden font-mono text-sm text-zinc-200 lg:block">
                    {player.points != null
                      ? `${player.points}${player.pointsOutOf ? `/${player.pointsOutOf}` : ''}`
                      : '—'}
                  </span>

                  <div className="hidden min-w-0 lg:block">
                    <p className="truncate text-sm text-emerald-300/90">
                      {player.ppRankName ?? '—'}
                    </p>
                    {player.ppScore != null && (
                      <p className="text-[10px] text-zinc-500">{player.ppScore} PP</p>
                    )}
                  </div>

                  <span className="hidden text-sm lg:block">
                    <span className="text-green-400">{player.wins}</span>
                    <span className="text-zinc-600">-</span>
                    <span className="text-red-400">{player.losses}</span>
                  </span>

                  <span
                    className={`hidden text-sm lg:block ${
                      player.gamesPlayed < 20 ? 'text-zinc-500' : 'text-zinc-300'
                    }`}
                  >
                    {formatWinRate(player.winRate)}
                  </span>

                  <span className="hidden text-lg lg:block" title={player.region}>
                    {getRegionFlag(player.region)}
                  </span>

                  <div className="ml-auto shrink-0 flex flex-col items-end lg:hidden">
                    <span className="font-semibold text-amber-200/90">
                      #{player.rank} · {player.rankName ?? '—'}
                    </span>
                    <span className="text-xs text-zinc-500">
                      {player.wins}-{player.losses} · {formatWinRate(player.winRate)}
                    </span>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
