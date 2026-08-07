'use client';

import type { GamePageProps } from '@/games/types';
import { RlLeaderboardPanel } from '../components/leaderboard/RlLeaderboardPanel';

export function RocketLeagueLeaderboardsPage(_props: GamePageProps) {
  return <RlLeaderboardPanel initialPlaylist="2v2" />;
}
