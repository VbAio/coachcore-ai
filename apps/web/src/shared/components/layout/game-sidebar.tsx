'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { GameSelector } from './game-selector';
import { useGameContext } from '@/shared/context/game-context';
import { getRouteHref } from '@/games/registry';
import { cn } from '@/lib/utils';

export function GameSidebar() {
  const { game, gameId } = useGameContext();
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col w-56 shrink-0 border-r border-white/5 bg-black/40 min-h-[calc(100vh-4rem)]">
      <div className="p-4 border-b border-white/5">
        <GameSelector currentGameId={gameId} variant="game" />
        <p className="text-xs text-zinc-500 mt-2">{game.tagline}</p>
      </div>
      <nav className="flex-1 p-3 space-y-0.5">
        {game.navigation.map((item) => {
          const href = getRouteHref(gameId, item.path);
          const active = pathname === href || pathname.startsWith(`${href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all',
                active
                  ? 'bg-purple-500/15 text-purple-300 border border-purple-500/20'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export function GameMobileNav() {
  const { game, gameId } = useGameContext();
  const pathname = usePathname();

  return (
    <div className="lg:hidden overflow-x-auto border-b border-white/5 bg-black/60">
      <div className="flex gap-1 p-2 min-w-max">
        {game.navigation.map((item) => {
          const href = getRouteHref(gameId, item.path);
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={item.id}
              href={href}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-colors',
                active ? 'bg-purple-500/20 text-purple-300' : 'text-zinc-400 hover:text-white'
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
