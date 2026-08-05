'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { GameSelector } from './game-selector';
import { useGameContext } from '@/shared/context/game-context';
import { getRouteHref } from '@/games/registry';
import { cn } from '@/lib/utils';
import { easeOutSoft, staggerFast, fadeUp } from '@/lib/motion';

export function GameSidebar() {
  const { game, gameId } = useGameContext();
  const pathname = usePathname();

  return (
    <motion.aside
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, ease: easeOutSoft }}
      className="hidden min-h-[calc(100vh-4rem)] w-56 shrink-0 flex-col border-r border-white/5 bg-black/40 lg:flex"
    >
      <div className="border-b border-white/5 p-4">
        <GameSelector currentGameId={gameId} variant="game" />
        <p className="mt-2 text-xs text-zinc-500">{game.tagline}</p>
      </div>
      <motion.nav
        className="flex-1 space-y-0.5 p-3"
        variants={staggerFast}
        initial="hidden"
        animate="visible"
      >
        {game.navigation.map((item) => {
          const href = getRouteHref(gameId, item.path);
          const active = pathname === href || pathname.startsWith(`${href}/`);
          const Icon = item.icon;
          return (
            <motion.div key={item.id} variants={fadeUp}>
              <Link
                href={href}
                className={cn(
                  'relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
                  active
                    ? 'text-purple-200'
                    : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                )}
              >
                {active && (
                  <motion.span
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-lg border border-purple-500/20 bg-purple-500/15"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                )}
                <Icon className="relative z-10 h-4 w-4 shrink-0" />
                <span className="relative z-10">{item.label}</span>
              </Link>
            </motion.div>
          );
        })}
      </motion.nav>
    </motion.aside>
  );
}

export function GameMobileNav() {
  const { game, gameId } = useGameContext();
  const pathname = usePathname();

  return (
    <div className="overflow-x-auto border-b border-white/5 bg-black/60 lg:hidden">
      <div className="flex min-w-max gap-1 p-2">
        {game.navigation.map((item) => {
          const href = getRouteHref(gameId, item.path);
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={item.id}
              href={href}
              className={cn(
                'relative rounded-full px-3 py-1.5 text-xs whitespace-nowrap transition-colors',
                active ? 'text-purple-200' : 'text-zinc-400 hover:text-white'
              )}
            >
              {active && (
                <motion.span
                  layoutId="mobile-nav-active"
                  className="absolute inset-0 rounded-full bg-purple-500/20"
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                />
              )}
              <span className="relative z-10">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
