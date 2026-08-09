'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { CoachingReport, CoachingReportPayload, MatchTimeline } from '@clutchcore/shared';
import type { GamePageProps } from '@/games/types';
import { PremiumAnalysisShell } from '../components/analysis/PremiumAnalysisShell';
import { AnalysisSkeleton } from '../components/analysis/AnalysisSkeleton';

function normalizePayload(raw: unknown): CoachingReportPayload | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;

  if (obj.report && typeof obj.report === 'object') {
    return {
      report: obj.report as CoachingReport,
      timeline: (obj.timeline as MatchTimeline | null) ?? null,
    };
  }

  if ('overallGrade' in obj && 'skillScores' in obj) {
    return { report: obj as unknown as CoachingReport, timeline: null };
  }

  return null;
}

export function DeadlockCoachingReport({ params }: GamePageProps) {
  const replayId = params?.id;

  const { data, isLoading, error } = useQuery({
    queryKey: ['report', replayId],
    queryFn: async () => {
      const raw = await apiFetch<unknown>(`/api/replays/${replayId}/report`);
      const payload = normalizePayload(raw);
      if (!payload) throw new Error('Unexpected report payload');
      return payload;
    },
    enabled: !!replayId,
    retry: 3,
    retryDelay: 3000,
  });

  if (isLoading) {
    return (
      <div className="py-6">
        <AnalysisSkeleton />
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="py-20 text-center text-zinc-400">
        Report not available yet. Finish processing, then refresh.
      </div>
    );
  }

  return <PremiumAnalysisShell data={data} />;
}
