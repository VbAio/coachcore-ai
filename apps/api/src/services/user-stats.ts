import { prisma } from '../lib/prisma.js';
import type { CoachingReport, SkillScores } from '@coachcore/shared';

type SkillHistoryPoint = { date: string; scores: Record<string, number> };
type FavoriteHero = { hero: string; games: number; winRate: number };

const SKILL_KEYS: Array<keyof SkillScores> = [
  'mechanics',
  'macro',
  'awareness',
  'positioning',
  'consistency',
  'economy',
  'aggression',
  'teamFighting',
  'overall',
];

function countMistakes(report: CoachingReport): number {
  return (report.timeline ?? []).filter((i) => i.polarity === 'mistake').length;
}

/** Keep Deadlock dashboard stats free of Rocket League rows */
function isRocketLeagueReplay(row: {
  fileName?: string | null;
  metadata?: unknown;
  report?: { report?: unknown } | null;
}): boolean {
  if (row.fileName?.toLowerCase().endsWith('.replay')) return true;
  const meta = row.metadata as { game?: string } | null;
  if (meta?.game === 'rocket-league') return true;
  const report = row.report?.report as { game?: string } | null;
  return report?.game === 'rocket-league';
}

function averageSkillScores(list: SkillScores[]): SkillScores | null {
  if (!list.length) return null;
  const sums: Record<string, number> = {};
  for (const key of SKILL_KEYS) sums[key as string] = 0;
  for (const scores of list) {
    for (const key of SKILL_KEYS) {
      sums[key as string] += Number(scores[key] ?? 0);
    }
  }
  const n = list.length;
  return {
    mechanics: Math.round(sums.mechanics / n),
    macro: Math.round(sums.macro / n),
    awareness: Math.round(sums.awareness / n),
    positioning: Math.round(sums.positioning / n),
    consistency: Math.round(sums.consistency / n),
    economy: Math.round(sums.economy / n),
    aggression: Math.round(sums.aggression / n),
    teamFighting: Math.round(sums.teamFighting / n),
    overall: Math.round(sums.overall / n),
  };
}

function buildSkillHistory(
  rows: Array<{ createdAt: Date; report: CoachingReport }>
): SkillHistoryPoint[] {
  const byWeek = new Map<
    string,
    { total: number; count: number; skills: SkillScores[] }
  >();

  for (const row of rows) {
    const d = new Date(row.createdAt);
    const weekStart = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    weekStart.setUTCDate(weekStart.getUTCDate() - weekStart.getUTCDay());
    const key = weekStart.toISOString().slice(0, 10);
    const bucket = byWeek.get(key) ?? { total: 0, count: 0, skills: [] };
    bucket.total += row.report.overallScore ?? 0;
    bucket.count += 1;
    if (row.report.skillScores) bucket.skills.push(row.report.skillScores);
    byWeek.set(key, bucket);
  }

  return [...byWeek.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, bucket]) => {
      const avg = averageSkillScores(bucket.skills);
      return {
        date,
        scores: {
          overall: Math.round(bucket.total / bucket.count),
          mechanics: avg?.mechanics ?? 0,
          macro: avg?.macro ?? 0,
          awareness: avg?.awareness ?? 0,
          positioning: avg?.positioning ?? 0,
          economy: avg?.economy ?? 0,
          teamFighting: avg?.teamFighting ?? 0,
        },
      };
    });
}

function estimateWinRate(
  rows: Array<{ timeline: unknown }>
): number {
  let wins = 0;
  let total = 0;
  for (const row of rows) {
    const timeline = row.timeline as { teamFights?: Array<{ outcome?: string }> } | null;
    const fights = timeline?.teamFights ?? [];
    const fightWins = fights.filter((f) => f.outcome === 'won').length;
    const fightLosses = fights.filter((f) => f.outcome === 'lost').length;
    const decided = fightWins + fightLosses;
    if (decided === 0) continue;
    total += 1;
    if (fightWins >= fightLosses) wins += 1;
  }
  if (total === 0) return 0;
  return Math.round((wins / total) * 1000) / 10;
}

function buildFavoriteHeroes(
  rows: Array<{ hero: string | null; timeline: unknown }>
): FavoriteHero[] {
  const map = new Map<string, { games: number; wins: number }>();
  for (const row of rows) {
    const hero = row.hero?.trim();
    if (!hero) continue;
    const entry = map.get(hero) ?? { games: 0, wins: 0 };
    entry.games += 1;
    const timeline = row.timeline as { teamFights?: Array<{ outcome?: string }> } | null;
    const fights = timeline?.teamFights ?? [];
    const fightWins = fights.filter((f) => f.outcome === 'won').length;
    const fightLosses = fights.filter((f) => f.outcome === 'lost').length;
    if (fightWins + fightLosses > 0 && fightWins >= fightLosses) entry.wins += 1;
    map.set(hero, entry);
  }
  return [...map.entries()]
    .map(([hero, v]) => ({
      hero,
      games: v.games,
      winRate: v.games ? Math.round((v.wins / v.games) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.games - a.games)
    .slice(0, 5);
}

export function emptyDashboardStats() {
  return {
    totalReplays: 0,
    winRate: 0,
    avgMistakesPerGame: 0,
    improvementScore: 0,
    mmrPrediction: 0,
    skillHistory: [] as SkillHistoryPoint[],
    favoriteHeroes: [] as FavoriteHero[],
    skillAverages: null as SkillScores | null,
  };
}

/** Recompute persisted UserStats from completed coaching reports for a user. */
export async function recomputeUserStats(userId: string) {
  const allReplays = await prisma.replay.findMany({
    where: { userId, status: 'complete', report: { isNot: null } },
    include: { report: true },
    orderBy: { createdAt: 'asc' },
  });
  const replays = allReplays.filter((r) => !isRocketLeagueReplay(r));

  if (!replays.length) {
    const empty = emptyDashboardStats();
    await prisma.userStats.upsert({
      where: { userId },
      create: {
        userId,
        totalReplays: 0,
        winRate: 0,
        avgMistakesPerGame: 0,
        improvementScore: 0,
        mmrPrediction: 0,
        skillHistory: [],
        favoriteHeroes: [],
      },
      update: {
        totalReplays: 0,
        winRate: 0,
        avgMistakesPerGame: 0,
        improvementScore: 0,
        mmrPrediction: 0,
        skillHistory: [],
        favoriteHeroes: [],
      },
    });
    return empty;
  }

  const parsed = replays.map((r) => ({
    createdAt: r.createdAt,
    hero: r.hero,
    timeline: r.timeline,
    report: r.report!.report as unknown as CoachingReport,
    score: r.report!.score,
  }));

  const totalReplays = parsed.length;
  const avgScore =
    parsed.reduce((sum, r) => sum + (r.score ?? r.report.overallScore ?? 0), 0) / totalReplays;
  const avgMistakes =
    parsed.reduce((sum, r) => sum + countMistakes(r.report), 0) / totalReplays;
  const winRate = estimateWinRate(parsed);
  const improvementScore = Math.round(avgScore);
  const mmrPrediction = Math.max(0, Math.round((avgScore - 50) * 8));
  const skillHistory = buildSkillHistory(parsed);
  const favoriteHeroes = buildFavoriteHeroes(parsed);
  const skillAverages = averageSkillScores(
    parsed.map((p) => p.report.skillScores).filter(Boolean) as SkillScores[]
  );

  await prisma.userStats.upsert({
    where: { userId },
    create: {
      userId,
      totalReplays,
      winRate,
      avgMistakesPerGame: Math.round(avgMistakes * 10) / 10,
      improvementScore,
      mmrPrediction,
      skillHistory,
      favoriteHeroes,
    },
    update: {
      totalReplays,
      winRate,
      avgMistakesPerGame: Math.round(avgMistakes * 10) / 10,
      improvementScore,
      mmrPrediction,
      skillHistory,
      favoriteHeroes,
    },
  });

  return {
    totalReplays,
    winRate,
    avgMistakesPerGame: Math.round(avgMistakes * 10) / 10,
    improvementScore,
    mmrPrediction,
    skillHistory,
    favoriteHeroes,
    skillAverages,
  };
}

/** Build dashboard payload from DB — zeros until the user has completed uploads. */
export async function getDashboardStatsForUser(userId: string | undefined) {
  if (!userId) {
    return {
      ...emptyDashboardStats(),
      recentAnalyses: [] as Array<{
        id: string;
        hero: string | null;
        grade?: string;
        createdAt: Date;
        score?: number;
      }>,
      dailyRecommendations: [
        {
          title: 'Sign in to track progress',
          description: 'Create an account, then upload replays to grow your stats from zero.',
          category: 'getting_started',
          priority: 'high' as const,
        },
      ],
      signedIn: false,
      hasUploads: false,
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      stats: true,
      replays: {
        include: { report: true },
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
    },
  });

  if (!user) {
    return {
      ...emptyDashboardStats(),
      recentAnalyses: [],
      dailyRecommendations: [
        {
          title: 'Sign in to track progress',
          description: 'Create an account, then upload replays to grow your stats from zero.',
          category: 'getting_started',
          priority: 'high' as const,
        },
      ],
      signedIn: false,
      hasUploads: false,
    };
  }

  const completedReplays = user.replays.filter(
    (r) => r.status === 'complete' && r.report && !isRocketLeagueReplay(r)
  );
  const hasUploads = completedReplays.length > 0;

  const live = hasUploads ? await recomputeUserStats(userId) : emptyDashboardStats();

  const recentAnalyses = user.replays
    .filter((r) => !isRocketLeagueReplay(r))
    .slice(0, 5)
    .map((r) => ({
      id: r.id,
      hero: r.hero,
      grade: r.report?.grade,
      score: r.report?.score,
      createdAt: r.createdAt,
    }));

  const dailyRecommendations = !hasUploads
    ? [
        {
          title: 'Upload your first replay',
          description: 'Your stats stay at 0 until you upload and finish analyzing a .dem.',
          category: 'getting_started',
          priority: 'high' as const,
        },
      ]
    : (user.stats && live.totalReplays > 0
        ? [
            {
              title: 'Keep uploading',
              description: `You’ve analyzed ${live.totalReplays} replay${live.totalReplays === 1 ? '' : 's'}. Each completed upload updates your tracked progress.`,
              category: 'progress',
              priority: 'medium' as const,
            },
          ]
        : []);

  return {
    ...live,
    recentAnalyses,
    dailyRecommendations,
    signedIn: true,
    hasUploads,
  };
}
