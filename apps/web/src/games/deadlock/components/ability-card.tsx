'use client';

import Image from 'next/image';
import { useState } from 'react';
import type { Ability } from '@/data/heroes';
import { getAbilitySlotLabel } from '@/data/heroes';
import { cn } from '@/lib/utils';

interface AbilityCardProps {
  ability: Ability;
}

export function AbilityCard({ ability }: AbilityCardProps) {
  const [iconFailed, setIconFailed] = useState(false);
  const isUltimate = ability.slot === 4;

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-5 shadow-lg shadow-black/20 transition-all duration-300',
        'hover:scale-[1.03] hover:border-purple-500/60 hover:shadow-purple-500/20 hover:shadow-xl',
        isUltimate && 'border-amber-500/20 hover:border-amber-400/60 hover:shadow-amber-500/15'
      )}
    >
      <div
        className={cn(
          'pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100',
          isUltimate
            ? 'bg-gradient-to-br from-amber-500/10 via-transparent to-purple-500/10'
            : 'bg-gradient-to-br from-purple-500/10 via-transparent to-indigo-500/10'
        )}
      />
      <div className="relative flex items-start gap-4">
        <div
          className={cn(
            'relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border bg-black/40',
            isUltimate ? 'border-amber-500/30' : 'border-white/10'
          )}
        >
          {!iconFailed ? (
            <Image
              src={ability.icon}
              alt={ability.name}
              fill
              className="object-cover"
              onError={() => setIconFailed(true)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-lg font-bold text-purple-300">
              {ability.slot}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                'rounded-md px-2 py-0.5 text-xs font-bold uppercase tracking-wide',
                isUltimate
                  ? 'bg-amber-500/15 text-amber-300'
                  : 'bg-purple-500/15 text-purple-300'
              )}
            >
              {getAbilitySlotLabel(ability.slot)}
            </span>
            <h3 className="text-lg font-semibold text-white">{ability.name}</h3>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-zinc-400">{ability.description}</p>
        </div>
      </div>
    </div>
  );
}
