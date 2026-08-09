'use client';

import { useState } from 'react';
import type { DeadlockItemDef, ItemCategory } from '@clutchcore/shared';
import { categoryColor, resolveItemDef } from '@clutchcore/shared';
import { cn } from '@/lib/utils';

interface Props {
  itemIdOrName: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE = { sm: 'h-8 w-8 text-[10px]', md: 'h-11 w-11 text-xs', lg: 'h-16 w-16 text-lg' };

export function ItemIcon({ itemIdOrName, size = 'md', className }: Props) {
  const def = resolveItemDef(itemIdOrName);
  const [failed, setFailed] = useState(false);
  const color = categoryColor(def.category);

  return (
    <div
      className={cn(
        'relative flex shrink-0 items-center justify-center overflow-hidden rounded-md border',
        SIZE[size],
        className
      )}
      style={{ borderColor: `${color}66`, background: `${color}22` }}
      title={`${def.name} (${def.category})`}
    >
      {!failed && def.icon ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={def.icon}
          alt={def.name}
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="font-bold" style={{ color }}>
          {def.name
            .split(/\s+/)
            .slice(0, 2)
            .map((w) => w[0])
            .join('')
            .toUpperCase()}
        </span>
      )}
      <span
        className="absolute bottom-0 right-0 h-1.5 w-1.5 rounded-full"
        style={{ background: color }}
      />
    </div>
  );
}

export function CategoryDot({ category }: { category: ItemCategory }) {
  return (
    <span
      className="inline-block h-2 w-2 rounded-full"
      style={{ background: categoryColor(category) }}
      aria-hidden
    />
  );
}

export function useItemDef(nameOrId: string): DeadlockItemDef {
  return resolveItemDef(nameOrId);
}
