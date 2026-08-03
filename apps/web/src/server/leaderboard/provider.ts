/**
 * Deadlock API provider — swap this module for an official Valve API later.
 */
const BASE_URL = process.env.LEADERBOARD_API_URL ?? 'https://api.deadlock-api.com';
const API_KEY = process.env.LEADERBOARD_API_KEY;

interface FetchOptions {
  retries?: number;
  retryDelayMs?: number;
}

async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { retries = 3, retryDelayMs = 500 } = options;
  const url = `${BASE_URL}${path}`;
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (API_KEY) headers['Authorization'] = `Bearer ${API_KEY}`;

  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, { headers, signal: AbortSignal.timeout(15000) });
      if (!res.ok) throw new Error(`Deadlock API ${res.status}: ${path}`);
      return (await res.json()) as T;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, retryDelayMs * (attempt + 1)));
      }
    }
  }
  throw lastError ?? new Error(`Failed to fetch ${path}`);
}

export interface ApiLeaderboardEntry {
  account_name: string | null;
  possible_account_ids: number[];
  rank: number | null;
  top_hero_ids: number[];
}

export interface ApiLeaderboard {
  entries: ApiLeaderboardEntry[];
}

export interface ApiHeroAsset {
  id: number;
  name: string;
  images?: {
    icon_image_small_webp?: string;
    icon_hero_card_webp?: string;
    top_bar_vertical_image_webp?: string;
  };
}

export interface ApiHeroStat {
  account_id: number;
  hero_id: number;
  matches_played: number;
  wins: number;
  kills: number;
  deaths: number;
  assists: number;
  total_player_damage: number;
  total_boss_damage: number;
  total_creep_damage: number;
  networth_per_min: number;
}

export interface ApiPlayerRank {
  badge: number;
  rank: number;
  subrank: number;
}

export interface ApiMatchHistoryEntry {
  match_id: number;
  hero_id: number;
  start_time: number;
  player_kills: number;
  player_deaths: number;
  player_assists: number;
  net_worth: number;
  match_duration_s: number;
  match_result: number;
  player_team: number;
  ranked_delta: number | null;
}

export interface ApiMmrHistoryEntry {
  timestamp: number;
  mmr: number;
}

export const deadlockApiProvider = {
  fetchLeaderboard(region: string, heroId?: number): Promise<ApiLeaderboard> {
    const path = heroId
      ? `/v1/leaderboard/${region}/${heroId}`
      : `/v1/leaderboard/${region}`;
    return apiFetch<ApiLeaderboard>(path);
  },
  fetchHeroAssets(): Promise<ApiHeroAsset[]> {
    return apiFetch<ApiHeroAsset[]>('/v1/assets/heroes');
  },
  fetchHeroStats(accountId: number): Promise<ApiHeroStat[]> {
    return apiFetch<ApiHeroStat[]>(`/v1/players/hero-stats?account_ids=${accountId}`);
  },
  fetchPlayerRank(accountId: number): Promise<ApiPlayerRank> {
    return apiFetch<ApiPlayerRank>(`/v1/players/${accountId}/rank`);
  },
  fetchMatchHistory(accountId: number, limit = 20): Promise<ApiMatchHistoryEntry[]> {
    return apiFetch<ApiMatchHistoryEntry[]>(
      `/v1/players/${accountId}/match-history?limit=${limit}`
    );
  },
  fetchMmrHistory(accountId: number, limit = 30): Promise<ApiMmrHistoryEntry[]> {
    return apiFetch<ApiMmrHistoryEntry[]>(
      `/v1/players/${accountId}/mmr-history?limit=${limit}`
    );
  },
};
