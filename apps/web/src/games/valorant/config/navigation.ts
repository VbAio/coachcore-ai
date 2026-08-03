import { LayoutDashboard, Users, Map, Coins, FileVideo, Trophy, Settings } from 'lucide-react';
import type { GameModuleDefinition } from '@/games/types';

export const valorantModule: GameModuleDefinition = {
  id: 'valorant',
  name: 'Valorant',
  available: false,
  tagline: 'Tactical FPS',
  accentGradient: 'from-red-600 to-rose-500',
  defaultPath: '',
  features: ['dashboard', 'agents', 'maps', 'economy', 'vod-review', 'leaderboards', 'settings'],
  navigation: [
    { id: 'dashboard', label: 'Dashboard', path: '', icon: LayoutDashboard, feature: 'dashboard' },
    { id: 'agents', label: 'Agents', path: 'agents', icon: Users, feature: 'agents' },
    { id: 'maps', label: 'Maps', path: 'maps', icon: Map, feature: 'maps' },
    { id: 'economy', label: 'Economy', path: 'economy', icon: Coins, feature: 'economy' },
    { id: 'vod', label: 'VOD Review', path: 'vod', icon: FileVideo, feature: 'vod-review' },
    { id: 'leaderboards', label: 'Leaderboards', path: 'leaderboards', icon: Trophy, feature: 'leaderboards' },
    { id: 'settings', label: 'Settings', path: 'settings', icon: Settings, feature: 'settings' },
  ],
  routes: [
    { path: '', title: 'Dashboard', load: () => import('../pages/Dashboard').then((m) => ({ default: m.ValorantDashboard })) },
    { path: 'agents', title: 'Agents', load: () => import('../pages/Agents').then((m) => ({ default: m.ValorantAgents })) },
    { path: 'maps', title: 'Maps', load: () => import('../pages/Maps').then((m) => ({ default: m.ValorantMaps })) },
    { path: 'economy', title: 'Economy', load: () => import('../pages/Economy').then((m) => ({ default: m.ValorantEconomy })) },
    { path: 'vod', title: 'VOD Review', load: () => import('../pages/VODReview').then((m) => ({ default: m.ValorantVODReview })) },
    { path: 'leaderboards', title: 'Leaderboards', load: () => import('../pages/Leaderboards').then((m) => ({ default: m.ValorantLeaderboards })) },
    { path: 'settings', title: 'Settings', load: () => import('../pages/Settings').then((m) => ({ default: m.ValorantSettings })) },
  ],
};
