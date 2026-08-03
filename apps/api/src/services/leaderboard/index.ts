import {
  deadlockApiProvider,
  type ApiHeroAsset,
  type ApiHeroStat,
  type ApiLeaderboardEntry,
  type ApiMatchHistoryEntry,
} from './provider.js';
import type {
  HeroAsset,
  LeaderboardPlayer,
  LeaderboardQuery,
  LeaderboardRegion,
  LeaderboardResponse,
  LeaderboardSortField,
  PlayerHeroStat,
  PlayerMatchEntry,
  PlayerProfile,
} from './types.js';

const CACHE_TTL_MS = 5 * 60 * 1000;
const ENRICH_CONCURRENCY = 8;
const ENRICH_LIMIT = 50;

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry<unknown>>();
const previousRanks = new Map<string, Map<string, number>>();
const playerNameCache = new Map<string, string>();

let heroAssetsCache: CacheEntry<Map<number, HeroAsset>> | null = null;

function getCached<T>(key: string): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (!entry || Date.now() > entry.expiresAt) return null;
  return entry.data;
}

function setCache<T>(key: string, data: T, ttl = CACHE_TTL_MS): void {
  cache.set(key, { data, expiresAt: Date.now() + ttl });
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function steamId3ToSteam64(accountId: number): string {
  return String(BigInt(accountId) + BigInt('76561197960265728'));
}

function avatarUrl(accountId: number): string {
  const steam64 = steamId3ToSteam64(accountId);
  return `https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg`;
}

function badgeToMmr(badge: number): number {
  if (badge <= 0) return 0;
  const tier = Math.floor(badge / 10);
  const sub = badge % 10;
  return tier * 1000 + sub * 100;
}

function badgeLabel(badge: number): string {
  if (badge <= 0) return 'Unranked';
  const tier = Math.floor(badge / 10);
  const sub = badge % 10;
  const tiers = ['Obscurus', 'Initiate', 'Seeker', 'Alchemist', 'Arcanist', 'Ritualist', 'Emissary', 'Archon', 'Oracle', 'Phantom', 'Ascendant', 'Eternus'];
  return `${tiers[Math.min(tier, tiers.length - 1)] ?? 'Unknown'} ${sub}`;
}

function isWin(match: ApiMatchHistoryEntry): boolean {
  return match.match_result === match.player_team;
}

function computeStreak(matches: ApiMatchHistoryEntry[]): { type: 'win' | 'loss' | 'none'; count: number } {
  if (!matches.length) return { type: 'none', count: 0 };
  const firstWin = isWin(matches[0]);
  let count = 0;
  for (const m of matches) {
    if (isWin(m) === firstWin) count++;
    else break;
  }
  return { type: firstWin ? 'win' : 'loss', count };
}

function aggregateHeroStats(stats: ApiHeroStat[]) {
  let wins = 0;
  let losses = 0;
  let kills = 0;
  let deaths = 0;
  let assists = 0;
  let totalPlayerDamage = 0;
  let totalObjectiveDamage = 0;
  let totalSouls = 0;
  let totalMatches = 0;

  for (const s of stats) {
    wins += s.wins;
    losses += s.matches_played - s.wins;
    kills += s.kills;
    deaths += s.deaths;
    assists += s.assists;
    totalPlayerDamage += s.total_player_damage;
    totalObjectiveDamage += s.total_boss_damage + s.total_creep_damage;
    totalSouls += s.networth_per_min * s.matches_played;
    totalMatches += s.matches_played;
  }

  const gamesPlayed = wins + losses;
  const kda = deaths > 0 ? (kills + assists) / deaths : kills + assists;

  return {
    wins,
    losses,
    gamesPlayed,
    winRate: gamesPlayed > 0 ? wins / gamesPlayed : 0,
    kda,
    averageSouls: totalMatches > 0 ? totalSouls / totalMatches : 0,
    averagePlayerDamage: totalMatches > 0 ? totalPlayerDamage / totalMatches : 0,
    averageObjectiveDamage: totalMatches > 0 ? totalObjectiveDamage / totalMatches : 0,
    averageHealing: 0,
    kills,
    deaths,
    assists,
  };
}

async function getHeroAssets(): Promise<Map<number, HeroAsset>> {
  if (heroAssetsCache && Date.now() < heroAssetsCache.expiresAt) {
    return heroAssetsCache.data;
  }
  try {
    const raw = await deadlockApiProvider.fetchHeroAssets();
    const map = new Map<number, HeroAsset>();
    for (const h of raw as ApiHeroAsset[]) {
      map.set(h.id, {
        id: h.id,
        name: h.name,
        slug: slugify(h.name),
        portrait:
          h.images?.icon_hero_card_webp ??
          h.images?.top_bar_vertical_image_webp ??
          h.images?.icon_image_small_webp ??
          '',
        icon: h.images?.icon_image_small_webp ?? '',
      });
    }
    heroAssetsCache = { data: map, expiresAt: Date.now() + 60 * 60 * 1000 };
    return map;
  } catch (err) {
    console.error('[leaderboard] Failed to fetch hero assets:', err);
    return heroAssetsCache?.data ?? new Map();
  }
}

function cacheEntryNames(entries: ApiLeaderboardEntry[]): void {
  for (const entry of entries) {
    const id = resolveAccountId(entry);
    if (id && entry.account_name) {
      playerNameCache.set(String(id), entry.account_name);
    }
  }
}

function resolveAccountId(entry: ApiLeaderboardEntry): number | null {
  return entry.possible_account_ids?.[0] ?? null;
}

function toBasicPlayer(
  entry: ApiLeaderboardEntry,
  position: number,
  region: string,
  heroes: Map<number, HeroAsset>,
  prevRankMap: Map<string, number> | undefined
): LeaderboardPlayer | null {
  const accountId = resolveAccountId(entry);
  if (!accountId) return null;

  const steamId = String(accountId);
  const favoriteHeroId = entry.top_hero_ids?.[0] ?? null;
  const heroAsset = favoriteHeroId ? heroes.get(favoriteHeroId) : null;
  const rankChange = prevRankMap?.has(steamId)
    ? (prevRankMap.get(steamId)! - position)
    : null;

  return {
    steamId,
    rank: position,
    playerName: entry.account_name ?? `Player ${accountId}`,
    avatar: avatarUrl(accountId),
    mmr: 0,
    wins: 0,
    losses: 0,
    winRate: 0,
    kda: 0,
    averageSouls: 0,
    averagePlayerDamage: 0,
    averageObjectiveDamage: 0,
    averageHealing: 0,
    favoriteHero: heroAsset?.name ?? (favoriteHeroId ? `Hero ${favoriteHeroId}` : 'Unknown'),
    favoriteHeroId,
    favoriteHeroSlug: heroAsset?.slug ?? null,
    favoriteHeroPortrait: heroAsset?.portrait ?? '',
    region,
    lastUpdated: new Date().toISOString(),
    rankChange,
    streak: { type: 'none', count: 0 },
    gamesPlayed: 0,
  };
}

async function enrichEntry(
  entry: ApiLeaderboardEntry,
  position: number,
  region: string,
  heroes: Map<number, HeroAsset>,
  prevRankMap: Map<string, number> | undefined
): Promise<LeaderboardPlayer | null> {
  const accountId = resolveAccountId(entry);
  if (!accountId) return null;

  const steamId = String(accountId);
  const playerName = entry.account_name ?? `Player ${accountId}`;

  let stats = {
    wins: 0,
    losses: 0,
    gamesPlayed: 0,
    winRate: 0,
    kda: 0,
    averageSouls: 0,
    averagePlayerDamage: 0,
    averageObjectiveDamage: 0,
    averageHealing: 0,
  };
  let mmr = 0;
  let streak = { type: 'none' as const, count: 0 };

  try {
    const [heroStats, rankData] = await Promise.all([
      deadlockApiProvider.fetchHeroStats(accountId).catch(() => [] as ApiHeroStat[]),
      deadlockApiProvider.fetchPlayerRank(accountId).catch(() => ({ badge: 0, rank: 0, subrank: 0 })),
    ]);

    stats = aggregateHeroStats(heroStats);
    mmr = badgeToMmr(rankData.badge);
  } catch (err) {
    console.error(`[leaderboard] Enrich failed for ${accountId}:`, err);
  }

  const favoriteHeroId = entry.top_hero_ids?.[0] ?? null;
  const heroAsset = favoriteHeroId ? heroes.get(favoriteHeroId) : null;

  const rankChange = prevRankMap?.has(steamId)
    ? (prevRankMap.get(steamId)! - position)
    : null;

  return {
    steamId,
    rank: position,
    playerName,
    avatar: avatarUrl(accountId),
    mmr,
    wins: stats.wins,
    losses: stats.losses,
    winRate: stats.winRate,
    kda: stats.kda,
    averageSouls: stats.averageSouls,
    averagePlayerDamage: stats.averagePlayerDamage,
    averageObjectiveDamage: stats.averageObjectiveDamage,
    averageHealing: stats.averageHealing,
    favoriteHero: heroAsset?.name ?? (favoriteHeroId ? `Hero ${favoriteHeroId}` : 'Unknown'),
    favoriteHeroId,
    favoriteHeroSlug: heroAsset?.slug ?? null,
    favoriteHeroPortrait: heroAsset?.portrait ?? '',
    region,
    lastUpdated: new Date().toISOString(),
    rankChange,
    streak,
    gamesPlayed: stats.gamesPlayed,
  };
}

async function enrichBatch(
  entries: ApiLeaderboardEntry[],
  region: string,
  offset: number,
  prevRankMap: Map<string, number> | undefined
): Promise<LeaderboardPlayer[]> {
  const heroes = await getHeroAssets();
  const results: LeaderboardPlayer[] = [];

  for (let i = 0; i < entries.length; i += ENRICH_CONCURRENCY) {
    const batch = entries.slice(i, i + ENRICH_CONCURRENCY);
    const enriched = await Promise.all(
      batch.map((entry, idx) =>
        enrichEntry(entry, offset + i + idx + 1, region, heroes, prevRankMap)
      )
    );
    results.push(...enriched.filter((p): p is LeaderboardPlayer => p !== null));
  }

  return results;
}

function sortPlayers(
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

function filterPlayers(players: LeaderboardPlayer[], query: LeaderboardQuery): LeaderboardPlayer[] {
  return players.filter((p) => {
    if (query.search && !p.playerName.toLowerCase().includes(query.search.toLowerCase())) {
      return false;
    }
    if (query.minRating != null && p.mmr < query.minRating) return false;
    if (query.maxRating != null && p.mmr > query.maxRating) return false;
    if (query.minWinRate != null && p.winRate < query.minWinRate / 100) return false;
    if (query.minGames != null && p.gamesPlayed < query.minGames) return false;
    if (query.heroId != null && p.favoriteHeroId !== query.heroId) return false;
    return true;
  });
}

const REGION_API_MAP: Record<string, string> = {
  Global: 'NAmerica',
  NAmerica: 'NAmerica',
  Europe: 'Europe',
  SAmerica: 'SAmerica',
  Asia: 'Asia',
  Oceania: 'Oceania',
};

export async function fetchLeaderboard(query: LeaderboardQuery = {}): Promise<LeaderboardResponse> {
  const region = query.region ?? 'NAmerica';
  const apiRegion = REGION_API_MAP[region] ?? 'NAmerica';
  const limit = Math.min(query.limit ?? 100, 500);
  const offset = query.offset ?? 0;
  const cacheKey = `lb:${region}:${query.heroId ?? 'all'}`;

  let allEntries: ApiLeaderboardEntry[];

  const cached = getCached<ApiLeaderboardEntry[]>(cacheKey);
  if (cached) {
    allEntries = cached;
    cacheEntryNames(allEntries);
  } else {
    try {
      const data = await deadlockApiProvider.fetchLeaderboard(apiRegion, query.heroId);
      allEntries = data.entries ?? [];
      cacheEntryNames(allEntries);
      setCache(cacheKey, allEntries);

      const rankMap = new Map<string, number>();
      allEntries.forEach((e, i) => {
        const id = resolveAccountId(e);
        if (id) rankMap.set(String(id), i + 1);
      });
      previousRanks.set(cacheKey, rankMap);
    } catch (err) {
      console.error('[leaderboard] Fetch failed:', err);
      return {
        players: [],
        total: 0,
        region,
        lastFetchedAt: new Date().toISOString(),
        source: 'deadlock-api',
      };
    }
  }

  const prevRankMap = previousRanks.get(cacheKey);
  const slice = allEntries.slice(offset, offset + limit);

  const enrichCacheKey = `${cacheKey}:enriched:${offset}:${limit}`;
  let players = getCached<LeaderboardPlayer[]>(enrichCacheKey);

  if (!players) {
    const heroes = await getHeroAssets();
    players = slice.map((entry, idx) =>
      toBasicPlayer(entry, offset + idx + 1, region, heroes, prevRankMap)
    ).filter((p): p is LeaderboardPlayer => p !== null);

    const toEnrich = slice.slice(0, ENRICH_LIMIT);
    if (toEnrich.length > 0) {
      const enriched = await enrichBatch(toEnrich, region, offset, prevRankMap);
      const enrichedById = new Map(enriched.map((p) => [p.steamId, p]));
      players = players.map((p) => enrichedById.get(p.steamId) ?? p);
    }

    setCache(enrichCacheKey, players, CACHE_TTL_MS);
  }

  return {
    players,
    total: allEntries.length,
    region,
    lastFetchedAt: new Date().toISOString(),
    source: 'deadlock-api',
  };
}

export async function fetchPlayerProfile(steamId: string): Promise<PlayerProfile | null> {
  const accountId = Number(steamId);
  if (!Number.isFinite(accountId)) return null;

  const cacheKey = `player:${accountId}`;
  const cached = getCached<PlayerProfile>(cacheKey);
  if (cached) return cached;

  try {
    const heroes = await getHeroAssets();
    const [heroStats, rankData, matchHistory, mmrHistory] = await Promise.all([
      deadlockApiProvider.fetchHeroStats(accountId),
      deadlockApiProvider.fetchPlayerRank(accountId).catch(() => ({ badge: 0, rank: 0, subrank: 0 })),
      deadlockApiProvider.fetchMatchHistory(accountId, 25),
      deadlockApiProvider.fetchMmrHistory(accountId, 30).catch(() => []),
    ]);

    const aggregated = aggregateHeroStats(heroStats);
    const streak = computeStreak(matchHistory);

    const heroStatsList: PlayerHeroStat[] = heroStats
      .sort((a, b) => b.matches_played - a.matches_played)
      .slice(0, 8)
      .map((s) => {
        const hero = heroes.get(s.hero_id);
        const losses = s.matches_played - s.wins;
        const kda = s.deaths > 0 ? (s.kills + s.assists) / s.deaths : s.kills + s.assists;
        return {
          heroId: s.hero_id,
          heroName: hero?.name ?? `Hero ${s.hero_id}`,
          heroSlug: hero?.slug ?? null,
          heroPortrait: hero?.portrait ?? '',
          matchesPlayed: s.matches_played,
          wins: s.wins,
          winRate: s.matches_played > 0 ? s.wins / s.matches_played : 0,
          kills: s.kills,
          deaths: s.deaths,
          assists: s.assists,
          kda,
        };
      });

    const recentMatches: PlayerMatchEntry[] = matchHistory.map((m) => {
      const hero = heroes.get(m.hero_id);
      return {
        matchId: m.match_id,
        heroId: m.hero_id,
        heroName: hero?.name ?? `Hero ${m.hero_id}`,
        heroPortrait: hero?.portrait ?? '',
        result: isWin(m) ? 'win' : 'loss',
        kills: m.player_kills,
        deaths: m.player_deaths,
        assists: m.player_assists,
        netWorth: m.net_worth,
        durationSeconds: m.match_duration_s,
        startTime: m.start_time,
        rankedDelta: m.ranked_delta,
      };
    });

    const profile: PlayerProfile = {
      steamId: String(accountId),
      playerName: playerNameCache.get(String(accountId)) ?? `Player ${accountId}`,
      avatar: avatarUrl(accountId),
      banner: '',
      rank: rankData.rank,
      rankBadge: rankData.badge,
      rankLabel: badgeLabel(rankData.badge),
      mmr: badgeToMmr(rankData.badge),
      region: 'Unknown',
      wins: aggregated.wins,
      losses: aggregated.losses,
      winRate: aggregated.winRate,
      kda: aggregated.kda,
      averageSouls: aggregated.averageSouls,
      averagePlayerDamage: aggregated.averagePlayerDamage,
      averageObjectiveDamage: aggregated.averageObjectiveDamage,
      averageHealing: aggregated.averageHealing,
      gamesPlayed: aggregated.gamesPlayed,
      heroStats: heroStatsList,
      recentMatches,
      mmrHistory: mmrHistory.map((h) => ({
        date: new Date(h.timestamp * 1000).toISOString(),
        mmr: h.mmr,
      })),
      streak,
      lastUpdated: new Date().toISOString(),
    };

    setCache(cacheKey, profile, CACHE_TTL_MS);
    return profile;
  } catch (err) {
    console.error(`[leaderboard] Player profile failed for ${steamId}:`, err);
    return null;
  }
}

export async function fetchHeroAssetsList(): Promise<HeroAsset[]> {
  const map = await getHeroAssets();
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export * from './types.js';
