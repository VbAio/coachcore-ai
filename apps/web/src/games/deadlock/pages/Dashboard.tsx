'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';
import { motion } from 'framer-motion';
import { TrendingUp, Target, Upload, Trophy, AlertTriangle, Sparkles, LogIn } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
} from 'recharts';
import { useGamePath } from '@/shared/context/game-context';
import type { GamePageProps } from '@/games/types';

interface DashboardData {
  recentAnalyses: Array<{ id: string; hero: string | null; grade?: string; createdAt: string; score?: number }>;
  winRate: number;
  avgMistakesPerGame: number;
  improvementScore: number;
  mmrPrediction: number;
  totalReplays?: number;
  hasUploads?: boolean;
  signedIn?: boolean;
  skillHistory?: Array<{ date: string; scores: Record<string, number> }>;
  skillAverages?: {
    mechanics: number;
    macro: number;
    awareness: number;
    positioning: number;
    economy: number;
    teamFighting: number;
  } | null;
  dailyRecommendations: Array<{ title: string; description: string; category: string; priority: string }>;
}

export function DeadlockDashboard(_props: GamePageProps) {
  const replaysPath = useGamePath('replays');
  const { status } = useSession();
  const { data, isLoading } = useQuery({
    queryKey: ['deadlock-dashboard'],
    queryFn: () => apiFetch<DashboardData>('/api/coach/dashboard'),
  });

  const hasUploads = Boolean(data?.hasUploads);
  const signedIn = status === 'authenticated' || Boolean(data?.signedIn);

  const progressData =
    hasUploads && data?.skillHistory?.length
      ? data.skillHistory.map((point, i) => ({
          week: `W${i + 1}`,
          score: point.scores.overall ?? 0,
        }))
      : [
          { week: 'W1', score: 0 },
          { week: 'W2', score: 0 },
          { week: 'W3', score: 0 },
          { week: 'W4', score: 0 },
        ];

  const radarData = hasUploads && data?.skillAverages
    ? [
        { skill: 'Mechanics', value: data.skillAverages.mechanics ?? 0 },
        { skill: 'Macro', value: data.skillAverages.macro ?? 0 },
        { skill: 'Awareness', value: data.skillAverages.awareness ?? 0 },
        { skill: 'Positioning', value: data.skillAverages.positioning ?? 0 },
        { skill: 'Economy', value: data.skillAverages.economy ?? 0 },
        { skill: 'Team Fight', value: data.skillAverages.teamFighting ?? 0 },
      ]
    : [
        { skill: 'Mechanics', value: 0 },
        { skill: 'Macro', value: 0 },
        { skill: 'Awareness', value: 0 },
        { skill: 'Positioning', value: 0 },
        { skill: 'Economy', value: 0 },
        { skill: 'Team Fight', value: 0 },
      ];

  return (
    <div>
      <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-zinc-400">
            {hasUploads
              ? 'Progress updates from your completed replay uploads'
              : 'Stats start at 0 — sign in and upload to track progress'}
          </p>
        </div>
        {signedIn ? (
          <Link href={replaysPath}>
            <Button variant="glow" className="gap-2">
              <Upload className="h-4 w-4" />
              Upload Replay
            </Button>
          </Link>
        ) : (
          <Link href={`/login?callbackUrl=${encodeURIComponent(replaysPath)}`}>
            <Button variant="glow" className="gap-2">
              <LogIn className="h-4 w-4" />
              Sign in to upload
            </Button>
          </Link>
        )}
      </div>

      {!signedIn && (
        <div className="mb-6 rounded-2xl border border-purple-500/30 bg-purple-500/10 px-4 py-3 text-sm text-purple-100">
          Sign in to upload replays and track your improvement. Until then, every stat stays at 0.
        </div>
      )}

      {isLoading ? (
        <div className="py-20 text-center text-zinc-400">Loading dashboard...</div>
      ) : (
        <>
          <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              { label: 'Win Rate', value: `${data?.winRate ?? 0}%`, icon: Trophy, color: 'text-yellow-400' },
              { label: 'Avg Mistakes/Game', value: data?.avgMistakesPerGame ?? 0, icon: AlertTriangle, color: 'text-red-400' },
              { label: 'Improvement Score', value: data?.improvementScore ?? 0, icon: TrendingUp, color: 'text-green-400' },
              { label: 'MMR Prediction', value: `+${data?.mmrPrediction ?? 0}`, icon: Target, color: 'text-purple-400' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ y: -4, borderColor: 'rgba(168,85,247,0.35)' }}
                className="rounded-2xl p-5 glass"
              >
                <stat.icon className={`mb-3 h-5 w-5 ${stat.color}`} />
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="mt-1 text-xs text-zinc-400">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          <div className="mb-8 grid gap-6 lg:grid-cols-3">
            <div className="rounded-2xl p-6 glass lg:col-span-2">
              <h2 className="mb-4 text-lg font-semibold text-white">Weekly Progress</h2>
              {!hasUploads ? (
                <p className="py-16 text-center text-sm text-zinc-500">
                  No progress yet. Upload a replay to start your chart from zero.
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={progressData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="week" stroke="#666" />
                    <YAxis stroke="#666" domain={[0, 100]} />
                    <Tooltip contentStyle={{ background: '#111', border: '1px solid #333' }} />
                    <Line type="monotone" dataKey="score" stroke="#9333ea" strokeWidth={2} dot={{ fill: '#9333ea' }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="rounded-2xl p-6 glass">
              <h2 className="mb-4 text-lg font-semibold text-white">Skill Breakdown</h2>
              {!hasUploads ? (
                <p className="py-16 text-center text-sm text-zinc-500">
                  Skills stay at 0 until your first analysis completes.
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#333" />
                    <PolarAngleAxis dataKey="skill" tick={{ fill: '#888', fontSize: 10 }} />
                    <Radar dataKey="value" stroke="#9333ea" fill="#9333ea" fillOpacity={0.3} />
                  </RadarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <RecentAnalysesList
            analyses={data?.recentAnalyses ?? []}
            tip={data?.dailyRecommendations?.[0]}
            signedIn={signedIn}
            replaysPath={replaysPath}
          />
        </>
      )}
    </div>
  );
}

function RecentAnalysesList({
  analyses,
  tip,
  signedIn,
  replaysPath,
}: {
  analyses: DashboardData['recentAnalyses'];
  tip?: DashboardData['dailyRecommendations'][number];
  signedIn: boolean;
  replaysPath: string;
}) {
  const reportBase = useGamePath('replays');

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-2xl p-6 glass">
        <h2 className="mb-4 text-lg font-semibold text-white">Recent Analyses</h2>
        {analyses.length ? (
          <div className="space-y-3">
            {analyses.map((a) => (
              <Link
                key={a.id}
                href={`${reportBase}/${a.id}/report`}
                className="flex items-center justify-between rounded-xl p-3 transition-colors hover:bg-white/5"
              >
                <div>
                  <p className="font-medium text-white">{a.hero ?? 'Unknown Hero'}</p>
                  <p className="text-xs text-zinc-500">{new Date(a.createdAt).toLocaleDateString()}</p>
                </div>
                {a.grade && <span className="text-lg font-bold text-purple-400">{a.grade}</span>}
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-zinc-500">No analyses yet. Upload your first replay!</p>
        )}
      </div>
      <div className="rounded-2xl p-6 glass">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
          <Sparkles className="h-5 w-5 text-purple-400" />
          Daily Coaching
        </h2>
        <p className="text-sm text-zinc-400">
          {tip?.description ??
            'Upload a replay to receive personalized Deadlock coaching recommendations.'}
        </p>
        {!signedIn ? (
          <Link href={`/login?callbackUrl=${encodeURIComponent(replaysPath)}`} className="mt-4 inline-block">
            <Button variant="outline" size="sm" className="gap-2">
              <LogIn className="h-4 w-4" />
              Sign in
            </Button>
          </Link>
        ) : analyses.length === 0 ? (
          <Link href={replaysPath} className="mt-4 inline-block">
            <Button variant="outline" size="sm" className="gap-2">
              <Upload className="h-4 w-4" />
              Upload replay
            </Button>
          </Link>
        ) : null}
      </div>
    </div>
  );
}
