'use client';

import type { GamePageProps } from '@/games/types';

const AGENTS = ['Jett', 'Sage', 'Omen', 'Raze', 'Killjoy', 'Viper'];

export function ValorantAgents(_p: GamePageProps) {
  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-2">Agents</h1>
      <p className="text-zinc-400 mb-8">Valorant agent pool — abilities, roles, and VOD coaching</p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {AGENTS.map((agent) => (
          <div key={agent} className="glass rounded-xl p-6 border border-red-500/10">
            <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-red-600 to-rose-600 mb-3" />
            <h2 className="font-bold text-white">{agent}</h2>
            <p className="text-xs text-zinc-500 mt-1">Valorant-only · Coming soon</p>
          </div>
        ))}
      </div>
    </div>
  );
}
