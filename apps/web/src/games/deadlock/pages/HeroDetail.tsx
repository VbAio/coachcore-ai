'use client';

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getHero, DIFFICULTY_COLORS } from '@/data/heroes';
import { useGamePath } from '@/shared/context/game-context';
import type { GamePageProps } from '@/games/types';
import { HeroImage } from '../components/hero-image';
import { AbilityCard } from '../components/ability-card';
import { ComingSoonSection } from '../components/coming-soon-section';
import { cn } from '@/lib/utils';

const COMING_SOON_SECTIONS = [
  'Strengths',
  'Weaknesses',
  'Best Items',
  'Counters',
  'Synergies',
  'Lore',
  'Patch History',
] as const;

export function DeadlockHeroDetailPage({ params }: GamePageProps) {
  const heroId = params?.heroId;
  const hero = heroId ? getHero(heroId) : undefined;
  const heroesPath = useGamePath('heroes');

  if (!hero) notFound();

  return (
    <div>
      <Link
        href={heroesPath}
        className="mb-6 inline-flex items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-purple-400"
      >
        <ArrowLeft className="h-4 w-4" />
        All Heroes
      </Link>

      <header className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] shadow-xl shadow-black/20">
        <div className="flex flex-col md:flex-row">
          <div className="relative aspect-square w-full md:w-72 lg:w-80 shrink-0">
            <HeroImage
              src={hero.portrait}
              alt={`${hero.name} portrait`}
              role={hero.role}
              name={hero.name}
              className="object-top"
              sizes="(max-width: 768px) 100vw, 320px"
              priority
            />
          </div>
          <div className="flex flex-1 flex-col justify-center p-6 md:p-8 lg:p-10">
            <p className="text-sm font-semibold uppercase tracking-wider text-purple-400">
              {hero.role}
            </p>
            <h1 className="mt-1 text-4xl font-bold text-white lg:text-5xl">{hero.name}</h1>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span
                className={cn(
                  'rounded-full border px-3 py-1 text-sm font-medium',
                  DIFFICULTY_COLORS[hero.difficulty] ??
                    'text-zinc-400 bg-zinc-500/10 border-zinc-500/20'
                )}
              >
                {hero.difficulty}
              </span>
              <span className="text-sm text-zinc-500">
                Weapon: <span className="text-zinc-300">{hero.weapon}</span>
              </span>
            </div>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-zinc-400">
              {hero.description}
            </p>
          </div>
        </div>
      </header>

      <section className="mt-10">
        <h2 className="mb-5 text-2xl font-bold text-white">Abilities</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {hero.abilities.map((ability) => (
            <AbilityCard key={ability.slot} ability={ability} />
          ))}
        </div>
      </section>

      <section className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {COMING_SOON_SECTIONS.map((title) => (
          <ComingSoonSection key={title} title={title} />
        ))}
      </section>
    </div>
  );
}
