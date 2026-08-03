import type { LeaderboardPlayer, LeaderboardSortField } from '@/types/leaderboard';

export interface ClientLeaderboardFilters {
  search?: string;
  minRating?: number;
  maxRating?: number;
  minWinRate?: number;
  minGames?: number;
  sortBy?: LeaderboardSortField;
  sortDir?: 'asc' | 'desc';
}

export function filterLeaderboardPlayers(
  players: LeaderboardPlayer[],
  filters: ClientLeaderboardFilters
): LeaderboardPlayer[] {
  return players.filter((p) => {
    if (filters.search && !p.playerName.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    if (filters.minRating != null && p.mmr > 0 && p.mmr < filters.minRating) return false;
    if (filters.minRating != null && p.mmr === 0) return false;
    if (filters.maxRating != null && p.mmr > filters.maxRating) return false;
    if (filters.minWinRate != null && p.winRate > 0 && p.winRate < filters.minWinRate / 100) {
      return false;
    }
    if (filters.minWinRate != null && p.winRate === 0 && p.gamesPlayed > 0) return false;
    if (filters.minGames != null && p.gamesPlayed > 0 && p.gamesPlayed < filters.minGames) {
      return false;
    }
    if (filters.minGames != null && p.gamesPlayed === 0) return false;
    return true;
  });
}

export function sortLeaderboardPlayers(
  players: LeaderboardPlayer[],
  sortBy: LeaderboardSortField,
  sortDir: 'asc' | 'desc'
): LeaderboardPlayer[] {
  const dir = sortDir === 'asc' ? 1 : -1;
  return [...players].sort((a, b) => {
    if (sortBy === 'lastUpdated') {
      return (
        (new Date(a.lastUpdated).getTime() - new Date(b.lastUpdated).getTime()) * dir
      );
    }
    const av = a[sortBy as keyof LeaderboardPlayer];
    const bv = b[sortBy as keyof LeaderboardPlayer];
    if (typeof av === 'number' && typeof bv === 'number') {
      return (av - bv) * dir;
    }
    if (typeof av === 'string' && typeof bv === 'string') {
      return av.localeCompare(bv) * dir;
    }
    return 0;
  });
}

export function applyClientLeaderboardView(
  players: LeaderboardPlayer[],
  filters: ClientLeaderboardFilters
): LeaderboardPlayer[] {
  const filtered = filterLeaderboardPlayers(players, filters);
  const sorted = sortLeaderboardPlayers(
    filtered,
    filters.sortBy ?? 'rank',
    filters.sortDir ?? 'asc'
  );
  return sorted.map((p, i) => ({ ...p, rank: i + 1 }));
}
