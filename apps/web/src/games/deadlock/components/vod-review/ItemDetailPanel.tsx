'use client';

import type { ReactNode } from 'react';
import type { ItemPurchaseAnalysis, MatchTimelinePurchase } from '@coachcore/shared';
import { categoryColor, resolveItemDef } from '@coachcore/shared';
import { X } from 'lucide-react';
import { formatClock } from './format';
import { CategoryDot, ItemIcon } from './ItemIcon';
import { cn } from '@/lib/utils';

interface Props {
  purchase: MatchTimelinePurchase | null;
  analysis: ItemPurchaseAnalysis | null;
  onClose: () => void;
}

export function ItemDetailPanel({ purchase, analysis, onClose }: Props) {
  if (!purchase) return null;
  const def = resolveItemDef(purchase.itemId || purchase.item);
  const color = categoryColor(def.category);

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/95 overflow-hidden shadow-xl">
      <div className="flex items-start justify-between gap-3 border-b border-zinc-800 px-4 py-3">
        <div className="flex gap-3">
          <ItemIcon itemIdOrName={def.id} size="lg" />
          <div>
            <h3 className="text-lg font-semibold text-white">{def.name}</h3>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-zinc-400">
              <span className="inline-flex items-center gap-1">
                <CategoryDot category={def.category} /> {def.category}
              </span>
              <span>Tier {def.tier}</span>
              <span style={{ color }}>{purchase.cost || def.cost} souls</span>
              <span className="font-mono text-amber-300/90">{formatClock(purchase.timestamp)}</span>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-white"
          aria-label="Close item panel"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="max-h-[55vh] space-y-4 overflow-y-auto px-4 py-3 text-sm">
        <p className="text-zinc-300 leading-relaxed">{def.description}</p>

        <MetaRow label="Soul cost" value={`${purchase.cost || def.cost} souls`} />
        <MetaRow label="Inventory slot" value={`Slot ${purchase.slotIndex + 1}`} />
        <MetaRow label="Total spent" value={`${purchase.totalSoulsSpent} souls`} />

        {def.stats.length > 0 && (
          <Block title="Stats">
            <ul className="space-y-1">
              {def.stats.map((s) => (
                <li key={s} className="text-zinc-400">
                  · {s}
                </li>
              ))}
            </ul>
          </Block>
        )}
        {def.passiveEffects.length > 0 && (
          <Block title="Passive effects">
            <ul className="space-y-1">
              {def.passiveEffects.map((s) => (
                <li key={s} className="text-zinc-400">
                  · {s}
                </li>
              ))}
            </ul>
          </Block>
        )}
        {def.activeEffects && def.activeEffects.length > 0 && (
          <Block title="Active effects">
            <ul className="space-y-1">
              {def.activeEffects.map((s) => (
                <li key={s} className="text-emerald-300/80">
                  · {s}
                </li>
              ))}
            </ul>
          </Block>
        )}
        {def.cooldownSeconds != null && def.cooldownSeconds > 0 && (
          <MetaRow label="Cooldown" value={`${def.cooldownSeconds}s`} />
        )}
        {def.prerequisites && def.prerequisites.length > 0 && (
          <MetaRow label="Prerequisites" value={def.prerequisites.join(', ')} />
        )}
        {def.upgradesInto && def.upgradesInto.length > 0 && (
          <MetaRow label="Upgrade path" value={def.upgradesInto.join(' → ')} />
        )}

        {analysis && (
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] uppercase tracking-wide text-amber-300/90">
                AI Item Analysis
              </span>
              <span
                className={cn(
                  'rounded px-1.5 py-0.5 text-[10px] uppercase',
                  analysis.rating === 'excellent' || analysis.rating === 'good'
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : analysis.rating === 'poor' || analysis.rating === 'questionable'
                      ? 'bg-rose-500/20 text-rose-300'
                      : 'bg-zinc-700 text-zinc-300'
                )}
              >
                {analysis.rating}
              </span>
            </div>
            <p className="text-zinc-200">{analysis.whyPurchased}</p>
            <p className="text-zinc-400">
              <span className="text-zinc-500">Timing: </span>
              {analysis.timingAssessment}
            </p>
            <p className="text-zinc-400">
              <span className="text-zinc-500">Fight impact: </span>
              {analysis.fightImpact}
            </p>
            <p className="text-zinc-400">
              <span className="text-zinc-500">Problem solved: </span>
              {analysis.problemSolved}
            </p>
            <p className="text-zinc-400">
              <span className="text-zinc-500">Power spike: </span>
              {analysis.powerSpikeNote}
            </p>
            {analysis.alternativeItem && (
              <p className="text-sky-300/90">
                Alternative: {analysis.alternativeItem}. {analysis.alternativeReason}
              </p>
            )}
            <p className="text-[11px] text-zinc-500">
              Confidence: {analysis.confidence}%
              {analysis.isEstimate ? ' · estimate' : ''}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 text-xs">
      <span className="text-zinc-500">{label}</span>
      <span className="text-right text-zinc-300">{value}</span>
    </div>
  );
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <div className="mb-1 text-[11px] uppercase tracking-wide text-zinc-500">{title}</div>
      {children}
    </div>
  );
}
