'use client';

import type { BuildReview, MatchTimelinePurchase } from '@coachcore/shared';
import { ChevronDown } from 'lucide-react';
import { formatClock } from './format';
import { CategoryDot, ItemIcon } from './ItemIcon';

interface Props {
  review: BuildReview | undefined;
  purchases: MatchTimelinePurchase[];
  onSelect: (purchase: MatchTimelinePurchase) => void;
}

export function BuildPath({ review, purchases, onSelect }: Props) {
  const phases = review?.phases.filter((p) => p.itemNames.length > 0) ?? [];

  if (phases.length === 0) {
    return (
      <p className="text-xs text-zinc-500">No build path — no purchases extracted from this demo.</p>
    );
  }

  return (
    <div>
      <div className="mb-2 text-[11px] uppercase tracking-wide text-zinc-500">Build path</div>
      <div className="space-y-2">
        {phases.map((phase, idx) => (
          <div key={phase.phase}>
            <div className="mb-1 text-[11px] font-medium text-zinc-400">{phase.label}</div>
            <div className="flex flex-wrap gap-2">
              {phase.itemNames.map((name, i) => {
                const purchase =
                  purchases.find(
                    (p) =>
                      p.item === name &&
                      (phase.timestamps[i] == null || p.timestamp === phase.timestamps[i])
                  ) ?? purchases.find((p) => p.item === name);
                return (
                  <button
                    key={`${phase.phase}-${name}-${i}`}
                    type="button"
                    onClick={() => purchase && onSelect(purchase)}
                    className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-950/60 px-2 py-1.5 text-left hover:border-zinc-600"
                  >
                    <ItemIcon itemIdOrName={phase.itemIds[i] ?? name} size="sm" />
                    <div>
                      <div className="flex items-center gap-1 text-xs text-zinc-200">
                        <CategoryDot
                          category={purchase?.category ?? 'Weapon'}
                        />
                        {name}
                      </div>
                      {phase.timestamps[i] != null && (
                        <div className="font-mono text-[10px] text-zinc-500">
                          {formatClock(phase.timestamps[i])}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
            {idx < phases.length - 1 && (
              <div className="my-1 flex justify-center text-zinc-600">
                <ChevronDown className="h-3.5 w-3.5" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
