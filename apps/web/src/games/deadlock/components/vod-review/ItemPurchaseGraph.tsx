'use client';

import type { MatchTimelinePurchase } from '@coachcore/shared';
import { categoryColor } from '@coachcore/shared';
import { formatClock } from './format';

interface Props {
  purchases: MatchTimelinePurchase[];
  duration: number;
  t: number;
  selectedEventId: string | null;
  onSelect: (purchase: MatchTimelinePurchase) => void;
}

export function ItemPurchaseGraph({
  purchases,
  duration,
  t,
  selectedEventId,
  onSelect,
}: Props) {
  const max = Math.max(1, duration);

  return (
    <div>
      <div className="mb-2 text-[11px] uppercase tracking-wide text-zinc-500">
        Purchase timeline
      </div>
      <div className="relative h-14 rounded-lg border border-zinc-800 bg-zinc-950/70 px-2">
        <div className="absolute inset-x-2 top-1/2 h-px -translate-y-1/2 bg-zinc-700" />
        {/* playhead */}
        <div
          className="absolute top-1 bottom-1 w-px bg-amber-400/80"
          style={{ left: `calc(${(t / max) * 100}% + 8px)` }}
        />
        {purchases.map((p) => {
          const left = (p.timestamp / max) * 100;
          const color = categoryColor(p.category);
          const selected = selectedEventId === p.eventId;
          return (
            <button
              key={p.eventId}
              type="button"
              title={`${formatClock(p.timestamp)} · ${p.item}`}
              onClick={() => onSelect(p)}
              className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 transition hover:scale-125"
              style={{
                left: `calc(${left}% + 8px)`,
                width: selected ? 14 : 10,
                height: selected ? 14 : 10,
                background: color,
                borderColor: selected ? '#fbbf24' : `${color}`,
                boxShadow: selected ? `0 0 0 3px ${color}44` : undefined,
              }}
            />
          );
        })}
      </div>
      <div className="mt-1 flex justify-between text-[10px] font-mono text-zinc-600">
        <span>0:00</span>
        <span>{formatClock(duration)}</span>
      </div>
    </div>
  );
}
