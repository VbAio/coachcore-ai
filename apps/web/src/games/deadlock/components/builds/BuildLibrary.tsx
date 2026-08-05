'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Copy,
  Check,
  Search,
  Star,
  Sparkles,
  Filter,
  Hammer,
} from 'lucide-react';
import { lookupDeadlockItem, categoryColor, type DeadlockItemDef } from '@coachcore/shared';
import { getHero, getAllHeroes } from '@/data/heroes';
import { HeroImage } from '../hero-image';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { FadeIn } from '@/components/motion';
import {
  DEADLOCK_BUILDS,
  PLAYSTYLE_LABELS,
  listBuildHeroIds,
  type AbilitySlot,
  type DeadlockBuild,
  type BuildPlaystyle,
} from '../../data/builds';
import { easeOutSoft } from '@/lib/motion';

type TabId = 'all' | 'coach' | BuildPlaystyle;

const TABS: Array<{ id: TabId; label: string }> = [
  { id: 'all', label: 'All Builds' },
  { id: 'coach', label: 'Coach Picks' },
  { id: 'gun', label: 'Gun' },
  { id: 'spirit', label: 'Spirit' },
  { id: 'bruiser', label: 'Bruiser' },
  { id: 'assassin', label: 'Assassin' },
];

function resolveItems(ids: string[]): DeadlockItemDef[] {
  return ids.map((id) => lookupDeadlockItem(id) ?? {
    id,
    name: id,
    category: 'Weapon' as const,
    tier: 1 as const,
    cost: 0,
    description: '',
    stats: [],
    passiveEffects: [],
  });
}

function Stars({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${value} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            'h-3.5 w-3.5',
            i < Math.round(value) ? 'fill-amber-400 text-amber-400' : 'text-zinc-600'
          )}
        />
      ))}
    </div>
  );
}

function ItemIcon({ item, size = 'md' }: { item: DeadlockItemDef; size?: 'sm' | 'md' }) {
  const [failed, setFailed] = useState(false);
  const dim = size === 'sm' ? 'h-9 w-9' : 'h-12 w-12';
  const color = categoryColor(item.category);

  return (
    <div
      className={cn('relative shrink-0 overflow-hidden rounded-lg border bg-black/40', dim)}
      style={{ borderColor: `${color}66` }}
      title={`${item.name} · ${item.category} T${item.tier}`}
    >
      {!failed && item.icon ? (
        <Image
          src={item.icon}
          alt={item.name}
          fill
          className="object-contain p-1"
          unoptimized
          onError={() => setFailed(true)}
        />
      ) : (
        <div
          className="flex h-full w-full items-center justify-center text-[9px] font-bold uppercase"
          style={{ color }}
        >
          {item.category.slice(0, 1)}
        </div>
      )}
    </div>
  );
}

function AbilityOrderGrid({
  build,
  heroId,
}: {
  build: DeadlockBuild;
  heroId: string;
}) {
  const hero = getHero(heroId);
  if (!hero) return null;
  const bySlot = new Map<AbilitySlot, number[]>();
  for (const point of build.abilityOrder) {
    const list = bySlot.get(point.abilitySlot) ?? [];
    list.push(point.level);
    bySlot.set(point.abilitySlot, list);
  }

  return (
    <div className="space-y-2">
      {hero.abilities.map((ability) => {
        const levels = bySlot.get(ability.slot as AbilitySlot) ?? [];
        return (
          <div key={ability.slot} className="flex items-center gap-3">
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-black/40">
              <Image src={ability.icon} alt={ability.name} fill className="object-cover" unoptimized />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-white">
                {ability.slot === 4 ? 'Ult' : `A${ability.slot}`} · {ability.name}
              </p>
              <div className="mt-1 flex flex-wrap gap-1">
                {levels.length ? (
                  levels.map((lvl) => (
                    <span
                      key={`${ability.slot}-${lvl}`}
                      className="inline-flex h-5 min-w-5 items-center justify-center rounded-md border border-purple-500/40 bg-purple-500/15 px-1 text-[10px] font-bold text-purple-200"
                    >
                      {lvl}
                    </span>
                  ))
                ) : (
                  <span className="text-[10px] text-zinc-600">—</span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function BuildLibrary() {
  const heroIdsWithBuilds = useMemo(() => listBuildHeroIds(), []);
  const [tab, setTab] = useState<TabId>('all');
  const [heroId, setHeroId] = useState<string>('abrams');
  const [maxedFirst, setMaxedFirst] = useState<AbilitySlot | 'any'>('any');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showHeroPicker, setShowHeroPicker] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return DEADLOCK_BUILDS.filter((b) => {
      if (heroId !== 'all' && b.heroId !== heroId) return false;
      if (maxedFirst !== 'any' && b.maxedFirst !== maxedFirst) return false;
      if (tab === 'coach' && b.authorRole !== 'coach') return false;
      if (tab !== 'all' && tab !== 'coach' && !b.playstyles.includes(tab)) return false;
      if (
        q &&
        !b.title.toLowerCase().includes(q) &&
        !b.author.toLowerCase().includes(q) &&
        !b.coachNotes.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    }).sort((a, b) => b.rating - a.rating || b.votes - a.votes);
  }, [heroId, maxedFirst, tab, query]);

  const selected =
    filtered.find((b) => b.id === selectedId) ?? filtered[0] ?? null;

  const selectedHero = selected ? getHero(selected.heroId) : null;
  const filterHero = heroId === 'all' ? null : getHero(heroId);

  const copyBuildId = async () => {
    if (!selected) return;
    await navigator.clipboard.writeText(selected.id);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="space-y-6">
      <FadeIn>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-purple-300/80">
              Deadlock · Coach library
            </p>
            <h1 className="mt-1 flex items-center gap-3 text-4xl font-black tracking-tight text-white md:text-5xl">
              <Hammer className="h-8 w-8 text-purple-400" />
              Builds
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-zinc-400">
              Community-style build browser with CoachCore notes — inspired by popular libraries, tuned for
              coaching (why it works, not just item icons).
            </p>
          </div>
        </div>
      </FadeIn>

      <div className="flex flex-wrap gap-1 border-b border-white/10 pb-px">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              'relative px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-colors',
              tab === t.id ? 'text-purple-200' : 'text-zinc-500 hover:text-zinc-300'
            )}
          >
            {t.label}
            {tab === t.id && (
              <motion.span
                layoutId="builds-tab"
                className="absolute inset-x-1 -bottom-px h-0.5 rounded-full bg-purple-400"
              />
            )}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowHeroPicker((v) => !v)}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white hover:border-purple-500/40"
          >
            {filterHero ? (
              <>
                <div className="relative h-7 w-7 overflow-hidden rounded-md">
                  <HeroImage
                    src={filterHero.displayIcon}
                    alt={filterHero.name}
                    role={filterHero.role}
                    name={filterHero.name}
                    className="object-cover"
                  />
                </div>
                {filterHero.name}
              </>
            ) : (
              'All heroes'
            )}
            <span className="text-zinc-500">▼</span>
          </button>
          <AnimatePresence>
            {showHeroPicker && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.2, ease: easeOutSoft }}
                className="absolute left-0 top-full z-30 mt-2 max-h-72 w-64 overflow-auto rounded-xl border border-white/10 bg-zinc-950/95 p-2 shadow-xl backdrop-blur-xl"
              >
                <button
                  type="button"
                  className="mb-1 w-full rounded-lg px-3 py-2 text-left text-sm text-zinc-300 hover:bg-white/5"
                  onClick={() => {
                    setHeroId('all');
                    setShowHeroPicker(false);
                  }}
                >
                  All heroes
                </button>
                {getAllHeroes()
                  .filter((h) => heroIdsWithBuilds.includes(h.id))
                  .map((h) => (
                    <button
                      key={h.id}
                      type="button"
                      className={cn(
                        'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-white/5',
                        heroId === h.id ? 'bg-purple-500/15 text-purple-200' : 'text-zinc-300'
                      )}
                      onClick={() => {
                        setHeroId(h.id);
                        setShowHeroPicker(false);
                      }}
                    >
                      <div className="relative h-7 w-7 overflow-hidden rounded-md">
                        <HeroImage
                          src={h.displayIcon}
                          alt={h.name}
                          role={h.role}
                          name={h.name}
                          className="object-cover"
                        />
                      </div>
                      {h.name}
                    </button>
                  ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <select
          value={maxedFirst}
          onChange={(e) =>
            setMaxedFirst(e.target.value === 'any' ? 'any' : (Number(e.target.value) as AbilitySlot))
          }
          className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white outline-none focus:border-purple-500/50"
        >
          <option value="any">Maxed first: Any</option>
          <option value="1">Maxed first: Ability 1</option>
          <option value="2">Maxed first: Ability 2</option>
          <option value="3">Maxed first: Ability 3</option>
          <option value="4">Maxed first: Ultimate</option>
        </select>

        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Name or keyword…"
            className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-2 pl-10 pr-3 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-purple-500/50"
          />
        </div>

        <div className="hidden items-center gap-1 text-xs text-zinc-500 lg:flex">
          <Filter className="h-3.5 w-3.5" />
          {filtered.length} builds
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        <div className="space-y-2 lg:col-span-5">
          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center text-sm text-zinc-500">
              No builds match these filters.
            </div>
          ) : (
            filtered.map((build) => {
              const hero = getHero(build.heroId);
              const preview = resolveItems(build.phases.flatMap((p) => p.itemIds).slice(0, 3));
              const active = selected?.id === build.id;
              return (
                <button
                  key={build.id}
                  type="button"
                  onClick={() => setSelectedId(build.id)}
                  className={cn(
                    'w-full rounded-2xl border p-3 text-left transition-all',
                    active
                      ? 'border-purple-500/50 bg-purple-500/10 shadow-[0_0_28px_rgba(168,85,247,0.15)]'
                      : 'border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-white/10">
                      {hero && (
                        <HeroImage
                          src={hero.portrait}
                          alt={hero.name}
                          role={hero.role}
                          name={hero.name}
                          className="object-cover"
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="truncate font-semibold text-white">{build.title}</p>
                        <Stars value={build.rating} />
                      </div>
                      <p className="mt-0.5 text-xs text-zinc-500">
                        by {build.author}
                        {build.authorRole === 'coach' ? ' · Coach' : ''} · updated {build.updatedAt}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {build.playstyles.slice(0, 3).map((p) => (
                          <span
                            key={p}
                            className="rounded-full border border-white/10 bg-black/30 px-2 py-0.5 text-[10px] uppercase tracking-wide text-zinc-400"
                          >
                            {PLAYSTYLE_LABELS[p]}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="hidden gap-1 sm:flex">
                      {preview.map((item) => (
                        <ItemIcon key={item.id} item={item} size="sm" />
                      ))}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        <div className="lg:col-span-7">
          <AnimatePresence mode="wait">
            {selected && selectedHero ? (
              <motion.div
                key={selected.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.28, ease: easeOutSoft }}
                className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] shadow-[0_8px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl"
              >
                <div className="flex flex-col gap-4 border-b border-white/10 p-4 sm:flex-row sm:items-start">
                  <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-2xl border border-white/10">
                    <HeroImage
                      src={selectedHero.portrait}
                      alt={selectedHero.name}
                      role={selectedHero.role}
                      name={selectedHero.name}
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h2 className="text-2xl font-bold text-white">{selected.title}</h2>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-zinc-400">
                          <Stars value={selected.rating} />
                          <span>({selected.votes})</span>
                          <span>·</span>
                          <span>
                            {selected.author}
                            {selected.authorRole === 'coach' && (
                              <span className="ml-1 text-purple-300">Coach pick</span>
                            )}
                          </span>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="gap-2" onClick={copyBuildId}>
                        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        {copied ? 'Copied' : 'Copy build ID'}
                      </Button>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-3 text-xs">
                      <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-zinc-300">
                        {selected.sampleMatches} sample matches
                      </span>
                      <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-200">
                        {selected.sampleWinRate}% WR
                      </span>
                      {selected.isEstimate && (
                        <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-amber-200">
                          Estimated meta sample
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-5 p-4">
                  <div className="rounded-xl border border-purple-500/20 bg-purple-500/10 p-3">
                    <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-purple-200/90">
                      <Sparkles className="h-3.5 w-3.5" />
                      Coach notes
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-zinc-200">{selected.coachNotes}</p>
                    <p className="mt-2 text-xs leading-relaxed text-zinc-400">
                      <span className="text-zinc-300">Why it works: </span>
                      {selected.whyItWorks}
                    </p>
                  </div>

                  {selected.phases.map((phase) => {
                    const items = resolveItems(phase.itemIds);
                    return (
                      <div key={phase.id}>
                        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                          {phase.label}
                        </p>
                        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                          {items.map((item) => (
                            <div
                              key={`${phase.id}-${item.id}`}
                              className="flex flex-col items-center gap-1.5 rounded-xl border border-white/5 bg-black/25 p-2"
                            >
                              <ItemIcon item={item} />
                              <p className="line-clamp-2 text-center text-[10px] leading-tight text-zinc-300">
                                {item.name}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}

                  <div>
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                      Ability order · max {selected.maxedFirst === 4 ? 'Ult' : `A${selected.maxedFirst}`} first
                    </p>
                    <AbilityOrderGrid build={selected} heroId={selected.heroId} />
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-white/10 text-sm text-zinc-500">
                Select a build to inspect
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
