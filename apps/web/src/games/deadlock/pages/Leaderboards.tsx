'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Trophy } from 'lucide-react';
import type { GamePageProps } from '@/games/types';
import type { LeaderboardRegion, LeaderboardSortField } from '@/types/leaderboard';
import { applyClientLeaderboardView } from '@/lib/leaderboard-utils';
import {
  fetchLeaderboard,
  LEADERBOARD_QUERY_KEY,
  LEADERBOARD_REFETCH_MS,
} from '@/services/leaderboard';
import { LeaderboardFilters } from '../components/leaderboard/leaderboard-filters';
import { LeaderboardTable } from '../components/leaderboard/leaderboard-table';
import { LiveStatus, TableSkeleton } from '../components/leaderboard/leaderboard-ui';

export function DeadlockLeaderboardsPage(_props: GamePageProps) {
  const [region, setRegion] = useState<LeaderboardRegion>('Global');
  const [search, setSearch] = useState('');
  const [minWinRate, setMinWinRate] = useState('');
  const [minGames, setMinGames] = useState('');
  const [limit, setLimit] = useState(100);
  const [sortBy, setSortBy] = useState<LeaderboardSortField>('rank');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const queryParams = useMemo(
    () => ({
      region,
      limit,
      offset: 0,
    }),
    [region, limit]
  );

  const clientFilters = useMemo(
    () => ({
      search: search || undefined,
      minWinRate: minWinRate ? Number(minWinRate) : undefined,
      minGames: minGames ? Number(minGames) : undefined,
      sortBy,
      sortDir,
    }),
    [search, minWinRate, minGames, sortBy, sortDir]
  );

  const { data, isLoading, isFetching, isError, error } = useQuery({
    queryKey: [LEADERBOARD_QUERY_KEY, queryParams],
    queryFn: () => fetchLeaderboard(queryParams),
    refetchInterval: LEADERBOARD_REFETCH_MS,
    refetchIntervalInBackground: true,
    staleTime: LEADERBOARD_REFETCH_MS,
  });

  const displayPlayers = useMemo(() => {
    if (!data?.players.length) return [];
    return applyClientLeaderboardView(data.players, clientFilters);
  }, [data?.players, clientFilters]);

  const handleSort = (field: LeaderboardSortField) => {
    if (sortBy === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortDir(field === 'rank' ? 'asc' : 'desc');
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Trophy className="h-6 w-6 text-amber-400" />
            <h1 className="text-3xl font-bold text-white">Ranked Leaderboard</h1>
          </div>
          <p className="text-zinc-400">
            Ranked Deadlock players by Valve rank and points — powered by Statlocker
          </p>
        </div>
        <LiveStatus lastFetchedAt={data?.lastFetchedAt} />
      </div>

      <LeaderboardFilters
        region={region}
        onRegionChange={setRegion}
        search={search}
        onSearchChange={setSearch}
        minWinRate={minWinRate}
        onMinWinRateChange={setMinWinRate}
        minGames={minGames}
        onMinGamesChange={setMinGames}
        limit={limit}
        onLimitChange={setLimit}
      />

      <div className="mt-6">
        {isLoading ? (
          <TableSkeleton rows={12} />
        ) : isError ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] py-20 text-center">
            <p className="text-zinc-400">Could not load leaderboard data.</p>
            <p className="mt-2 text-sm text-red-400/80">
              {(error as Error)?.message ?? 'Could not reach Statlocker.'}
            </p>
            {isFetching && (
              <p className="mt-2 text-sm text-zinc-600">Retrying...</p>
            )}
          </div>
        ) : !data?.players.length ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] py-20 text-center">
            <p className="text-zinc-400">No leaderboard data is currently available.</p>
          </div>
        ) : displayPlayers.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] py-20 text-center">
            <p className="text-zinc-400">No players match your filters.</p>
            <p className="mt-2 text-sm text-zinc-600">Try clearing search or win-rate filters.</p>
          </div>
        ) : (
          <>
            <div className="mb-3 flex items-center justify-between text-sm text-zinc-500">
              <span>
                Showing {displayPlayers.length} of {data.total.toLocaleString()} players
              </span>
              {isFetching && !isLoading && (
                <span className="text-emerald-400">Refreshing...</span>
              )}
            </div>
            <LeaderboardTable
              players={displayPlayers}
              sortBy={sortBy}
              sortDir={sortDir}
              onSort={handleSort}
            />
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-500">
              <p>
                Data from{' '}
                <a
                  href="https://statlocker.gg/ranked-leaderboard"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-400/90 underline-offset-2 hover:underline"
                >
                  Statlocker Ranked Leaderboard
                </a>
                . Auto-refreshes every 5 minutes.
              </p>
              <a
                href="https://statlocker.gg"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-zinc-300 transition hover:border-emerald-500/40 hover:text-emerald-200"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://statlocker.gg/images/statlocker-logo-green.png"
                  alt=""
                  width={16}
                  height={16}
                  className="h-4 w-4"
                />
                Powered by Statlocker
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
