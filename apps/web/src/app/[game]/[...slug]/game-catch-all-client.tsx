'use client';

import { notFound } from 'next/navigation';
import { resolveGameRoute } from '@/games/registry';
import { GamePageRenderer } from '@/shared/components/layout/game-page-renderer';
import '@/games';

interface GameCatchAllClientProps {
  gameId: string;
  slug?: string[];
}

export function GameCatchAllClient({ gameId, slug }: GameCatchAllClientProps) {
  const resolved = resolveGameRoute(gameId, slug);

  if (!resolved) {
    notFound();
  }

  return (
    <GamePageRenderer
      routePath={resolved.definition.path}
      routeTitle={resolved.definition.title}
      params={resolved.params}
      gameId={gameId}
      slug={slug}
    />
  );
}
