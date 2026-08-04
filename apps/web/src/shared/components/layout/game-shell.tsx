'use client';

import Link from 'next/link';
import '@/games';
import { GameSidebar, GameMobileNav } from './game-sidebar';
import { GameContextProvider } from '@/shared/context/game-context';
import { getGameModule } from '@/games/registry';
import { notFound } from 'next/navigation';
import { UserMenu } from '@/components/auth/user-menu';

export function GameShell({
  gameId,
  children,
}: {
  gameId: string;
  children: React.ReactNode;
}) {
  const game = getGameModule(gameId);
  if (!game) notFound();

  return (
    <GameContextProvider gameId={gameId}>
      <div className="min-h-screen bg-black pt-[calc(4rem+var(--verify-banner-height))]">
        <header className="fixed top-[var(--verify-banner-height)] z-40 w-full glass border-b border-white/5 h-16 flex items-center px-4 lg:px-6">
          <Link href="/" className="flex items-center gap-2 mr-6 shrink-0">
            <div className="h-8 w-8 rounded-lg gradient-purple flex items-center justify-center text-sm font-bold">
              CC
            </div>
            <span className="font-bold text-white hidden sm:inline">CoachCore</span>
          </Link>
          <span className="text-zinc-600 hidden sm:inline">/</span>
          <span className="text-sm text-zinc-400 ml-2 hidden sm:inline">{game.name}</span>
          <div className="ml-auto">
            <UserMenu />
          </div>
        </header>
        <GameMobileNav />
        <div className="flex">
          <GameSidebar />
          <main className="flex-1 p-6 lg:p-8 max-w-6xl">{children}</main>
        </div>
      </div>
    </GameContextProvider>
  );
}
