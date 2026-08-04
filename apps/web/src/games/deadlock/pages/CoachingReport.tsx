'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { CoachingReport, CoachInsight } from '@coachcore/shared';
import { useState } from 'react';
import { Clock, Info, ChevronRight, AlertTriangle } from 'lucide-react';
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
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <Clock className="h-4 w-4 text-purple-400" />
        <span className="text-sm font-mono text-purple-300">{formatTime(insight.timestamp)}</span>
        <span className="text-xs uppercase tracking-wide text-zinc-500">{insight.severity}</span>
        {insight.isEstimate && (
          <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full flex items-center gap-1">
            <Info className="h-3 w-3" /> Estimate
          </span>
        )}
      </div>
      <h4 className="font-semibold text-white mb-2">{insight.title}</h4>
      <p className="text-sm text-zinc-300">{insight.whatHappened}</p>
      {insight.whyItHappened && (
        <p className="text-sm text-zinc-400 mt-2">
          <span className="text-zinc-500">Why: </span>
          {insight.whyItHappened}
        </p>
      )}
      <p className="text-sm text-green-400 mt-2">{insight.alternativePlay}</p>
      {insight.drills?.length > 0 && (
        <ul className="mt-3 space-y-1">
          {insight.drills.slice(0, 3).map((drill, i) => (
            <li key={i} className="text-xs text-zinc-500 flex items-start gap-1">
              <ChevronRight className="h-3 w-3 mt-0.5 text-purple-400 shrink-0" />
              {drill}
            </li>
          ))}
        </ul>
      )}
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

  const confidence = report.extractionConfidence ?? 'minimal';
  const coachSummary = report.heroSpecificCoaching.find((i) => i.title === 'Coach summary');
  const timelineInsights = report.timeline.length
    ? report.timeline
    : [...report.lanePhaseAnalysis, ...report.macroAnalysis].sort(
        (a, b) => a.timestamp - b.timestamp
      );

  return (
    <div>
      <div className="glass rounded-2xl p-8 mb-6 glow-purple">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="text-5xl font-black text-purple-400">{report.overallGrade}</span>
          <div className="flex-1 min-w-[200px]">
            <h1 className="text-2xl font-bold text-white">Coaching Report</h1>
            <p className="text-zinc-400">
              Score {report.overallScore}/100 · {report.currentPerformance}
            </p>
            <p className="text-sm text-zinc-500 mt-1">
              Weakness: {report.biggestWeakness} · Strength: {report.biggestStrength}
            </p>
          </div>
          <span
            className={cn(
              'text-xs px-2.5 py-1 rounded-full border',
              confidence === 'full'
                ? 'border-green-500/30 text-green-300 bg-green-500/10'
                : confidence === 'partial'
                  ? 'border-amber-500/30 text-amber-300 bg-amber-500/10'
                  : 'border-yellow-500/30 text-yellow-300 bg-yellow-500/10'
            )}
          >
            Parse: {confidence}
          </span>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {report.topPriorities.map((p, i) => (
            <span
              key={i}
              className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-sm capitalize"
            >
              {i + 1}. {p}
            </span>
          ))}
        </div>
      </div>

      {report.parserNotes && report.parserNotes.length > 0 && (
        <div className="mb-6 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
          <div className="flex items-center gap-2 text-amber-300 text-sm font-medium mb-2">
            <AlertTriangle className="h-4 w-4" />
            Parser notes
          </div>
          <ul className="space-y-1">
            {report.parserNotes.map((note, i) => (
              <li key={i} className="text-xs text-zinc-400">
                {note}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex gap-1 mb-6 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm capitalize whitespace-nowrap',
              activeTab === tab ? 'bg-purple-500/20 text-purple-300' : 'text-zinc-400 hover:text-white'
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          {coachSummary && (
            <div className="glass rounded-xl p-5">
              <h3 className="text-white font-semibold mb-2">AI coach summary</h3>
              <p className="text-sm text-zinc-300">{coachSummary.whatHappened}</p>
            </div>
          )}
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={skillData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis type="number" domain={[0, 100]} stroke="#666" />
              <YAxis
                type="category"
                dataKey="skill"
                stroke="#666"
                width={80}
                tick={{ fontSize: 11 }}
              />
              <Tooltip contentStyle={{ background: '#111', border: '1px solid #333' }} />
              <Bar dataKey="value" fill="#9333ea" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      {activeTab === 'lane' &&
        (report.lanePhaseAnalysis.length ? (
          report.lanePhaseAnalysis.map((insight, i) => <InsightCard key={i} insight={insight} />)
        ) : (
          <p className="text-zinc-500 text-sm">No lane-phase insights for this replay.</p>
        ))}
      {activeTab === 'timeline' &&
        (timelineInsights.length ? (
          timelineInsights.map((insight, i) => <InsightCard key={i} insight={insight} />)
        ) : (
          <p className="text-zinc-500 text-sm">No timeline insights for this replay.</p>
        ))}
      {activeTab === 'improvement' && (
        <div className="glass rounded-2xl p-6 space-y-4">
          <p className="text-white">
            <strong className="text-purple-400">Today:</strong> {report.improvementPlan.todaysFocus}
          </p>
          <p className="text-white">
            <strong className="text-purple-400">This week:</strong>{' '}
            {report.improvementPlan.weeklyFocus}
          </p>
          <p className="text-white">
            <strong className="text-purple-400">Next match:</strong>{' '}
            {report.improvementPlan.goalForNextMatch}
          </p>
          <ul className="space-y-2">
            {report.improvementPlan.practiceDrills.map((d, i) => (
              <li key={i} className="text-sm text-zinc-300 flex items-center gap-2">
                <ChevronRight className="h-4 w-4 text-purple-400" />
                {d}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
