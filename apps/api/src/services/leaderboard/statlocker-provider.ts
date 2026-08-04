/**
 * Statlocker ranked leaderboard provider.
 * Uses the site JSON endpoint that powers https://statlocker.gg/ranked-leaderboard
 */
const BASE_URL = process.env.STATLOCKER_API_URL ?? 'https://statlocker.gg';
const API_KEY = process.env.STATLOCKER_API_KEY;

export interface StatlockerRankedEntry {
  position: number;
  accountId: number;
  name: string;
  avatarUrl: string;
  rankNumber: number;
  rankName: string;
  ppRankNumber: number | null;
  ppRankName: string | null;
  ppScore: number | null;
  points: number;
  pointsOutOf: number;
  flatProgress: number;
  region: string | null;
  seasonWins: number;
  seasonLosses: number;
  seasonGames: number;
  seasonWinRate: number;
}

export interface StatlockerRankedResponse {
  data: StatlockerRankedEntry[];
  totalCount: number;
  boardTotal: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** Map CoachCore region → Statlocker query param (omit for Global). */
export const STATLOCKER_REGION_MAP: Record<string, string | undefined> = {
  Global: undefined,
  NAmerica: 'NA',
  Europe: 'EU',
  SAmerica: 'SA',
  Asia: 'Asia',
  Oceania: 'OCE',
};

interface FetchOptions {
  retries?: number;
  retryDelayMs?: number;
}

async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { retries = 3, retryDelayMs = 500 } = options;
  const url = `${BASE_URL}${path}`;
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'User-Agent': 'CoachCoreAI/1.0 (+https://coachcore-ai-web.vercel.app)',
    Referer: 'https://statlocker.gg/ranked-leaderboard',
    Origin: 'https://statlocker.gg',
  };
  if (API_KEY) headers['X-API-Key'] = API_KEY;

  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, { headers, signal: AbortSignal.timeout(20000) });
      if (!res.ok) throw new Error(`Statlocker API ${res.status}: ${path}`);
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

export const statlockerProvider = {
  fetchRankedLeaderboard(params: {
    region?: string;
    page?: number;
    pageSize?: number;
  }): Promise<StatlockerRankedResponse> {
    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.min(Math.max(1, params.pageSize ?? 100), 500);
    const qs = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });
    const regionParam = params.region
      ? STATLOCKER_REGION_MAP[params.region]
      : undefined;
    if (regionParam) qs.set('region', regionParam);

    return apiFetch<StatlockerRankedResponse>(
      `/api/leaderboard/get-ranked-leaderboard?${qs.toString()}`
    );
  },
};
