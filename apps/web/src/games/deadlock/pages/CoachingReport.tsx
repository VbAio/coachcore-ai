'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { CoachingReport, CoachInsight } from '@coachcore/shared';
import { useState } from 'react';
import { Clock, Info, ChevronRight, AlertTriangle, TrendingUp, Target, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { GamePageProps } from '@/games/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function InsightCard({ insight }: { insight: CoachInsight }) {
  return (
    <div className="glass rounded-xl p-5 border-l-4 border-purple-500 mb-4">
      <div className="flex items-center gap-2 mb-2">
        <Clock className="h-4 w-4 text-purple-400" />
        <span className="text-sm font-mono text-purple-300">{formatTime(insight.timestamp)}</span>
        {insight.isEstimate && (
          <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full flex items-center gap-1">
            <Info className="h-3 w-3" /> Estimate
          </span>
        )}
      </div>
      <h4 className="font-semibold text-white mb-2">{insight.title}</h4>
      <p className="text-sm text-zinc-300">{insight.whatHappened}</p>
      <p className="text-sm text-green-400 mt-2">{insight.alternativePlay}</p>
    </div>
  );
}

export function DeadlockCoachingReport({ params }: GamePageProps) {
  const replayId = params?.id;
  const [activeTab, setActiveTab] = useState('overview');

  const { data: report, isLoading } = useQuery({
    queryKey: ['report', replayId],
    queryFn: () => apiFetch<CoachingReport>(`/api/replays/${replayId}/report`),
    enabled: !!replayId,
    retry: 3,
    retryDelay: 3000,
  });

  if (isLoading) {
    return <div className="text-center py-20 text-zinc-400">Generating coaching report...</div>;
  }
  if (!report) {
    return <div className="text-center py-20 text-zinc-400">Report not available yet.</div>;
  }

  const tabs = ['overview', 'lane', 'timeline', 'improvement'] as const;
  const skillData = Object.entries(report.skillScores)
    .filter(([k]) => k !== 'overall')
    .map(([skill, value]) => ({ skill: skill.charAt(0).toUpperCase() + skill.slice(1), value }));

  return (
    <div>
      <div className="glass rounded-2xl p-8 mb-6 glow-purple">
        <div className="flex items-center gap-4">
          <span className="text-5xl font-black text-purple-400">{report.overallGrade}</span>
          <div>
            <h1 className="text-2xl font-bold text-white">Coaching Report</h1>
            <p className="text-zinc-400">Score {report.overallScore}/100 · {report.currentPerformance}</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {report.topPriorities.map((p, i) => (
            <span key={i} className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-sm capitalize">{i + 1}. {p}</span>
          ))}
        </div>
      </div>

      <div className="flex gap-1 mb-6 overflow-x-auto">
        {tabs.map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={cn(
            'px-4 py-2 rounded-lg text-sm capitalize whitespace-nowrap',
            activeTab === tab ? 'bg-purple-500/20 text-purple-300' : 'text-zinc-400 hover:text-white'
          )}>{tab}</button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={skillData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis type="number" domain={[0, 100]} stroke="#666" />
            <YAxis type="category" dataKey="skill" stroke="#666" width={80} tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={{ background: '#111', border: '1px solid #333' }} />
            <Bar dataKey="value" fill="#9333ea" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
      {activeTab === 'lane' && report.lanePhaseAnalysis.map((insight, i) => <InsightCard key={i} insight={insight} />)}
      {activeTab === 'timeline' && report.timeline.map((insight, i) => <InsightCard key={i} insight={insight} />)}
      {activeTab === 'improvement' && (
        <div className="glass rounded-2xl p-6 space-y-4">
          <p className="text-white"><strong className="text-purple-400">Today:</strong> {report.improvementPlan.todaysFocus}</p>
          <p className="text-white"><strong className="text-purple-400">This week:</strong> {report.improvementPlan.weeklyFocus}</p>
          <ul className="space-y-2">
            {report.improvementPlan.practiceDrills.map((d, i) => (
              <li key={i} className="text-sm text-zinc-300 flex items-center gap-2"><ChevronRight className="h-4 w-4 text-purple-400" />{d}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
