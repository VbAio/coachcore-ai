'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';
import { motion } from 'framer-motion';
import { TrendingUp, Target, Upload, Trophy, AlertTriangle, Sparkles } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
} from 'recharts';
import { useGamePath } from '@/shared/context/game-context';
import type { GamePageProps } from '@/games/types';

interface DashboardData {
  recentAnalyses: Array<{ id: string; hero: string; grade?: string; createdAt: string }>;
  winRate: number;
  avgMistakesPerGame: number;
  improvementScore: number;
  mmrPrediction: number;
  dailyRecommendations: Array<{ title: string; description: string; category: string; priority: string }>;
}

export function DeadlockDashboard(_props: GamePageProps) {
  const replaysPath = useGamePath('replays');
  const { data, isLoading } = useQuery({
    queryKey: ['deadlock-dashboard'],
    queryFn: () => apiFetch<DashboardData>('/api/coach/dashboard'),
  });

  const progressData = [
    { week: 'W1', score: 62 },
    { week: 'W2', score: 68 },
    { week: 'W3', score: 71 },
    { week: 'W4', score: data?.improvementScore ?? 74 },
  ];

  const radarData = [
    { skill: 'Mechanics', value: 72 },
    { skill: 'Macro', value: 65 },
    { skill: 'Awareness', value: 58 },
    { skill: 'Positioning', value: 70 },
    { skill: 'Economy', value: 68 },
    { skill: 'Team Fight', value: 63 },
  ];

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-zinc-400">Track your Deadlock improvement</p>
        </div>
        <Link href={replaysPath}>
          <Button variant="glow" className="gap-2">
            <Upload className="h-4 w-4" />
            Upload Replay
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="text-zinc-400 text-center py-20">Loading dashboard...</div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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

          <div className="grid lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2 glass rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Weekly Progress</h2>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={progressData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="week" stroke="#666" />
                  <YAxis stroke="#666" domain={[50, 100]} />
                  <Tooltip contentStyle={{ background: '#111', border: '1px solid #333' }} />
                  <Line type="monotone" dataKey="score" stroke="#9333ea" strokeWidth={2} dot={{ fill: '#9333ea' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="glass rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Skill Breakdown</h2>
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#333" />
                  <PolarAngleAxis dataKey="skill" tick={{ fill: '#888', fontSize: 10 }} />
                  <Radar dataKey="value" stroke="#9333ea" fill="#9333ea" fillOpacity={0.3} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <RecentAnalysesList analyses={data?.recentAnalyses ?? []} />
        </>
      )}
    </div>
  );
}

function RecentAnalysesList({
  analyses,
}: {
  analyses: DashboardData['recentAnalyses'];
}) {
  const reportBase = useGamePath('replays');

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="glass rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Recent Analyses</h2>
        {analyses.length ? (
          <div className="space-y-3">
            {analyses.map((a) => (
              <Link
                key={a.id}
                href={`${reportBase}/${a.id}/report`}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors"
              >
                <div>
                  <p className="text-white font-medium">{a.hero ?? 'Unknown Hero'}</p>
                  <p className="text-xs text-zinc-500">{new Date(a.createdAt).toLocaleDateString()}</p>
                </div>
                {a.grade && <span className="text-lg font-bold text-purple-400">{a.grade}</span>}
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-zinc-500 text-sm">No analyses yet. Upload your first replay!</p>
        )}
      </div>
      <div className="glass rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-400" />
          Daily Coaching
        </h2>
        <p className="text-sm text-zinc-400">Upload a replay to receive personalized Deadlock coaching recommendations.</p>
      </div>
    </div>
  );
}
