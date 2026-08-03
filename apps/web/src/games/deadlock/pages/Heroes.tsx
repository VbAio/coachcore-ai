'use client';

import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { getAllHeroes, getHeroDifficulties, getHeroRoles } from '@/data/heroes';
import { useGamePath } from '@/shared/context/game-context';
import type { GamePageProps } from '@/games/types';
import { HeroCard } from '../components/hero-card';
import { cn } from '@/lib/utils';

const ALL = 'All';

export function DeadlockHeroesPage(_props: GamePageProps) {
  const heroesBase = useGamePath('heroes');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState(ALL);
  const [difficultyFilter, setDifficultyFilter] = useState(ALL);

  const roles = useMemo(() => getHeroRoles(), []);
  const difficulties = useMemo(() => getHeroDifficulties(), []);

  const filteredHeroes = useMemo(() => {
    const query = search.trim().toLowerCase();
    return getAllHeroes().filter((hero) => {
      const matchesSearch = !query || hero.name.toLowerCase().includes(query);
      const matchesRole = roleFilter === ALL || hero.role === roleFilter;
      const matchesDifficulty =
        difficultyFilter === ALL || hero.difficulty === difficultyFilter;
      return matchesSearch && matchesRole && matchesDifficulty;
    });
  }, [search, roleFilter, difficultyFilter]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Heroes</h1>
        <p className="mt-2 text-zinc-400">
          Browse all Deadlock heroes — abilities, builds, and coaching insights
        </p>
      </div>

      <div className="mb-8 space-y-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search heroes by name..."
            className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-3 pl-11 pr-4 text-white placeholder:text-zinc-500 outline-none transition-colors focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30"
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <FilterGroup label="Role">
            <FilterPill active={roleFilter === ALL} onClick={() => setRoleFilter(ALL)}>
              All
            </FilterPill>
            {roles.map((role) => (
              <FilterPill
                key={role}
                active={roleFilter === role}
                onClick={() => setRoleFilter(role)}
              >
                {role}
              </FilterPill>
            ))}
          </FilterGroup>

          <FilterGroup label="Difficulty">
            <FilterPill
              active={difficultyFilter === ALL}
              onClick={() => setDifficultyFilter(ALL)}
            >
              All
            </FilterPill>
            {difficulties.map((difficulty) => (
              <FilterPill
                key={difficulty}
                active={difficultyFilter === difficulty}
                onClick={() => setDifficultyFilter(difficulty)}
              >
                {difficulty}
              </FilterPill>
            ))}
          </FilterGroup>
        </div>
      </div>

      {filteredHeroes.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filteredHeroes.map((hero, index) => (
            <HeroCard
              key={hero.id}
              hero={hero}
              href={`${heroesBase}/${hero.id}`}
              index={index}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] py-16 text-center">
          <p className="text-zinc-400">No heroes match your filters.</p>
          <button
            type="button"
            onClick={() => {
              setSearch('');
              setRoleFilter(ALL);
              setDifficultyFilter(ALL);
            }}
            className="mt-4 text-sm text-purple-400 hover:text-purple-300"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
        {label}
      </span>
      {children}
    </div>
  );
}

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full border px-3 py-1.5 text-sm font-medium transition-all',
        active
          ? 'border-purple-500/50 bg-purple-500/20 text-purple-200'
          : 'border-white/10 bg-white/[0.03] text-zinc-400 hover:border-white/20 hover:text-zinc-200'
      )}
    >
      {children}
    </button>
  );
}
