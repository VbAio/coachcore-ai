'use client';

import Link from 'next/link';
import '@/games';
import { getRegisteredGames } from '@/games/registry';
import { ChevronDown, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { easeOutSoft } from '@/lib/motion';

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
            : 'rounded-lg border border-white/10 px-3 py-1.5 text-sm text-white glass hover:border-purple-500/40'
        )}
      >
        <span
          className={cn(
            'h-2 w-2 rounded-full bg-gradient-to-br',
            GAME_DOTS[current?.id ?? 'deadlock']
          )}
        />
        <span>{variant === 'platform' ? 'Games' : current?.name}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="h-3.5 w-3.5 opacity-60" />
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.2, ease: easeOutSoft }}
            className="absolute left-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-white/10 shadow-xl glass"
          >
            {games.map((game, i) => (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <Link
                  href={`/${game.id}`}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-white/5',
                    currentGameId === game.id && 'bg-purple-500/10'
                  )}
                >
                  <span
                    className={cn(
                      'h-2.5 w-2.5 shrink-0 rounded-full bg-gradient-to-br',
                      GAME_DOTS[game.id]
                    )}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white">{game.name}</span>
                      {!game.available && (
                        <span className="rounded bg-zinc-800 px-1.5 text-[10px] uppercase text-zinc-500">
                          Soon
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-500">{game.tagline}</p>
                  </div>
                  {!game.available && <Lock className="h-3 w-3 text-zinc-600" />}
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
