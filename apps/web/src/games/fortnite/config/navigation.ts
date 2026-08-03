import { LayoutDashboard, Map, Crosshair, Swords, Package, Trophy, Settings, Upload } from 'lucide-react';
import type { GameModuleDefinition } from '@/games/types';

export const fortniteModule: GameModuleDefinition = {
  id: 'fortnite',
  name: 'Fortnite',
  available: false,
  tagline: 'Battle royale & builds',
  accentGradient: 'from-blue-500 to-cyan-500',
  defaultPath: '',
  features: ['dashboard', 'island-map', 'pois', 'match-analysis', 'weapons', 'loadouts', 'leaderboards', 'settings', 'replay-upload'],
  navigation: [
    { id: 'dashboard', label: 'Dashboard', path: '', icon: LayoutDashboard, feature: 'dashboard' },
    { id: 'map', label: 'Island Map', path: 'map', icon: Map, feature: 'island-map' },
    { id: 'pois', label: 'POIs', path: 'pois', icon: Crosshair, feature: 'pois' },
    { id: 'matches', label: 'Match Analysis', path: 'matches', icon: Swords, feature: 'match-analysis' },
    { id: 'weapons', label: 'Weapons', path: 'weapons', icon: Package, feature: 'weapons' },
    { id: 'loadouts', label: 'Loadouts', path: 'loadouts', icon: Package, feature: 'loadouts' },
    { id: 'replays', label: 'Replays', path: 'replays', icon: Upload, feature: 'replay-upload' },
    { id: 'leaderboards', label: 'Leaderboards', path: 'leaderboards', icon: Trophy, feature: 'leaderboards' },
    { id: 'settings', label: 'Settings', path: 'settings', icon: Settings, feature: 'settings' },
  ],
  routes: [
    { path: '', title: 'Dashboard', load: () => import('../pages/Dashboard').then((m) => ({ default: m.FortniteDashboard })) },
    { path: 'map', title: 'Island Map', feature: 'island-map', load: () => import('../pages/IslandMap').then((m) => ({ default: m.FortniteIslandMap })) },
    { path: 'pois', title: 'POIs', load: () => import('../pages/POIs').then((m) => ({ default: m.FortnitePOIs })) },
    { path: 'matches', title: 'Match Analysis', load: () => import('../pages/MatchAnalysis').then((m) => ({ default: m.FortniteMatchAnalysis })) },
    { path: 'weapons', title: 'Weapons', load: () => import('../pages/Weapons').then((m) => ({ default: m.FortniteWeapons })) },
    { path: 'loadouts', title: 'Loadouts', load: () => import('../pages/Loadouts').then((m) => ({ default: m.FortniteLoadouts })) },
    { path: 'replays', title: 'Replays', load: () => import('../pages/Replays').then((m) => ({ default: m.FortniteReplays })) },
    { path: 'leaderboards', title: 'Leaderboards', load: () => import('../pages/Leaderboards').then((m) => ({ default: m.FortniteLeaderboards })) },
    { path: 'settings', title: 'Settings', load: () => import('../pages/Settings').then((m) => ({ default: m.FortniteSettings })) },
  ],
};
