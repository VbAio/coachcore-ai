'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import '@/games';
import { GameSidebar, GameMobileNav } from './game-sidebar';
import { GameContextProvider } from '@/shared/context/game-context';
import { getGameModule } from '@/games/registry';
import { notFound } from 'next/navigation';
import { UserMenu } from '@/components/auth/user-menu';
import { PageTransition } from '@/components/motion';
import { easeOutSoft } from '@/lib/motion';

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
        <motion.header
          initial={{ y: -24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.45, ease: easeOutSoft }}
          className="fixed top-[var(--verify-banner-height)] z-40 flex h-16 w-full items-center border-b border-white/5 px-4 glass lg:px-6"
        >
          <Link href="/" className="mr-6 flex shrink-0 items-center gap-2 group">
            <motion.div
              whileHover={{ scale: 1.06, rotate: -3 }}
              whileTap={{ scale: 0.96 }}
              className="flex h-8 w-8 items-center justify-center rounded-lg gradient-purple text-sm font-bold"
            >
              Cl
            </motion.div>
            <span className="hidden font-bold text-white transition-colors group-hover:text-purple-200 sm:inline">
              ClutchCore
            </span>
          </Link>
          <span className="hidden text-zinc-600 sm:inline">/</span>
          <span className="ml-2 hidden text-sm text-zinc-400 sm:inline">{game.name}</span>
          <div className="ml-auto">
            <UserMenu />
          </div>
        </motion.header>
        <GameMobileNav />
        <div className="flex">
          <GameSidebar />
          <main className="max-w-6xl flex-1 p-6 lg:p-8">
            <PageTransition>{children}</PageTransition>
          </main>
        </div>
      </div>
    </GameContextProvider>
  );
}
