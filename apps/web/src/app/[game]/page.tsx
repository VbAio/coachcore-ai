import { notFound } from 'next/navigation';
import { resolveGameRoute, getPageTitle, isValidGameId } from '@/games';
import '@/games';
import { GameCatchAllClient } from './[...slug]/game-catch-all-client';
import type { Metadata } from 'next';

interface PageProps {
  params: Promise<{ game: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { game: gameId } = await params;
  if (!isValidGameId(gameId)) return { title: 'Not Found' };
  const resolved = resolveGameRoute(gameId, undefined);
  if (!resolved) return { title: 'Not Found' };
  return { title: getPageTitle(gameId, resolved.definition) };
}

export default async function GameHomePage({ params }: PageProps) {
  const { game: gameId } = await params;

  if (!isValidGameId(gameId)) notFound();

  const resolved = resolveGameRoute(gameId, undefined);
  if (!resolved) notFound();

  return <GameCatchAllClient gameId={gameId} />;
}
