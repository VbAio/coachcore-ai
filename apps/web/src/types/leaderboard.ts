export type LeaderboardRegion =
  | 'Global'
  | 'NAmerica'
  | 'Europe'
  | 'SAmerica'
  | 'Asia'
  | 'Oceania';

export type LeaderboardSortField =
  | 'rank'
  | 'mmr'
  | 'wins'
  | 'losses'
  | 'winRate'
  | 'kda'
  | 'averageSouls'
  | 'averagePlayerDamage'
  | 'averageObjectiveDamage'
  | 'averageHealing'
  | 'lastUpdated';

export interface LeaderboardPlayer {
  steamId: string;
  rank: number;
  playerName: string;
  avatar: string;
  mmr: number;
  wins: number;
  losses: number;
  winRate: number;
  kda: number;
  averageSouls: number;
  averagePlayerDamage: number;
  averageObjectiveDamage: number;
  averageHealing: number;
  favoriteHero: string;
  favoriteHeroId: number | null;
  favoriteHeroSlug: string | null;
  favoriteHeroPortrait: string;
  region: string;
  lastUpdated: string;
  rankChange: number | null;
  streak: { type: 'win' | 'loss' | 'none'; count: number };
  gamesPlayed: number;
}

export interface LeaderboardQuery {
  region?: LeaderboardRegion;
  heroId?: number;
  minRating?: number;
  maxRating?: number;
  minWinRate?: number;
  minGames?: number;
  search?: string;
  sortBy?: LeaderboardSortField;
  sortDir?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface LeaderboardResponse {
  players: LeaderboardPlayer[];
  total: number;
  region: string;
  lastFetchedAt: string;
  source: string;
}

export interface PlayerHeroStat {
  heroId: number;
  heroName: string;
  heroSlug: string | null;
  heroPortrait: string;
  matchesPlayed: number;
  wins: number;
  winRate: number;
  kills: number;
  deaths: number;
  assists: number;
  kda: number;
}

export interface PlayerMatchEntry {
  matchId: number;
  heroId: number;
  heroName: string;
  heroPortrait: string;
  result: 'win' | 'loss';
  kills: number;
  deaths: number;
  assists: number;
  netWorth: number;
  durationSeconds: number;
  startTime: number;
  rankedDelta: number | null;
}

export interface PlayerProfile {
  steamId: string;
  playerName: string;
  avatar: string;
  banner: string;
  rank: number;
  rankBadge: number;
  rankLabel: string;
  mmr: number;
  region: string;
  wins: number;
  losses: number;
  winRate: number;
  kda: number;
  averageSouls: number;
  averagePlayerDamage: number;
  averageObjectiveDamage: number;
  averageHealing: number;
  gamesPlayed: number;
  heroStats: PlayerHeroStat[];
  recentMatches: PlayerMatchEntry[];
  mmrHistory: Array<{ date: string; mmr: number }>;
  streak: { type: 'win' | 'loss' | 'none'; count: number };
  lastUpdated: string;
}

export interface HeroAsset {
  id: number;
  name: string;
  slug: string;
  portrait: string;
  icon: string;
}

export const REGIONS: { value: LeaderboardRegion; label: string; flag: string }[] = [
  { value: 'Global', label: 'Global', flag: '🌍' },
  { value: 'NAmerica', label: 'North America', flag: '🇺🇸' },
  { value: 'Europe', label: 'Europe', flag: '🇪🇺' },
  { value: 'SAmerica', label: 'South America', flag: '🇧🇷' },
  { value: 'Asia', label: 'Asia', flag: '🌏' },
  { value: 'Oceania', label: 'Oceania', flag: '🇦🇺' },
];
