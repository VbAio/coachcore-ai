import {
  LayoutDashboard,
  Users,
  FileVideo,
  Hammer,
  BookOpen,
  Map,
  Trophy,
  Settings,
} from 'lucide-react';
import type { GameModuleDefinition } from '@/games/types';

export const deadlockModule: GameModuleDefinition = {
  id: 'deadlock',
  name: 'Deadlock',
  available: true,
  tagline: "Valve's tactical MOBA",
  accentGradient: 'from-purple-600 to-indigo-600',
  replayExtension: '.dem',
  defaultPath: '',
  features: [
    'dashboard',
    'heroes',
    'replay-upload',
    'replay-ai',
    'builds',
    'guides',
    'maps',
    'leaderboards',
    'settings',
  ],
  navigation: [
    { id: 'dashboard', label: 'Dashboard', path: '', icon: LayoutDashboard, feature: 'dashboard' },
    { id: 'heroes', label: 'Heroes', path: 'heroes', icon: Users, feature: 'heroes' },
    { id: 'replays', label: 'Replay Analysis', path: 'replays', icon: FileVideo, feature: 'replay-upload' },
    { id: 'builds', label: 'Builds', path: 'builds', icon: Hammer, feature: 'builds' },
    { id: 'guides', label: 'Guides', path: 'guides', icon: BookOpen, feature: 'guides' },
    { id: 'maps', label: 'Maps', path: 'maps', icon: Map, feature: 'maps' },
    { id: 'leaderboard', label: 'Leaderboard', path: 'leaderboard', icon: Trophy, feature: 'leaderboards' },
    { id: 'settings', label: 'Settings', path: 'settings', icon: Settings, feature: 'settings' },
  ],
  routes: [
    {
      path: '',
      title: 'Dashboard',
      feature: 'dashboard',
      load: () => import('../pages/Dashboard').then((m) => ({ default: m.DeadlockDashboard })),
    },
    {
      path: 'heroes',
      title: 'Heroes',
      feature: 'heroes',
      load: () => import('../pages/Heroes').then((m) => ({ default: m.DeadlockHeroesPage })),
    },
    {
      path: 'heroes/:heroId',
      title: 'Hero Detail',
      feature: 'heroes',
      load: () => import('../pages/HeroDetail').then((m) => ({ default: m.DeadlockHeroDetailPage })),
    },
    {
      path: 'replays',
      title: 'Replay Analysis',
      feature: 'replay-upload',
      load: () => import('../pages/ReplayAnalysis').then((m) => ({ default: m.DeadlockReplayAnalysis })),
    },
    {
      path: 'replays/:id/report',
      title: 'Coaching Report',
      feature: 'replay-ai',
      load: () => import('../pages/CoachingReport').then((m) => ({ default: m.DeadlockCoachingReport })),
    },
    {
      path: 'builds',
      title: 'Builds',
      feature: 'builds',
      load: () => import('../pages/Builds').then((m) => ({ default: m.DeadlockBuildsPage })),
    },
    {
      path: 'guides',
      title: 'Guides',
      feature: 'guides',
      load: () => import('../pages/Guides').then((m) => ({ default: m.DeadlockGuidesPage })),
    },
    {
      path: 'maps',
      title: 'Maps',
      feature: 'maps',
      load: () => import('../pages/Maps').then((m) => ({ default: m.DeadlockMapsPage })),
    },
    {
      path: 'leaderboard',
      title: 'Leaderboard',
      feature: 'leaderboards',
      load: () => import('../pages/Leaderboards').then((m) => ({ default: m.DeadlockLeaderboardsPage })),
    },
    {
      path: 'leaderboards',
      title: 'Leaderboard',
      feature: 'leaderboards',
      load: () =>
        import('../pages/LeaderboardRedirect').then((m) => ({
          default: m.DeadlockLeaderboardsRedirect,
        })),
    },
    {
      path: 'player/:steamId',
      title: 'Player Profile',
      feature: 'leaderboards',
      load: () => import('../pages/PlayerProfile').then((m) => ({ default: m.DeadlockPlayerProfilePage })),
    },
    {
      path: 'settings',
      title: 'Settings',
      feature: 'settings',
      load: () => import('../pages/Settings').then((m) => ({ default: m.DeadlockSettingsPage })),
    },
  ],
};
