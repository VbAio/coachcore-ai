'use client';

import { GameUnavailablePage } from '@/shared/components/coming-soon-page';
import type { GamePageProps } from '@/games/types';
import type { ComponentType } from 'react';

export function createComingSoonDashboard(gameName: string): ComponentType<GamePageProps> {
  return function ComingSoonDashboardPage(_props: GamePageProps) {
    return <GameUnavailablePage gameName={gameName} />;
  };
}
