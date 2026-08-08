'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ExternalLink, Search, Trophy } from 'lucide-react';
import type { RlLeaderboardPlaylist } from '@coachcore/shared';
import { RL_LEADERBOARD_PLAYLISTS } from '@coachcore/shared';
import {
  fetchRlLeaderboard,
  RL_LEADERBOARD_QUERY_KEY,
  RL_LEADERBOARD_REFETCH_MS,
} from '@/services/rl-leaderboard';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { RlRankBadge } from './RlRankBadge';
import { rankFromRating } from '../../lib/rl-ranks';

export function RlLeaderboardPanel({
  initialPlaylist = '2v2',
}: {
  initialPlaylist?: RlLeaderboardPlaylist;
}) {
  const [playlist, setPlaylist] = useState<RlLeaderboardPlaylist>(initialPlaylist);
  const [search, setSearch] = useState('');

  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: [RL_LEADERBOARD_QUERY_KEY, playlist],
    queryFn: () => fetchRlLeaderboard(playlist),
    refetchInterval: RL_LEADERBOARD_REFETCH_MS,
    staleTime: RL_LEADERBOARD_REFETCH_MS,
  });

  const board = useMemo(
    () => data?.boards.find((b) => b.playlist === playlist) ?? data?.boards[0],
    [data, playlist]
  );

  const players = useMemo(() => {
    const rows = board?.players ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((p) => p.playerName.toLowerCase().includes(q));
  }, [board?.players, search]);

  const meta = RL_LEADERBOARD_PLAYLISTS.find((p) => p.playlist === playlist);

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Trophy className="h-6 w-6 text-orange-400" />
            <h1 className="text-3xl font-bold text-white">Ranked Leaderboard</h1>
          </div>
          <p className="text-zinc-400">
            Tracker Network playlist boards for Ranked 1v1, 2v2, and 3v3
          </p>
        </div>
        <div className="text-right text-xs text-zinc-500">
          <p>
            {board?.isLive ? 'Live scrape' : 'Cached Tracker Network snapshot'}
            {isFetching ? ' · refreshing…' : ''}
          </p>
          {board?.fetchedAt && (
            <p className="mt-1">Updated {new Date(board.fetchedAt).toLocaleString()}</p>
          )}
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {RL_LEADERBOARD_PLAYLISTS.map((p) => (
          <button
            key={p.playlist}
            type="button"
            onClick={() => setPlaylist(p.playlist)}
            className={cn(
              'rounded-xl px-4 py-2 text-sm font-medium transition',
              playlist === p.playlist
                ? 'bg-gradient-to-r from-sky-500 to-orange-500 text-white shadow-lg shadow-sky-500/20'
                : 'border border-white/10 bg-white/[0.03] text-zinc-300 hover:border-sky-500/40'
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search players"
            className="w-full rounded-xl border border-white/10 bg-black/30 py-2 pl-9 pr-3 text-sm text-white placeholder:text-zinc-600 focus:border-sky-500/50 focus:outline-none"
          />
        </div>
        {meta && (
          <a
            href={meta.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-sm text-sky-400 hover:text-sky-300"
          >
            Open on Tracker Network
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-sky-500/[0.06] via-white/[0.02] to-orange-500/[0.06] backdrop-blur-xl">
        <div className="hidden grid-cols-[64px_minmax(180px,1.6fr)_140px_120px] gap-3 border-b border-white/10 px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 sm:grid">
          <span>Rank</span>
          <span>Player</span>
          <span>Rating</span>
          <span>Matches</span>
        </div>

        {isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-xl bg-white/5" />
            ))}
          </div>
        ) : isError ? (
          <div className="px-4 py-16 text-center">
            <p className="text-zinc-400">Could not load leaderboard.</p>
            <p className="mt-2 text-sm text-red-400/80">{(error as Error)?.message}</p>
            {meta && (
              <a
                href={meta.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center gap-2 text-sm text-sky-400"
              >
                View source board <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        ) : !players.length ? (
          <div className="px-4 py-16 text-center text-zinc-500">No players match your search.</div>
        ) : (
          <ul className="divide-y divide-white/5">
            {players.map((player, i) => (
              <motion.li
                key={`${player.rank}-${player.playerName}-${player.rating}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i, 12) * 0.02 }}
                className="grid grid-cols-[48px_1fr] items-center gap-3 px-4 py-3 sm:grid-cols-[64px_minmax(180px,1.6fr)_140px_120px]"
              >
                <span
                  className={cn(
                    'font-mono text-sm font-semibold',
                    player.rank <= 3 ? 'text-orange-300' : 'text-zinc-400'
                  )}
                >
                  #{player.rank}
                </span>
                <div className="min-w-0">
                  <a
                    href={player.profileUrl ?? meta?.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="truncate font-medium text-white hover:text-sky-300"
                  >
                    {player.playerName}
                  </a>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-zinc-500 sm:hidden">
                    <RlRankBadge rating={player.rating} playlist={playlist} size={22} />
                    <span>{player.rating.toLocaleString()} MMR</span>
                    <span>
                      {player.matchesPlayed != null
                        ? `${player.matchesPlayed.toLocaleString()} matches`
                        : '—'}
                    </span>
                  </div>
                </div>
                <span className="hidden items-center gap-2 font-semibold text-sky-200 sm:inline-flex">
                  <RlRankBadge rating={player.rating} playlist={playlist} />
                  <span className="tabular-nums">{player.rating.toLocaleString()}</span>
                  <span className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
                    {rankFromRating(player.rating, playlist).shortName}
                  </span>
                </span>
                <span className="hidden text-zinc-400 sm:block">
                  {player.matchesPlayed != null ? player.matchesPlayed.toLocaleString() : '—'}
                </span>
              </motion.li>
            ))}
          </ul>
        )}
      </div>

      <p className="mt-3 text-center text-[11px] text-zinc-600">
        Source: Tracker Network playlist leaderboards. Live scrape falls back to the latest captured
        board when Cloudflare blocks servers.
      </p>
    </div>
  );
}
