import type {
  BuildPhaseItems,
  BuildReview,
  ItemPurchaseAnalysis,
  ParsedReplay,
} from '@clutchcore/shared';
import { buildMatchTimeline, resolveItemDef } from '@clutchcore/shared';

function formatClock(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * Evidence-backed itemization review from purchase + combat timelines.
 */
export function analyzeBuild(replay: ParsedReplay): BuildReview {
  const tl = buildMatchTimeline(replay);
  const purchases = tl.enrichedPurchases ?? [];
  const duration = Math.max(1, replay.metadata.durationSeconds);
  const subjectDeaths = replay.events.filter(
    (e) => e.type === 'death' && e.targetId === replay.subjectPlayerId
  );
  const subjectKills = replay.events.filter(
    (e) => e.type === 'kill' && e.actorId === replay.subjectPlayerId
  );

  const analyses: ItemPurchaseAnalysis[] = purchases.map((p, index) => {
    const def = resolveItemDef(p.item);
    const nextFight = replay.teamFights.find((f) => f.startTime >= p.timestamp);
    const killsAfter = subjectKills.filter(
      (k) => k.timestamp >= p.timestamp && k.timestamp <= p.timestamp + 90
    ).length;
    const deathsAfter = subjectDeaths.filter(
      (d) => d.timestamp >= p.timestamp && d.timestamp <= p.timestamp + 90
    ).length;
    const expectedByTier =
      def.tier === 1
        ? duration * 0.12 * (index + 1)
        : def.tier === 2
          ? duration * 0.28
          : def.tier === 3
            ? duration * 0.5
            : duration * 0.7;
    const early = p.timestamp < expectedByTier * 0.75;
    const late = p.timestamp > expectedByTier * 1.35;

    let rating: ItemPurchaseAnalysis['rating'] = 'okay';
    if (killsAfter > deathsAfter && !late) rating = 'excellent';
    else if (killsAfter >= deathsAfter && early) rating = 'good';
    else if (deathsAfter > killsAfter + 1 || late) rating = 'questionable';
    else if (deathsAfter >= 2 && killsAfter === 0) rating = 'poor';

    const alternative =
      def.category === 'Spirit'
        ? 'Extra Stamina'
        : def.category === 'Vitality'
          ? 'Mystic Burst'
          : 'Extra Health';

    return {
      eventId: p.eventId,
      timestamp: p.timestamp,
      itemName: def.name,
      itemId: def.id,
      cost: p.cost,
      category: def.category,
      slotIndex: p.slotIndex,
      rating,
      whyPurchased: `At ${formatClock(p.timestamp)} you bought ${def.name} (${def.category}, ${p.cost} souls) into slot ${p.slotIndex + 1}. Running spend: ${p.totalSoulsSpent} souls.`,
      timingAssessment: late
        ? `Timing looks delayed versus a typical tier-${def.tier} spike window (~${formatClock(expectedByTier)}).`
        : early
          ? `Timing is aggressive/early for a tier-${def.tier} buy — you accelerated this spike.`
          : `Timing is in a normal window for tier-${def.tier} (${def.cost} souls).`,
      alternativeItem: alternative,
      alternativeReason:
        rating === 'excellent' || rating === 'good'
          ? `${alternative} would have been safer, but ${def.name} fits an aggressive ${def.category} plan given your lane/fight state.`
          : `${alternative} may have been stronger here — your next 90s showed ${deathsAfter} death(s) and ${killsAfter} kill(s).`,
      fightImpact: nextFight
        ? `Next clustered fight ${formatClock(nextFight.startTime)}–${formatClock(nextFight.endTime)} ended ${nextFight.outcome}. In the 90s after this buy: ${killsAfter} kill(s), ${deathsAfter} death(s).`
        : `No clustered fight immediately after. In the next 90s: ${killsAfter} kill(s), ${deathsAfter} death(s).`,
      problemSolved:
        def.category === 'Vitality'
          ? 'Survivability / mobility for rotates and surviving skirmishes.'
          : def.category === 'Spirit'
            ? 'Ability damage / utility spike for kill threat.'
            : 'Weapon damage / fire-rate spike for gunfights.',
      powerSpikeNote: late
        ? `This purchase may have delayed your next power spike relative to fight timing at ${nextFight ? formatClock(nextFight.startTime) : 'mid-game'}.`
        : `This purchase supports the next objective/fight window${nextFight ? ` at ${formatClock(nextFight.startTime)}` : ''}.`,
      confidence: purchases.length > 0 ? (def.cost > 0 ? 82 : 55) : 30,
      isEstimate: def.cost === 0 || replay.extractionConfidence === 'minimal',
      relatedEventIds: [p.eventId],
    };
  });

  const scoreFor = (list: ItemPurchaseAnalysis[]) => {
    if (list.length === 0) return 55;
    const map = { excellent: 95, good: 80, okay: 65, questionable: 45, poor: 30 };
    return Math.round(list.reduce((s, a) => s + map[a.rating], 0) / list.length);
  };

  const early = analyses.filter((a) => a.timestamp < duration / 3);
  const mid = analyses.filter(
    (a) => a.timestamp >= duration / 3 && a.timestamp < (duration * 2) / 3
  );
  const late = analyses.filter((a) => a.timestamp >= (duration * 2) / 3);

  const rank = { excellent: 4, good: 3, okay: 2, questionable: 1, poor: 0 };
  const best = [...analyses].sort((a, b) => rank[b.rating] - rank[a.rating])[0];
  const worst = [...analyses].sort((a, b) => rank[a.rating] - rank[b.rating])[0];

  const phases: BuildPhaseItems[] = [
    phaseBlock('starting', 'Starting Items', analyses.slice(0, Math.min(2, analyses.length))),
    phaseBlock('early', 'Early Game', early),
    phaseBlock('mid', 'Mid Game', mid),
    phaseBlock('late', 'Late Game', late),
    phaseBlock('final', 'Final Inventory', analyses.slice(-Math.min(12, analyses.length))),
  ];

  const overallScore = scoreFor(analyses);
  const weaponCount = analyses.filter((a) => a.category === 'Weapon').length;
  const vitCount = analyses.filter((a) => a.category === 'Vitality').length;
  const spiritCount = analyses.filter((a) => a.category === 'Spirit').length;

  const delayed = analyses.find((a) => a.timingAssessment.includes('delayed'));
  const missed =
    vitCount === 0
      ? 'Extra Health or Sprint Boots (no Vitality purchases recorded)'
      : spiritCount === 0
        ? 'Mystic Burst / Extra Spirit (no Spirit purchases recorded)'
        : weaponCount === 0
          ? 'Rapid Rounds / Close Quarters (no Weapon purchases recorded)'
          : undefined;

  return {
    overallScore,
    earlyScore: scoreFor(early),
    midScore: scoreFor(mid),
    lateScore: scoreFor(late),
    bestPurchase: best,
    worstPurchase: worst && worst.eventId !== best?.eventId ? worst : undefined,
    delayedPurchase: delayed
      ? `${delayed.itemName} at ${formatClock(delayed.timestamp)}`
      : undefined,
    missedPurchase: missed,
    recommendedBuildOrder:
      analyses.length > 0
        ? analyses.map((a) => a.itemName)
        : ['Sprint Boots', 'Extra Stamina', 'Mystic Burst', 'Improved Spirit'],
    alternativeVsEnemy:
      'Against tankier enemy comps, prioritize Tankbuster / spirit shred earlier; against dive, buy Extra Stamina + Reactive Barrier before pure damage.',
    summary:
      analyses.length === 0
        ? 'No item purchase events were extracted from this demo — re-upload or check parse notes.'
        : `Build spent across Weapon ${weaponCount} / Vitality ${vitCount} / Spirit ${spiritCount}. Overall itemization score ${overallScore}/100 based on timing vs your fight outcomes.`,
    phases,
    comparisons: [
      {
        versus: 'Top 1% (same hero)',
        notes: [
          best
            ? `Your best buy (${best.itemName} @ ${formatClock(best.timestamp)}) aligns with aggressive high-MMR timings when rated ${best.rating}.`
            : 'Insufficient purchases to compare.',
          delayed
            ? `High-MMR players typically complete ${delayed.itemName} earlier than ${formatClock(delayed.timestamp)}.`
            : 'No clearly delayed tier spike detected.',
        ],
        isEstimate: true,
      },
      {
        versus: 'Professional players',
        notes: [
          'Pro builds often hit a tier-2 combat item before the first mid-boss contest.',
          missed ? `Pros rarely skip: ${missed}.` : 'Category coverage looks complete.',
        ],
        isEstimate: true,
      },
      {
        versus: 'Same MMR range',
        notes: [
          `Peers usually own ~${Math.max(3, Math.round(duration / 180))} shop items by ${formatClock(duration)}; you recorded ${analyses.length}.`,
        ],
        isEstimate: true,
      },
    ],
    purchases: analyses,
  };
}

function phaseBlock(
  phase: BuildPhaseItems['phase'],
  label: string,
  list: ItemPurchaseAnalysis[]
): BuildPhaseItems {
  return {
    phase,
    label,
    itemIds: list.map((a) => a.itemId),
    itemNames: list.map((a) => a.itemName),
    timestamps: list.map((a) => a.timestamp),
  };
}
