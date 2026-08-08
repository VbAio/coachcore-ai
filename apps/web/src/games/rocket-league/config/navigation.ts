import { LayoutDashboard, FileVideo, Trophy, Settings } from 'lucide-react';
import type { GameModuleDefinition } from '@/games/types';

export const rocketLeagueModule: GameModuleDefinition = {
  id: 'rocket-league',
  name: 'Rocket League',
  available: true,
  tagline: 'Soccar meets supersonic',
  accentGradient: 'from-orange-500 to-sky-500',
  replayExtension: '.replay',
  defaultPath: '',
  features: ['dashboard', 'replay-upload', 'replay-ai', 'leaderboards', 'settings'],
  navigation: [
    { id: 'dashboard', label: 'Dashboard', path: '', icon: LayoutDashboard, feature: 'dashboard' },
    {
      id: 'replays',
      label: 'Replay Analysis',
      path: 'replays',
      icon: FileVideo,
      feature: 'replay-upload',
    },
    {
      id: 'leaderboard',
      label: 'Leaderboard',
      path: 'leaderboard',
      icon: Trophy,
      feature: 'leaderboards',
    },
    { id: 'settings', label: 'Settings', path: 'settings', icon: Settings, feature: 'settings' },
  ],
  routes: [
    {
      path: '',
      title: 'Dashboard',
      feature: 'dashboard',
      load: () => import('../pages/Dashboard').then((m) => ({ default: m.RocketLeagueDashboard })),
    },
    {
      path: 'replays',
      title: 'Replay Analysis',
      feature: 'replay-upload',
      load: () =>
        import('../pages/ReplayAnalysis').then((m) => ({ default: m.RocketLeagueReplayAnalysis })),
    },
    {
      path: 'replays/:id/report',
      title: 'Coaching Report',
      feature: 'replay-ai',
      load: () =>
        import('../pages/CoachingReport').then((m) => ({ default: m.RocketLeagueCoachingReport })),
    },
    {
      path: 'leaderboard',
      title: 'Leaderboard',
      feature: 'leaderboards',
      load: () =>
        import('../pages/Leaderboards').then((m) => ({ default: m.RocketLeagueLeaderboardsPage })),
    },
    {
      path: 'leaderboards',
      title: 'Leaderboard',
      feature: 'leaderboards',
      load: () =>
        import('../pages/Leaderboards').then((m) => ({ default: m.RocketLeagueLeaderboardsPage })),
    },
    {
      path: 'settings',
      title: 'Settings',
      feature: 'settings',
      load: () => import('../pages/Settings').then((m) => ({ default: m.RocketLeagueSettingsPage })),
    },
  ],
};
