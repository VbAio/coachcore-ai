import {
  deadlockApiProvider,
  type ApiHeroAsset,
  type ApiHeroStat,
  type ApiMatchHistoryEntry,
} from './provider';
import {
  statlockerProvider,
  type StatlockerRankedEntry,
} from './statlocker-provider';
import type {
  HeroAsset,
  LeaderboardPlayer,
  LeaderboardQuery,
  LeaderboardResponse,
  PlayerHeroStat,
  PlayerMatchEntry,
  PlayerProfile,
} from './types';

const CACHE_TTL_MS = 5 * 60 * 1000;

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
  return `https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg?steam=${steam64}`;
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
  const tiers = [
    'Obscurus',
    'Initiate',
    'Seeker',
    'Alchemist',
    'Arcanist',
    'Ritualist',
    'Emissary',
    'Archon',
    'Oracle',
    'Phantom',
    'Ascendant',
    'Eternus',
  ];
  return `${tiers[Math.min(tier, tiers.length - 1)] ?? 'Unknown'} ${sub}`;
}

function isWin(match: ApiMatchHistoryEntry): boolean {
  return match.match_result === match.player_team;
}

function computeStreak(
  matches: ApiMatchHistoryEntry[]
): { type: 'win' | 'loss' | 'none'; count: number } {
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

function mapRegionLabel(code: string | null | undefined, fallback: string): string {
  if (!code) return fallback;
  const map: Record<string, string> = {
    NA: 'NAmerica',
    EU: 'Europe',
    SA: 'SAmerica',
    Asia: 'Asia',
    OCE: 'Oceania',
    Global: 'Global',
  };
  return map[code] ?? code;
}

function mapStatlockerEntry(
  entry: StatlockerRankedEntry,
  boardRegion: string,
  prevRankMap: Map<string, number> | undefined
): LeaderboardPlayer {
  const steamId = String(entry.accountId);
  playerNameCache.set(steamId, entry.name);
  const rankChange = prevRankMap?.has(steamId)
    ? prevRankMap.get(steamId)! - entry.position
    : null;

  // Statlocker seasonWinRate is already a percentage (e.g. 71.1)
  const winRate =
    entry.seasonGames > 0 ? Math.min(1, Math.max(0, entry.seasonWinRate / 100)) : 0;

  return {
    steamId,
    rank: entry.position,
    playerName: entry.name || `Player ${entry.accountId}`,
    avatar: entry.avatarUrl || avatarUrl(entry.accountId),
    mmr: entry.flatProgress || entry.ppScore || 0,
    wins: entry.seasonWins ?? 0,
    losses: entry.seasonLosses ?? 0,
    winRate,
    kda: 0,
    averageSouls: 0,
    averagePlayerDamage: 0,
    averageObjectiveDamage: 0,
    averageHealing: 0,
    favoriteHero: '',
    favoriteHeroId: null,
    favoriteHeroSlug: null,
    favoriteHeroPortrait: '',
    region: mapRegionLabel(entry.region, boardRegion),
    lastUpdated: new Date().toISOString(),
    rankChange,
    streak: { type: 'none', count: 0 },
    gamesPlayed: entry.seasonGames ?? 0,
    rankName: entry.rankName,
    rankNumber: entry.rankNumber,
    points: entry.points,
    pointsOutOf: entry.pointsOutOf,
    ppRankName: entry.ppRankName,
    ppScore: entry.ppScore,
  };
}

export async function fetchLeaderboard(
  query: LeaderboardQuery = {}
): Promise<LeaderboardResponse> {
  const region = query.region ?? 'Global';
  const limit = Math.min(query.limit ?? 100, 500);
  const offset = query.offset ?? 0;
  const pageSize = limit;
  const page = Math.floor(offset / pageSize) + 1;
  const cacheKey = `lb:statlocker:${region}:${page}:${pageSize}`;

  const cached = getCached<LeaderboardResponse>(cacheKey);
  if (cached) return cached;

  try {
    const data = await statlockerProvider.fetchRankedLeaderboard({
      region,
      page,
      pageSize,
    });

    const prevRankMap = previousRanks.get(`lb:statlocker:${region}`);
    const rankMap = new Map<string, number>();
    for (const e of data.data ?? []) {
      rankMap.set(String(e.accountId), e.position);
    }
    previousRanks.set(`lb:statlocker:${region}`, rankMap);

    const players = (data.data ?? []).map((entry) =>
      mapStatlockerEntry(entry, region, prevRankMap)
    );

    const response: LeaderboardResponse = {
      players,
      total: data.totalCount ?? players.length,
      region,
      lastFetchedAt: new Date().toISOString(),
      source: 'statlocker',
    };
    setCache(cacheKey, response);
    return response;
  } catch (err) {
    console.error('[leaderboard] Statlocker fetch failed:', err);
    return {
      players: [],
      total: 0,
      region,
      lastFetchedAt: new Date().toISOString(),
      source: 'statlocker',
    };
  }
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
      deadlockApiProvider.fetchPlayerRank(accountId).catch(() => ({
        badge: 0,
        rank: 0,
        subrank: 0,
      })),
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
        const kda =
          s.deaths > 0 ? (s.kills + s.assists) / s.deaths : s.kills + s.assists;
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

export * from './types';
