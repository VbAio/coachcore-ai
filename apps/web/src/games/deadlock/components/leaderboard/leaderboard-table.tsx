'use client';

import { useVirtualizer } from '@tanstack/react-virtual';
import Image from 'next/image';
import Link from 'next/link';
import { useRef } from 'react';
import type { LeaderboardPlayer, LeaderboardSortField } from '@/types/leaderboard';
import { useGamePath } from '@/shared/context/game-context';
import {
  formatKda,
  formatNumber,
  formatWinRate,
  getRegionFlag,
  RankChange,
  SortHeader,
  StreakBadge,
} from './leaderboard-ui';

interface LeaderboardTableProps {
  players: LeaderboardPlayer[];
  sortBy: LeaderboardSortField;
  sortDir: 'asc' | 'desc';
  onSort: (field: LeaderboardSortField) => void;
}

const ROW_HEIGHT = 64;
const GRID_COLS =
  'grid-cols-[56px_minmax(200px,2fr)_88px_64px_64px_72px_64px_minmax(120px,1fr)_56px]';

export function LeaderboardTable({
  players,
  sortBy,
  sortDir,
  onSort,
}: LeaderboardTableProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const heroesPath = useGamePath('heroes');
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
          <SortHeader label="Rank" field="rank" current={sortBy} dir={sortDir} onSort={onSort} />
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Player
          </span>
          <SortHeader label="Rating" field="mmr" current={sortBy} dir={sortDir} onSort={onSort} />
          <SortHeader label="Wins" field="wins" current={sortBy} dir={sortDir} onSort={onSort} />
          <SortHeader label="Loss" field="losses" current={sortBy} dir={sortDir} onSort={onSort} />
          <SortHeader label="WR" field="winRate" current={sortBy} dir={sortDir} onSort={onSort} />
          <SortHeader label="KDA" field="kda" current={sortBy} dir={sortDir} onSort={onSort} />
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Hero
          </span>
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
                  className={`group flex h-full items-center gap-3 border-b border-white/5 px-4 transition-colors hover:bg-purple-500/5 lg:grid ${GRID_COLS} lg:gap-3`}
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
                    <div className="min-w-0 flex-1">
                      <p
                        className="truncate font-medium text-white group-hover:text-purple-200"
                        title={player.playerName}
                      >
                        {player.playerName}
                      </p>
                      <StreakBadge streak={player.streak} />
                    </div>
                  </div>

                  <span className="hidden font-semibold text-purple-300 lg:block">
                    {formatNumber(player.mmr)}
                  </span>
                  <span className="hidden text-green-400 lg:block">{player.wins}</span>
                  <span className="hidden text-red-400 lg:block">{player.losses}</span>
                  <span className="hidden text-zinc-300 lg:block">
                    {formatWinRate(player.winRate)}
                  </span>
                  <span className="hidden text-zinc-300 lg:block">{formatKda(player.kda)}</span>

                  <div
                    className="hidden min-w-0 lg:flex lg:items-center lg:gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {player.favoriteHeroSlug ? (
                      <Link
                        href={`${heroesPath}/${player.favoriteHeroSlug}`}
                        className="flex min-w-0 items-center gap-2 rounded-lg px-1 py-0.5 transition-colors hover:bg-white/5"
                      >
                        {player.favoriteHeroPortrait ? (
                          <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-lg">
                            <Image
                              src={player.favoriteHeroPortrait}
                              alt={player.favoriteHero}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                        ) : (
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-500/20 text-xs font-bold text-purple-300">
                            {player.favoriteHero.charAt(0)}
                          </div>
                        )}
                        <span className="truncate text-xs text-zinc-400 group-hover:text-purple-300">
                          {player.favoriteHero}
                        </span>
                      </Link>
                    ) : (
                      <span className="truncate text-xs text-zinc-500">{player.favoriteHero}</span>
                    )}
                  </div>

                  <span className="hidden text-lg lg:block" title={player.region}>
                    {getRegionFlag(player.region)}
                  </span>

                  <div className="ml-auto shrink-0 flex flex-col items-end lg:hidden">
                    <span className="font-semibold text-purple-300">
                      #{player.rank} · {formatNumber(player.mmr)}
                    </span>
                    <span className="text-xs text-zinc-500">
                      {formatWinRate(player.winRate)} · {formatKda(player.kda)} KDA
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
