import { notFound } from 'next/navigation';
import { isValidGameId } from '@/games';
import '@/games';
import { GameShell } from '@/shared/components/layout/game-shell';

export function generateStaticParams() {
  return [
    { game: 'deadlock' },
    { game: 'fortnite' },
    { game: 'valorant' },
    { game: 'league-of-legends' },
    { game: 'rocket-league' },
    { game: 'cs2' },
    { game: 'apex-legends' },
  ];
}

export default async function GameLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ game: string }>;
}) {
  const { game: gameId } = await params;

  if (!isValidGameId(gameId)) {
    notFound();
  }

  return <GameShell gameId={gameId}>{children}</GameShell>;
}
