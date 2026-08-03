'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { GamePageProps } from '@/games/types';

/** Redirect legacy /deadlock/leaderboards → /deadlock/leaderboard */
export function DeadlockLeaderboardsRedirect(_props: GamePageProps) {
  const router = useRouter();
  useEffect(() => {
    router.replace('/deadlock/leaderboard');
  }, [router]);
  return null;
}
