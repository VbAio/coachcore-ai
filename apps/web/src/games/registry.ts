import type {
  GameModuleDefinition,
  GameId,
  ResolvedRoute,
  GameRouteDefinition,
} from './types';

const registry = new Map<GameId, GameModuleDefinition>();

export function registerGame(module: GameModuleDefinition): void {
  registry.set(module.id, module);
}

export function getRegisteredGames(): GameModuleDefinition[] {
  return Array.from(registry.values());
}

export function getGameIds(): GameId[] {
  return Array.from(registry.keys());
}

export function getGameModule(id: string): GameModuleDefinition | undefined {
  return registry.get(id);
}

export function isValidGameId(id: string): boolean {
  return registry.has(id);
}

export function getDefaultGameId(): GameId {
  const available = getRegisteredGames().find((g) => g.available);
  return available?.id ?? getRegisteredGames()[0]?.id ?? 'deadlock';
}

/** Convert route pattern "replays/:id/report" to regex */
function patternToRegex(pattern: string): RegExp {
  const escaped = pattern
    .split('/')
    .map((seg) => (seg.startsWith(':') ? '([^/]+)' : seg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
    .join('/');
  return new RegExp(`^${escaped}$`);
}

function extractParams(pattern: string, path: string): Record<string, string> | null {
  const patternParts = pattern.split('/');
  const pathParts = path.split('/');
  if (patternParts.length !== pathParts.length) return null;

  const params: Record<string, string> = {};
  for (let i = 0; i < patternParts.length; i++) {
    const part = patternParts[i];
    if (part.startsWith(':')) {
      params[part.slice(1)] = pathParts[i];
    } else if (part !== pathParts[i]) {
      return null;
    }
  }
  return params;
}

export function resolveGameRoute(
  gameId: string,
  slug: string[] | undefined
): ResolvedRoute | null {
  const module = getGameModule(gameId);
  if (!module) return null;

  const path = slug?.length ? slug.join('/') : module.defaultPath;

  const exact = module.routes.find((r) => r.path === path);
  if (exact) {
    return { definition: exact, params: {} };
  }

  for (const route of module.routes) {
    if (!route.path.includes(':')) continue;
    const params = extractParams(route.path, path);
    if (params) {
      return { definition: route, params };
    }
  }

  return null;
}

export function getRouteHref(gameId: string, navPath: string): string {
  if (!navPath || navPath === moduleDefault(gameId)) {
    return `/${gameId}`;
  }
  return `/${gameId}/${navPath}`;
}

function moduleDefault(gameId: string): string {
  return getGameModule(gameId)?.defaultPath ?? '';
}

export function getPageTitle(gameId: string, route: GameRouteDefinition): string {
  const game = getGameModule(gameId);
  return `${route.title} · ${game?.name ?? 'ClutchCore'}`;
}

export function gameSupportsFeature(gameId: string, feature: string): boolean {
  const module = getGameModule(gameId);
  return module?.features.includes(feature as never) ?? false;
}
