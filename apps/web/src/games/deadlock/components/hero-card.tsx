'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import type { Hero } from '@/data/heroes';
import { DIFFICULTY_COLORS } from '@/data/heroes';
import { HeroImage } from './hero-image';
import { cn } from '@/lib/utils';

interface HeroCardProps {
  hero: Hero;
  href: string;
  index: number;
}

export function HeroCard({ hero, href, index }: HeroCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      <Link href={href} className="block group">
        <article className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] shadow-lg shadow-black/20 transition-all duration-300 hover:-translate-y-1 hover:border-purple-500/40 hover:shadow-xl hover:shadow-purple-500/10">
          <div className="relative aspect-[4/3] overflow-hidden">
            <HeroImage
              src={hero.portrait}
              alt={`${hero.name} portrait`}
              role={hero.role}
              name={hero.name}
              className="transition-transform duration-500 group-hover:scale-110"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
            <div className="absolute bottom-3 left-3 right-3">
              <span
                className={cn(
                  'inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium',
                  DIFFICULTY_COLORS[hero.difficulty] ?? 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20'
                )}
              >
                {hero.difficulty}
              </span>
            </div>
          </div>
          <div className="p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-purple-400">
              {hero.role}
            </p>
            <h2 className="mt-1 text-xl font-bold text-white transition-colors group-hover:text-purple-200">
              {hero.name}
            </h2>
            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-zinc-400">
              {hero.description}
            </p>
          </div>
        </article>
      </Link>
    </motion.div>
  );
}
