'use client';

import type { MatchTimelinePurchase } from '@clutchcore/shared';
import { cn } from '@/lib/utils';
import { ItemIcon } from './ItemIcon';

const SLOT_LABELS = [
  'W1',
  'W2',
  'W3',
  'W4',
  'V1',
  'V2',
  'V3',
  'V4',
  'S1',
  'S2',
  'S3',
  'S4',
];

interface Props {
  purchases: MatchTimelinePurchase[];
  t: number;
  selectedEventId: string | null;
  onSelect: (purchase: MatchTimelinePurchase) => void;
}

/** Live 12-slot inventory (4 Weapon / 4 Vitality / 4 Spirit) at clock `t`. */
export function InventoryReplay({ purchases, t, selectedEventId, onSelect }: Props) {
  const owned = purchases.filter((p) => p.timestamp <= t);
  const slots: Array<MatchTimelinePurchase | null> = Array.from({ length: 12 }, () => null);
  for (const p of owned) {
    slots[p.slotIndex % 12] = p;
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <div className="text-[11px] uppercase tracking-wide text-zinc-500">Inventory</div>
        <div className="text-[10px] text-zinc-600">Weapon · Vitality · Spirit</div>
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        {slots.map((item, i) => (
          <button
            key={i}
            type="button"
            disabled={!item}
            onClick={() => item && onSelect(item)}
            className={cn(
              'flex flex-col items-center gap-1 rounded-lg border p-1.5 transition',
              item
                ? selectedEventId === item.eventId
                  ? 'border-amber-400/50 bg-amber-500/10'
                  : 'border-zinc-800 bg-zinc-950/60 hover:border-zinc-600'
                : 'border-zinc-900 bg-zinc-950/30 opacity-50'
            )}
          >
            {item ? (
              <ItemIcon itemIdOrName={item.itemId} size="sm" />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded bg-zinc-900 text-[10px] text-zinc-600">
                {SLOT_LABELS[i]}
              </div>
            )}
            <span className="max-w-full truncate text-[9px] text-zinc-500">
              {item ? item.item : SLOT_LABELS[i]}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
