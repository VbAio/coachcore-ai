import type { ComponentType } from 'react';
import type { LucideIcon } from 'lucide-react';

/** Register new features here when adding game-specific capabilities */
export type GameFeature =
  | 'dashboard'
  | 'heroes'
  | 'agents'
  | 'replay-upload'
  | 'replay-ai'
  | 'builds'
  | 'guides'
  | 'maps'
  | 'leaderboards'
  | 'settings'
  | 'island-map'
  | 'pois'
  | 'weapons'
  | 'loadouts'
  | 'match-analysis'
  | 'economy'
  | 'vod-review'
  | 'storm-analysis';

export interface NavItem {
  id: string;
  label: string;
  /** Path segment relative to /{gameId}/ — e.g. "heroes", "replays" */
  path: string;
  icon: LucideIcon;
  feature: GameFeature;
}

export interface GameRouteDefinition {
  /** Route path: "" | "heroes" | "replays/:id/report" */
  path: string;
  title: string;
  feature?: GameFeature;
  load: () => Promise<{ default: ComponentType<GamePageProps> }>;
}

export interface GamePageProps {
  params?: Record<string, string>;
}

export interface GameModuleDefinition {
  id: string;
  name: string;
  available: boolean;
  tagline: string;
  accentGradient: string;
  features: GameFeature[];
  navigation: NavItem[];
  routes: GameRouteDefinition[];
  /** Default route when visiting /{gameId} */
  defaultPath: string;
  replayExtension?: string;
}

export interface ResolvedRoute {
  definition: GameRouteDefinition;
  params: Record<string, string>;
}

export type GameId = string;
