import type {
  HeroAsset,
  LeaderboardQuery,
  LeaderboardResponse,
  PlayerProfile,
} from '@/types/leaderboard';

function buildQuery(params: LeaderboardQuery): string {
  const q = new URLSearchParams();
  if (params.region) q.set('region', params.region);
  if (params.heroId != null) q.set('heroId', String(params.heroId));
  if (params.minRating != null) q.set('minRating', String(params.minRating));
  if (params.maxRating != null) q.set('maxRating', String(params.maxRating));
  if (params.minWinRate != null) q.set('minWinRate', String(params.minWinRate));
  if (params.minGames != null) q.set('minGames', String(params.minGames));
  if (params.search) q.set('search', params.search);
  if (params.sortBy) q.set('sortBy', params.sortBy);
  if (params.sortDir) q.set('sortDir', params.sortDir);
  if (params.limit != null) q.set('limit', String(params.limit));
  if (params.offset != null) q.set('offset', String(params.offset));
  const str = q.toString();
  return str ? `?${str}` : '';
}

/** Fetch from Next.js API routes (same origin) — works without Express API on :4000 */
async function leaderboardFetch<T>(path: string): Promise<T> {
  const res = await fetch(path, { headers: { Accept: 'application/json' } });
  if (!res.ok) {
    throw new Error(`Leaderboard request failed (${res.status})`);
  }
  const json = await res.json();
  if (!json.success) throw new Error(json.error ?? 'Leaderboard API error');
  return json.data as T;
}

export async function fetchLeaderboard(
  params: LeaderboardQuery = {}
): Promise<LeaderboardResponse> {
  return leaderboardFetch<LeaderboardResponse>(
    `/api/leaderboards/deadlock${buildQuery(params)}`
  );
}

export async function fetchPlayerProfile(steamId: string): Promise<PlayerProfile> {
  return leaderboardFetch<PlayerProfile>(
    `/api/leaderboards/deadlock/player/${steamId}`
  );
}

export async function fetchLeaderboardHeroes(): Promise<HeroAsset[]> {
  return leaderboardFetch<HeroAsset[]>('/api/leaderboards/deadlock/heroes');
}

export const LEADERBOARD_QUERY_KEY = 'deadlock-leaderboard';
export const PLAYER_QUERY_KEY = 'deadlock-player';
export const LEADERBOARD_HEROES_KEY = 'deadlock-leaderboard-heroes';
export const LEADERBOARD_REFETCH_MS = 5 * 60 * 1000;
