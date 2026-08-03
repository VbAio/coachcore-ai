'use client';

import Link from 'next/link';
import '@/games';
import { getRegisteredGames } from '@/games/registry';
import { ChevronDown, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useRef, useState } from 'react';

const GAME_DOTS: Record<string, string> = {
  deadlock: 'from-purple-600 to-indigo-600',
  fortnite: 'from-blue-500 to-cyan-500',
  valorant: 'from-red-600 to-rose-500',
  'league-of-legends': 'from-amber-500 to-yellow-600',
  'rocket-league': 'from-orange-500 to-blue-500',
  cs2: 'from-zinc-400 to-zinc-600',
  'apex-legends': 'from-red-500 to-orange-500',
};

interface GameSelectorProps {
  currentGameId?: string;
  variant?: 'platform' | 'game';
}

export function GameSelector({ currentGameId, variant = 'game' }: GameSelectorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const games = getRegisteredGames();
  const current = games.find((g) => g.id === currentGameId) ?? games[0];

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex items-center gap-2 transition-colors',
          variant === 'platform'
            ? 'text-sm text-zinc-400 hover:text-purple-400'
            : 'rounded-lg glass border border-white/10 px-3 py-1.5 text-sm text-white hover:border-purple-500/40'
        )}
      >
        <span className={cn('h-2 w-2 rounded-full bg-gradient-to-br', GAME_DOTS[current?.id ?? 'deadlock'])} />
        <span>{variant === 'platform' ? 'Games' : current?.name}</span>
        <ChevronDown className={cn('h-3.5 w-3.5 opacity-60', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-2 w-56 rounded-xl glass border border-white/10 shadow-xl z-50 overflow-hidden">
          {games.map((game) => (
            <Link
              key={game.id}
              href={`/${game.id}`}
              onClick={() => setOpen(false)}
              className={cn(
                'flex items-center gap-3 px-4 py-3 text-sm hover:bg-white/5 transition-colors',
                currentGameId === game.id && 'bg-purple-500/10'
              )}
            >
              <span className={cn('h-2.5 w-2.5 rounded-full bg-gradient-to-br shrink-0', GAME_DOTS[game.id])} />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium">{game.name}</span>
                  {!game.available && (
                    <span className="text-[10px] uppercase text-zinc-500 bg-zinc-800 px-1.5 rounded">Soon</span>
                  )}
                </div>
                <p className="text-xs text-zinc-500">{game.tagline}</p>
              </div>
              {!game.available && <Lock className="h-3 w-3 text-zinc-600" />}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
