import type { RlLeaderboardPlaylist, RlLeaderboardResponse } from '@coachcore/shared';

async function rlLeaderboardFetch<T>(path: string): Promise<T> {
  const res = await fetch(path, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`Leaderboard request failed (${res.status})`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error ?? 'Leaderboard API error');
  return json.data as T;
}

export async function fetchRlLeaderboard(
  playlist: RlLeaderboardPlaylist = '2v2'
): Promise<RlLeaderboardResponse> {
  return rlLeaderboardFetch<RlLeaderboardResponse>(
    `/api/leaderboards/rocket-league?playlist=${encodeURIComponent(playlist)}`
  );
}

export const RL_LEADERBOARD_QUERY_KEY = 'rocket-league-leaderboard';
export const RL_LEADERBOARD_REFETCH_MS = 5 * 60 * 1000;
