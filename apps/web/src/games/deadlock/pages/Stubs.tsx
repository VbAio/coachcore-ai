import { ComingSoonPage } from '@/shared/components/coming-soon-page';
import type { GamePageProps } from '@/games/types';

export function DeadlockGuidesPage(_p: GamePageProps) {
  return <ComingSoonPage feature="Guides" />;
}
export function DeadlockMapsPage(_p: GamePageProps) {
  return <ComingSoonPage feature="Maps" />;
}
export function DeadlockLeaderboardsPage(_p: GamePageProps) {
  return <ComingSoonPage feature="Leaderboards" />;
}
export function DeadlockSettingsPage(_p: GamePageProps) {
  return <ComingSoonPage feature="Settings" />;
}
