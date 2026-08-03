'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Trophy } from 'lucide-react';
import type { GamePageProps } from '@/games/types';
import type { LeaderboardRegion, LeaderboardSortField } from '@/types/leaderboard';
import { applyClientLeaderboardView } from '@/lib/leaderboard-utils';
import {
  fetchLeaderboard,
  fetchLeaderboardHeroes,
  LEADERBOARD_HEROES_KEY,
  LEADERBOARD_QUERY_KEY,
  LEADERBOARD_REFETCH_MS,
} from '@/services/leaderboard';
import { LeaderboardFilters } from '../components/leaderboard/leaderboard-filters';
import { LeaderboardTable } from '../components/leaderboard/leaderboard-table';
import { LiveStatus, TableSkeleton } from '../components/leaderboard/leaderboard-ui';

export function DeadlockLeaderboardsPage(_props: GamePageProps) {
  const [region, setRegion] = useState<LeaderboardRegion>('NAmerica');
  const [search, setSearch] = useState('');
  const [heroId, setHeroId] = useState<number | null>(null);
  const [minRating, setMinRating] = useState('');
  const [maxRating, setMaxRating] = useState('');
  const [minWinRate, setMinWinRate] = useState('');
  const [minGames, setMinGames] = useState('');
  const [limit, setLimit] = useState(100);
  const [sortBy, setSortBy] = useState<LeaderboardSortField>('rank');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const queryParams = useMemo(
    () => ({
      region,
      heroId: heroId ?? undefined,
      limit,
      offset: 0,
    }),
    [region, heroId, limit]
  );

  const clientFilters = useMemo(
    () => ({
      search: search || undefined,
      minRating: minRating ? Number(minRating) : undefined,
      maxRating: maxRating ? Number(maxRating) : undefined,
      minWinRate: minWinRate ? Number(minWinRate) : undefined,
      minGames: minGames ? Number(minGames) : undefined,
      sortBy,
      sortDir,
    }),
    [search, minRating, maxRating, minWinRate, minGames, sortBy, sortDir]
  );

  const { data: heroes = [] } = useQuery({
    queryKey: [LEADERBOARD_HEROES_KEY],
    queryFn: fetchLeaderboardHeroes,
    staleTime: 60 * 60 * 1000,
  });

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
            <h1 className="text-3xl font-bold text-white">Live Leaderboard</h1>
          </div>
          <p className="text-zinc-400">
            Top ranked Deadlock players — auto-refreshes every 5 minutes
          </p>
        </div>
        <LiveStatus lastFetchedAt={data?.lastFetchedAt} />
      </div>

      <LeaderboardFilters
        region={region}
        onRegionChange={setRegion}
        search={search}
        onSearchChange={setSearch}
        heroId={heroId}
        onHeroChange={setHeroId}
        minRating={minRating}
        onMinRatingChange={setMinRating}
        maxRating={maxRating}
        onMaxRatingChange={setMaxRating}
        minWinRate={minWinRate}
        onMinWinRateChange={setMinWinRate}
        minGames={minGames}
        onMinGamesChange={setMinGames}
        limit={limit}
        onLimitChange={setLimit}
        heroes={heroes}
      />

      <div className="mt-6">
        {isLoading ? (
          <TableSkeleton rows={12} />
        ) : isError ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] py-20 text-center">
            <p className="text-zinc-400">Could not load leaderboard data.</p>
            <p className="mt-2 text-sm text-red-400/80">
              {(error as Error)?.message ?? 'Could not reach leaderboard API.'}
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
            <p className="mt-2 text-sm text-zinc-600">
              Try clearing search or rating filters — stats are only loaded for the top 50 players.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-3 flex items-center justify-between text-sm text-zinc-500">
              <span>
                Showing {displayPlayers.length} of {data.total.toLocaleString()} players
              </span>
              {isFetching && !isLoading && (
                <span className="text-purple-400">Refreshing...</span>
              )}
            </div>
            <LeaderboardTable
              players={displayPlayers}
              sortBy={sortBy}
              sortDir={sortDir}
              onSort={handleSort}
            />
          </>
        )}
      </div>
    </div>
  );
}
