'use client';

import type { GamePageProps } from '@/games/types';

const POIS = ['Pleasant Piazza', 'Reckless Railways', 'Grand Glacier', 'Forests', 'Coastal Cliffs'];

export function FortniteIslandMap(_p: GamePageProps) {
  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-2">Island Map</h1>
      <p className="text-zinc-400 mb-6">Interactive Fortnite island — POIs, loot, and storm data</p>
      <div className="glass rounded-2xl aspect-video relative overflow-hidden border border-blue-500/20">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950/80 to-cyan-950/60" />
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: 'radial-gradient(circle at 30% 40%, rgba(59,130,246,0.4) 0%, transparent 50%), radial-gradient(circle at 70% 60%, rgba(6,182,212,0.3) 0%, transparent 40%)',
        }} />
        {POIS.map((poi, i) => (
          <button
            key={poi}
            type="button"
            className="absolute px-2 py-1 rounded bg-blue-500/30 border border-blue-400/40 text-xs text-white hover:bg-blue-500/50 transition-colors"
            style={{ left: `${20 + i * 15}%`, top: `${25 + (i % 3) * 20}%` }}
          >
            {poi}
          </button>
        ))}
        <p className="absolute bottom-4 left-4 text-xs text-zinc-400">Fortnite-only feature · Coming soon</p>
      </div>
      <div className="grid sm:grid-cols-3 gap-4 mt-6">
        {['Chest Locations', 'Vehicle Spawns', 'Safe Rotations'].map((f) => (
          <div key={f} className="glass rounded-xl p-4 text-sm text-zinc-300">{f}</div>
        ))}
      </div>
    </div>
  );
}
