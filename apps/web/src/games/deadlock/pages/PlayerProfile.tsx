'use client';

import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Trophy } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { GamePageProps } from '@/games/types';
import {
  fetchPlayerProfile,
  LEADERBOARD_REFETCH_MS,
  PLAYER_QUERY_KEY,
} from '@/services/leaderboard';
import { useGamePath } from '@/shared/context/game-context';
import { ComingSoonSection } from '../components/coming-soon-section';
import {
  formatKda,
  formatNumber,
  formatWinRate,
  StreakBadge,
  TableSkeleton,
} from '../components/leaderboard/leaderboard-ui';
import { cn } from '@/lib/utils';

export function DeadlockPlayerProfilePage({ params }: GamePageProps) {
  const steamId = params?.steamId;
  const leaderboardPath = useGamePath('leaderboard');
  const heroesPath = useGamePath('heroes');

  const { data: player, isLoading, isError } = useQuery({
    queryKey: [PLAYER_QUERY_KEY, steamId],
    queryFn: () => fetchPlayerProfile(steamId!),
    enabled: !!steamId,
    refetchInterval: LEADERBOARD_REFETCH_MS,
    staleTime: LEADERBOARD_REFETCH_MS,
  });

  if (!steamId) notFound();
  if (!isLoading && (isError || !player)) notFound();

  if (isLoading || !player) {
    return (
      <div>
        <TableSkeleton rows={6} />
      </div>
    );
  }

  const chartData = player.mmrHistory.length
    ? player.mmrHistory.map((h) => ({
        date: new Date(h.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        mmr: h.mmr,
      }))
    : [{ date: 'Now', mmr: player.mmr }];

  return (
    <div>
      <Link
        href={leaderboardPath}
        className="mb-6 inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-purple-400"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Leaderboard
      </Link>

      <header className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-purple-900/30 via-black to-indigo-900/20 shadow-xl">
        <div className="flex flex-col gap-6 p-6 md:flex-row md:items-center md:p-8">
          <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border-2 border-purple-500/30">
            <Image src={player.avatar} alt="" fill className="object-cover" unoptimized />
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold text-white">{player.playerName}</h1>
              <StreakBadge streak={player.streak} />
            </div>
            <p className="mt-1 text-purple-400">{player.rankLabel}</p>
            <div className="mt-4 flex flex-wrap gap-4 text-sm">
              <StatPill label="Rating" value={formatNumber(player.mmr)} accent />
              <StatPill label="Win Rate" value={formatWinRate(player.winRate)} />
              <StatPill label="KDA" value={formatKda(player.kda)} />
              <StatPill label="Games" value={String(player.gamesPlayed)} />
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3">
            <Trophy className="h-5 w-5 text-amber-400" />
            <div>
              <p className="text-xs text-zinc-500">Rank</p>
              <p className="font-bold text-amber-300">#{player.rank || '—'}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Wins" value={String(player.wins)} color="text-green-400" />
        <StatCard label="Losses" value={String(player.losses)} color="text-red-400" />
        <StatCard label="Avg Souls" value={formatNumber(player.averageSouls)} />
        <StatCard label="Avg Damage" value={formatNumber(player.averagePlayerDamage)} />
        <StatCard label="Avg Obj Dmg" value={formatNumber(player.averageObjectiveDamage)} />
        <StatCard label="Avg Healing" value={formatNumber(player.averageHealing)} />
      </div>

      {player.mmrHistory.length > 1 && (
        <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">Recent MMR Change</h2>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="date" stroke="#666" fontSize={12} />
                <YAxis stroke="#666" fontSize={12} />
                <Tooltip
                  contentStyle={{ background: '#111', border: '1px solid #333' }}
                />
                <Line
                  type="monotone"
                  dataKey="mmr"
                  stroke="#a855f7"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      <section className="mt-8">
        <h2 className="mb-4 text-lg font-semibold text-white">Most Played Heroes</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {player.heroStats.map((h) => (
            <div
              key={h.heroId}
              className="rounded-xl border border-white/10 bg-white/[0.02] p-4 transition-colors hover:border-purple-500/30"
            >
              {h.heroSlug ? (
                <Link href={`${heroesPath}/${h.heroSlug}`} className="flex items-center gap-3">
                  <HeroThumb portrait={h.heroPortrait} name={h.heroName} />
                  <HeroStatContent hero={h} />
                </Link>
              ) : (
                <div className="flex items-center gap-3">
                  <HeroThumb portrait={h.heroPortrait} name={h.heroName} />
                  <HeroStatContent hero={h} />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="mb-4 text-lg font-semibold text-white">Recent Matches</h2>
        <div className="overflow-hidden rounded-2xl border border-white/10">
          {player.recentMatches.length === 0 ? (
            <p className="p-6 text-center text-zinc-500">No recent matches available.</p>
          ) : (
            <div className="divide-y divide-white/5">
              {player.recentMatches.map((m) => (
                <div
                  key={m.matchId}
                  className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-white/[0.02]"
                >
                  <span
                    className={cn(
                      'w-10 text-center text-xs font-bold uppercase',
                      m.result === 'win' ? 'text-green-400' : 'text-red-400'
                    )}
                  >
                    {m.result}
                  </span>
                  <HeroThumb portrait={m.heroPortrait} name={m.heroName} size="sm" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{m.heroName}</p>
                    <p className="text-xs text-zinc-500">
                      {new Date(m.startTime * 1000).toLocaleDateString()} ·{' '}
                      {Math.round(m.durationSeconds / 60)}m
                    </p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="text-zinc-300">
                      {m.kills}/{m.deaths}/{m.assists}
                    </p>
                    <p className="text-xs text-zinc-500">{formatNumber(m.netWorth)} souls</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <ComingSoonSection title="Favorite Build" />
      </div>
    </div>
  );
}

function StatPill({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/30 px-3 py-2">
      <p className="text-[10px] uppercase tracking-wider text-zinc-500">{label}</p>
      <p className={cn('font-bold', accent ? 'text-purple-300' : 'text-white')}>{value}</p>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className={cn('mt-1 text-xl font-bold', color ?? 'text-white')}>{value}</p>
    </div>
  );
}

function HeroThumb({
  portrait,
  name,
  size = 'md',
}: {
  portrait: string;
  name: string;
  size?: 'sm' | 'md';
}) {
  const dim = size === 'sm' ? 'h-8 w-8' : 'h-10 w-10';
  return portrait ? (
    <div className={cn('relative shrink-0 overflow-hidden rounded-lg', dim)}>
      <Image src={portrait} alt={name} fill className="object-cover" unoptimized />
    </div>
  ) : (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-lg bg-purple-500/20 font-bold text-purple-300',
        dim
      )}
    >
      {name.charAt(0)}
    </div>
  );
}

function HeroStatContent({
  hero,
}: {
  hero: {
    heroName: string;
    matchesPlayed: number;
    winRate: number;
    kda: number;
  };
}) {
  return (
    <div>
      <p className="font-medium text-white">{hero.heroName}</p>
      <p className="text-xs text-zinc-500">
        {hero.matchesPlayed} games · {formatWinRate(hero.winRate)} WR ·{' '}
        {formatKda(hero.kda)} KDA
      </p>
    </div>
  );
}
