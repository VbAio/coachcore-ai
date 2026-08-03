'use client';

import { createContext, useContext } from 'react';
import '@/games';
import { getGameModule } from '@/games/registry';
import type { GameModuleDefinition } from '@/games/types';

interface GameContextValue {
  game: GameModuleDefinition;
  gameId: string;
  basePath: string;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameContextProvider({
  gameId,
  children,
}: {
  gameId: string;
  children: React.ReactNode;
}) {
  const game = getGameModule(gameId)!;

  return (
    <GameContext.Provider value={{ game, gameId, basePath: `/${gameId}` }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGameContext() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGameContext must be used within a game layout');
  return ctx;
}

export function useGamePath(relativePath = ''): string {
  const { basePath } = useGameContext();
  if (!relativePath) return basePath;
  return `${basePath}/${relativePath.replace(/^\//, '')}`;
}
