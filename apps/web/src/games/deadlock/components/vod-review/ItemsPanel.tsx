'use client';

import type {
  BuildReview,
  ItemPurchaseAnalysis,
  MatchTimelinePurchase,
} from '@coachcore/shared';
import { formatClock } from './format';
import { BuildPath } from './BuildPath';
import { CategoryDot, ItemIcon } from './ItemIcon';
import { InventoryReplay } from './InventoryReplay';
import { ItemDetailPanel } from './ItemDetailPanel';
import { ItemPurchaseGraph } from './ItemPurchaseGraph';
import { cn } from '@/lib/utils';

interface Props {
  purchases: MatchTimelinePurchase[];
  review: BuildReview | undefined;
  t: number;
  duration: number;
  selectedEventId: string | null;
  onSelectPurchase: (purchase: MatchTimelinePurchase) => void;
  onClearSelection?: () => void;
}

export function ItemsPanel({
  purchases,
  review,
  t,
  duration,
  selectedEventId,
  onSelectPurchase,
  onClearSelection,
}: Props) {
  const selected = purchases.find((p) => p.eventId === selectedEventId) ?? null;
  const analysis: ItemPurchaseAnalysis | null =
    review?.purchases.find((a) => a.eventId === selectedEventId) ?? null;

  return (
    <div className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Purchased Items</h2>
          <p className="text-xs text-zinc-500">
            Chronological shop buys with inventory, build path, and AI analysis
          </p>
        </div>
        {review && (
          <div className="rounded-lg bg-zinc-900 px-3 py-1.5 text-right">
            <div className="text-[10px] uppercase text-zinc-500">Build score</div>
            <div className="text-xl font-semibold text-amber-300">{review.overallScore}</div>
          </div>
        )}
      </div>

      <ItemPurchaseGraph
        purchases={purchases}
        duration={duration}
        t={t}
        selectedEventId={selectedEventId}
        onSelect={onSelectPurchase}
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {purchases.length === 0 && (
            <p className="text-xs text-zinc-500 py-6 text-center">
              No item purchases extracted from this replay.
            </p>
          )}
          {purchases.map((p) => {
            const a = review?.purchases.find((x) => x.eventId === p.eventId);
            return (
              <button
                key={p.eventId}
                type="button"
                onClick={() => onSelectPurchase(p)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left transition',
                  selectedEventId === p.eventId
                    ? 'border-amber-400/40 bg-amber-500/10'
                    : 'border-zinc-800 bg-zinc-950/50 hover:bg-zinc-900'
                )}
              >
                <ItemIcon itemIdOrName={p.itemId} size="md" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-amber-300">
                      {formatClock(p.timestamp)}
                    </span>
                    <CategoryDot category={p.category} />
                    <span className="truncate text-sm text-white">{p.item}</span>
                  </div>
                  <div className="mt-0.5 text-[11px] text-zinc-500">
                    {p.cost} souls · slot {p.slotIndex + 1} · spent {p.totalSoulsSpent}
                    {a ? ` · ${a.rating}` : ''}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <InventoryReplay
          purchases={purchases}
          t={t}
          selectedEventId={selectedEventId}
          onSelect={onSelectPurchase}
        />
      </div>

      <BuildPath review={review} purchases={purchases} onSelect={onSelectPurchase} />

      {selected && (
        <ItemDetailPanel
          purchase={selected}
          analysis={analysis}
          onClose={() => onClearSelection?.()}
        />
      )}

      {review && <BuildReviewSummary review={review} />}
    </div>
  );
}

function BuildReviewSummary({ review }: { review: BuildReview }) {
  return (
    <div className="space-y-3 rounded-lg border border-zinc-800 bg-zinc-950/60 p-3 text-sm">
      <div className="text-[11px] uppercase tracking-wide text-zinc-500">AI Build Review</div>
      <p className="text-zinc-300">{review.summary}</p>
      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <Score label="Early" value={review.earlyScore} />
        <Score label="Mid" value={review.midScore} />
        <Score label="Late" value={review.lateScore} />
      </div>
      {review.bestPurchase && (
        <p className="text-emerald-300/90 text-xs">
          Best: {review.bestPurchase.itemName} @ {formatClock(review.bestPurchase.timestamp)} (
          {review.bestPurchase.rating})
        </p>
      )}
      {review.worstPurchase && (
        <p className="text-rose-300/90 text-xs">
          Worst: {review.worstPurchase.itemName} @ {formatClock(review.worstPurchase.timestamp)} (
          {review.worstPurchase.rating})
        </p>
      )}
      {review.delayedPurchase && (
        <p className="text-amber-200/80 text-xs">Delayed: {review.delayedPurchase}</p>
      )}
      {review.missedPurchase && (
        <p className="text-amber-200/80 text-xs">Missed: {review.missedPurchase}</p>
      )}
      <div>
        <div className="text-[11px] text-zinc-500 mb-1">Recommended order</div>
        <p className="text-xs text-zinc-400">{review.recommendedBuildOrder.join(' → ')}</p>
      </div>
      <p className="text-xs text-zinc-400">{review.alternativeVsEnemy}</p>
      <div className="space-y-2">
        {review.comparisons.map((c) => (
          <div key={c.versus} className="rounded bg-zinc-900/80 px-2 py-1.5">
            <div className="text-[11px] text-zinc-400">
              vs {c.versus}
              {c.isEstimate ? ' (estimate)' : ''}
            </div>
            <ul className="mt-1 space-y-0.5">
              {c.notes.map((n) => (
                <li key={n} className="text-[11px] text-zinc-500">
                  · {n}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

function Score({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded bg-zinc-900 px-2 py-1.5">
      <div className="text-[10px] text-zinc-500">{label}</div>
      <div className="text-sm font-semibold text-zinc-200">{value}</div>
    </div>
  );
}
