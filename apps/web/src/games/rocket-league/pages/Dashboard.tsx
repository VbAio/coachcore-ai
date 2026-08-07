'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';
import { motion } from 'framer-motion';
import { Upload, LogIn, Target, Gauge, Zap, Shield } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
} from 'recharts';
import { useGamePath } from '@/shared/context/game-context';
import type { GamePageProps } from '@/games/types';

interface RlReplayItem {
  id: string;
  fileName: string;
  hero: string;
  map: string;
  grade?: string;
  status: string;
  createdAt: string;
}

export function RocketLeagueDashboard(_props: GamePageProps) {
  const replaysPath = useGamePath('replays');
  const { status } = useSession();
  const signedIn = status === 'authenticated';

  const { data: list, isLoading } = useQuery({
    queryKey: ['rl-replays'],
    queryFn: () => apiFetch<{ items: RlReplayItem[]; total: number }>('/api/replays'),
    enabled: signedIn,
  });

  const rlItems = (list?.items ?? []).filter((i) =>
    i.fileName.toLowerCase().endsWith('.replay')
  );
  const hasUploads = rlItems.some((i) => i.status === 'complete');
  const completed = rlItems.filter((i) => i.status === 'complete');

  const progressData = hasUploads
    ? completed
        .slice(0, 8)
        .reverse()
        .map((r, i) => ({ week: `M${i + 1}`, score: r.grade ? gradeToScore(r.grade) : 0 }))
    : [
        { week: 'M1', score: 0 },
        { week: 'M2', score: 0 },
        { week: 'M3', score: 0 },
        { week: 'M4', score: 0 },
      ];

  const radarData = [
    { skill: 'Mechanics', value: 0 },
    { skill: 'Boost', value: 0 },
    { skill: 'Rotation', value: 0 },
    { skill: 'Defense', value: 0 },
    { skill: 'Aerial', value: 0 },
    { skill: 'Kickoff', value: 0 },
  ];

  return (
    <div className="rl-dashboard">
      <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Rocket League</h1>
          <p className="text-zinc-400">
            {hasUploads
              ? 'SSL-style coaching from your completed .replay uploads'
              : 'Stats start at 0 — sign in and upload a .replay to begin'}
          </p>
        </div>
        {signedIn ? (
          <Link href={replaysPath}>
            <Button className="gap-2 bg-sky-500 text-white hover:bg-sky-400">
              <Upload className="h-4 w-4" />
              Upload Replay
            </Button>
          </Link>
        ) : (
          <Link href={`/login?callbackUrl=${encodeURIComponent(replaysPath)}`}>
            <Button className="gap-2 bg-sky-500 text-white hover:bg-sky-400">
              <LogIn className="h-4 w-4" />
              Sign in to upload
            </Button>
          </Link>
        )}
      </div>

      {!signedIn && (
        <div className="mb-6 rounded-2xl border border-sky-500/30 bg-sky-500/10 px-4 py-3 text-sm text-sky-100">
          Sign in to upload Rocket League replays. Until then, every stat stays at 0.
        </div>
      )}

      {isLoading && signedIn ? (
        <div className="py-20 text-center text-zinc-400">Loading dashboard...</div>
      ) : (
        <>
          <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              {
                label: 'Replays Analyzed',
                value: completed.length,
                icon: Target,
                color: 'text-sky-400',
              },
              {
                label: 'Latest Grade',
                value: completed[0]?.grade ?? '—',
                icon: Gauge,
                color: 'text-orange-400',
              },
              {
                label: 'Boost Focus',
                value: hasUploads ? 'Active' : '0',
                icon: Zap,
                color: 'text-amber-300',
              },
              {
                label: 'Defense Focus',
                value: hasUploads ? 'Active' : '0',
                icon: Shield,
                color: 'text-emerald-400',
              },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-2xl border border-white/10 bg-gradient-to-br from-sky-500/10 via-transparent to-orange-500/10 p-5 backdrop-blur-xl"
              >
                <stat.icon className={`mb-3 h-5 w-5 ${stat.color}`} />
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="mt-1 text-xs text-zinc-400">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          <div className="mb-8 grid gap-6 lg:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl lg:col-span-2">
              <h2 className="mb-4 text-lg font-semibold text-white">Match Progress</h2>
              {!hasUploads ? (
                <p className="py-16 text-center text-sm text-zinc-500">
                  No progress yet. Upload a .replay to start from zero.
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={progressData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="week" stroke="#666" />
                    <YAxis stroke="#666" domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{ background: '#111', border: '1px solid #333' }}
                      labelStyle={{ color: '#fff' }}
                    />
                    <Line type="monotone" dataKey="score" stroke="#38bdf8" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl">
              <h2 className="mb-4 text-lg font-semibold text-white">Skill Axes</h2>
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#333" />
                  <PolarAngleAxis dataKey="skill" tick={{ fill: '#a1a1aa', fontSize: 11 }} />
                  <Radar dataKey="value" stroke="#f97316" fill="#f97316" fillOpacity={0.25} />
                </RadarChart>
              </ResponsiveContainer>
              {!hasUploads && (
                <p className="mt-2 text-center text-xs text-zinc-500">Zeros until first analysis</p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Recent Analyses</h2>
              <div className="flex gap-3 text-xs">
                <Link href="/rocket-league/leaderboard" className="text-orange-400 hover:text-orange-300">
                  Leaderboard
                </Link>
                <Link
                  href="/rocket-league/replays?demo=1"
                  className="text-sky-400 hover:text-sky-300"
                >
                  Open demo report
                </Link>
              </div>
            </div>
            {!hasUploads ? (
              <p className="py-10 text-center text-sm text-zinc-500">
                Upload a replay or open the demo report to preview the SSL coaching shell.
              </p>
            ) : (
              <ul className="space-y-3">
                {completed.slice(0, 5).map((r) => (
                  <li key={r.id}>
                    <Link
                      href={`/rocket-league/replays/${r.id}/report`}
                      className="flex items-center justify-between rounded-xl border border-white/5 bg-black/20 px-4 py-3 transition hover:border-sky-500/40"
                    >
                      <div>
                        <p className="text-sm font-medium text-white">{r.map}</p>
                        <p className="text-xs text-zinc-500">{new Date(r.createdAt).toLocaleString()}</p>
                      </div>
                      <span className="text-lg font-bold text-orange-400">{r.grade ?? '—'}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function gradeToScore(grade: string): number {
  const map: Record<string, number> = { 'A+': 96, A: 90, B: 80, C: 70, D: 58, F: 40 };
  return map[grade] ?? 50;
}
