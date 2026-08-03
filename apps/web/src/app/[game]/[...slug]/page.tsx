import { notFound } from 'next/navigation';
import { resolveGameRoute, getPageTitle, isValidGameId } from '@/games';
import '@/games';
import { GameCatchAllClient } from './game-catch-all-client';
import type { Metadata } from 'next';

interface PageProps {
  params: Promise<{ game: string; slug: string[] }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { game: gameId, slug } = await params;
  if (!isValidGameId(gameId)) return { title: 'Not Found' };
  const resolved = resolveGameRoute(gameId, slug);
  if (!resolved) return { title: 'Not Found' };
  return { title: getPageTitle(gameId, resolved.definition) };
}

export default async function GameNestedPage({ params }: PageProps) {
  const { game: gameId, slug } = await params;

  if (!isValidGameId(gameId)) notFound();

  const resolved = resolveGameRoute(gameId, slug);
  if (!resolved) notFound();

  return <GameCatchAllClient gameId={gameId} slug={slug} />;
}
