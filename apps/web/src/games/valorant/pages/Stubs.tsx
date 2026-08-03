import { ComingSoonPage } from '@/shared/components/coming-soon-page';
import type { GamePageProps } from '@/games/types';

export function ValorantMaps(_p: GamePageProps) { return <ComingSoonPage feature="Maps" />; }
export function ValorantEconomy(_p: GamePageProps) { return <ComingSoonPage feature="Economy" />; }
export function ValorantVODReview(_p: GamePageProps) { return <ComingSoonPage feature="VOD Review" />; }
export function ValorantLeaderboards(_p: GamePageProps) { return <ComingSoonPage feature="Leaderboards" />; }
export function ValorantSettings(_p: GamePageProps) { return <ComingSoonPage feature="Settings" />; }
