import { LayoutDashboard, Settings } from 'lucide-react';
import type { GameModuleDefinition } from '@/games/types';

/** Factory for coming-soon game modules with dashboard only */
export function createComingSoonGameModule(
  id: string,
  name: string,
  tagline: string,
  accentGradient: string
): GameModuleDefinition {
  return {
    id,
    name,
    available: false,
    tagline,
    accentGradient,
    defaultPath: '',
    features: ['dashboard', 'settings'],
    navigation: [
      { id: 'dashboard', label: 'Dashboard', path: '', icon: LayoutDashboard, feature: 'dashboard' },
      { id: 'settings', label: 'Settings', path: 'settings', icon: Settings, feature: 'settings' },
    ],
    routes: [
      {
        path: '',
        title: 'Dashboard',
        load: () => import('../shared/pages/ComingSoonDashboard').then((m) => ({ default: m.createComingSoonDashboard(name) })),
      },
      {
        path: 'settings',
        title: 'Settings',
        load: () => import('../shared/pages/ComingSoonDashboard').then((m) => ({ default: m.createComingSoonDashboard(name) })),
      },
    ],
  };
}

export const leagueModule = createComingSoonGameModule(
  'league-of-legends',
  'League of Legends',
  'MOBA strategy',
  'from-amber-500 to-yellow-600'
);

export const rocketLeagueModule = createComingSoonGameModule(
  'rocket-league',
  'Rocket League',
  'Soccar meets supersonic',
  'from-orange-500 to-blue-500'
);

export const cs2Module = createComingSoonGameModule(
  'cs2',
  'CS2',
  'Counter-Strike 2',
  'from-zinc-400 to-zinc-600'
);

export const apexModule = createComingSoonGameModule(
  'apex-legends',
  'Apex Legends',
  'Battle royale hero shooter',
  'from-red-500 to-orange-500'
);
