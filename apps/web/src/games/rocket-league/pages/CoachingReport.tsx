'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { GamePageProps } from '@/games/types';
import { RlPremiumAnalysisShell } from '../components/analysis/RlPremiumAnalysisShell';
import { RlAnalysisSkeleton } from '../components/analysis/RlAnalysisSkeleton';
import { normalizeRlPayload } from '../components/analysis/adapter';

export function RocketLeagueCoachingReport({ params }: GamePageProps) {
  const replayId = params?.id;
  const isDemo = replayId === 'demo';

  const { data, isLoading, error } = useQuery({
    queryKey: ['rl-report', replayId],
    queryFn: async () => {
      const path = isDemo ? '/api/rl/demo-report' : `/api/replays/${replayId}/report`;
      const raw = await apiFetch<unknown>(path);
      const payload = normalizeRlPayload(raw);
      if (!payload) throw new Error('Unexpected Rocket League report payload');
      return payload;
    },
    enabled: !!replayId,
    retry: isDemo ? 1 : 3,
    retryDelay: 3000,
  });

  if (isLoading) {
    return (
      <div className="py-6">
        <RlAnalysisSkeleton />
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="py-20 text-center text-zinc-400">
        {isDemo
          ? 'Demo report unavailable — is the API running?'
          : 'Report not available yet. Finish processing, then refresh.'}
      </div>
    );
  }

  return <RlPremiumAnalysisShell data={data} />;
}
