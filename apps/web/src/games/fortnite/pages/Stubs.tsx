import { ComingSoonPage } from '@/shared/components/coming-soon-page';
import type { GamePageProps } from '@/games/types';

export function FortnitePOIs(_p: GamePageProps) { return <ComingSoonPage feature="POIs" />; }
export function FortniteMatchAnalysis(_p: GamePageProps) { return <ComingSoonPage feature="Match Analysis" />; }
export function FortniteWeapons(_p: GamePageProps) { return <ComingSoonPage feature="Weapons" />; }
export function FortniteLoadouts(_p: GamePageProps) { return <ComingSoonPage feature="Loadouts" />; }
export function FortniteReplays(_p: GamePageProps) { return <ComingSoonPage feature="Replay Upload" />; }
export function FortniteLeaderboards(_p: GamePageProps) { return <ComingSoonPage feature="Leaderboards" />; }
export function FortniteSettings(_p: GamePageProps) { return <ComingSoonPage feature="Settings" />; }
