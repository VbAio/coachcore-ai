import type {
  CoachInsight,
  MatchPhase,
  MistakeCategory,
  MistakeSeverity,
} from '@coachcore/shared';
import type { ExtractedFeatures } from '@coachcore/replay-parser';
import type { ParsedReplay } from '@coachcore/shared';

export interface DetectedMistake extends CoachInsight {
  id: string;
}

const VAGUE_BANNED = [
  'play safer',
  'play better',
  'be more careful',
  'improve your gameplay',
  'just farm',
];

/**
 * Event-driven moment detector. Every non-estimate insight must cite relatedEventIds.
 */
export function detectMistakes(
  replay: ParsedReplay,
  features: ExtractedFeatures
): DetectedMistake[] {
  const moments: DetectedMistake[] = [];
  const duration = Math.max(1, replay.metadata.durationSeconds);
  let id = 0;

  const playerLabel = (pid?: string) => {
    if (!pid) return 'an unknown player';
    const p = replay.metadata.players.find((x) => x.steamId === pid);
    if (!p) return shortId(pid);
    return p.hero && p.hero !== 'unknown_hero' ? `${p.name} (${p.hero})` : p.name;
  };

  const phaseOf = (t: number): MatchPhase => {
    if (t < duration / 3) return 'laning';
    if (t < (duration * 2) / 3) return 'mid';
    return 'late';
  };

  const add = (
    partial: Omit<DetectedMistake, 'id'> & { timestamp: number; id?: string }
  ) => {
    const text = [
      partial.whatHappened,
      partial.alternativePlay,
      partial.howToImprove,
    ]
      .join(' ')
      .toLowerCase();
    for (const banned of VAGUE_BANNED) {
      if (text.includes(banned) && !partial.isEstimate) {
        partial.howToImprove = `${partial.howToImprove} Review the exact timestamp and name the information you missed.`;
        break;
      }
    }
    if (!partial.isEstimate && (!partial.relatedEventIds || partial.relatedEventIds.length === 0)) {
      // Refuse orphan non-estimate insights
      return;
    }
    const { id: explicitId, ...rest } = partial;
    moments.push({ ...rest, id: explicitId ?? `moment-${id++}` });
  };

  const subjectDeaths = replay.events.filter(
    (e) => e.type === 'death' && e.targetId === replay.subjectPlayerId
  );
  const subjectKills = replay.events.filter(
    (e) => e.type === 'kill' && e.actorId === replay.subjectPlayerId
  );
  const subjectAssists = replay.events.filter(
    (e) => e.type === 'assist' && e.actorId === replay.subjectPlayerId
  );
  const hasRealCombat = subjectDeaths.length + subjectKills.length > 0;

  // --- Deaths ---
  for (const death of subjectDeaths.slice(0, 16)) {
    const recentKill = subjectKills.find(
      (k) => Math.abs(k.timestamp - death.timestamp) < 20
    );
    const nearbyCasts = replay.events.filter(
      (e) =>
        e.type === 'ability_cast' &&
        e.actorId === replay.subjectPlayerId &&
        e.timestamp >= death.timestamp - 12 &&
        e.timestamp <= death.timestamp
    );
    const phase = phaseOf(death.timestamp);
    const killer = playerLabel(death.actorId);
    const related = [
      death.eventId,
      recentKill?.eventId,
      ...nearbyCasts.map((c) => c.eventId),
    ].filter((x): x is string => Boolean(x));

    const castNote =
      nearbyCasts.length > 0
        ? ` In the 12s before death you cast: ${nearbyCasts.map((c) => c.ability ?? 'ability').join(', ')}.`
        : ' No subject ability casts were recorded in the 12s before this death.';

    add({
      timestamp: death.timestamp,
      title: phase === 'laning' ? 'Lane-phase death' : 'Death',
      whatHappened: `At ${formatClock(death.timestamp)} you were killed by ${killer}.${castNote}`,
      whyItHappened: recentKill
        ? `You got a kill (${playerLabel(recentKill.targetId)}) within 20s — evidence suggests you stayed in the skirmish after the trade window closed.`
        : phase === 'laning'
          ? 'Early death with no nearby trade kill on your ledger — typically overextension or missing information on enemy roamers.'
          : 'Caught without a recorded trade kill nearby — positioning or late disengage relative to enemy threat.',
      whyBadOrGood:
        'A death without converting map tempo dumps respawn time and cedes space; stacked deaths compound into lost fights.',
      alternativePlay: recentKill
        ? `After securing the kill on ${playerLabel(recentKill.targetId)}, leave the area toward your nearest safe structure instead of re-engaging.`
        : phase === 'laning'
          ? 'Concede contested farm, play closer to your tower, and only step up when both side-lane threats are visible.'
          : 'Disengage when you cannot name two enemy positions and an escape path; reset before the next objective.',
      expectedOutcome:
        'Higher chance of surviving to the next item/ability spike and keeping wave pressure.',
      howToImprove: `Pause the VOD at ${formatClock(death.timestamp)}. Write: (1) last safe window, (2) who killed you, (3) which ability you still had.`,
      drills: [
        `VOD drill: pause every death and list the last safe second`,
        'Custom: practice disengage casts under pressure for 10 minutes',
      ],
      proExample:
        'High-MMR players leave skirmishes the moment the kill is no longer free.',
      category: (phase === 'laning' ? 'awareness' : 'positioning') as MistakeCategory,
      severity: (phase === 'laning' ? 'high' : 'medium') as MistakeSeverity,
      isEstimate: false,
      relatedEventIds: related,
      involvedPlayerIds: [replay.subjectPlayerId, death.actorId].filter(
        (x): x is string => Boolean(x)
      ),
      confidence: nearbyCasts.length > 0 || recentKill ? 88 : 78,
      impactEstimate: {
        label: 'tempo / respawn loss',
        winProbabilityDelta: phase === 'laning' ? -0.08 : -0.05,
        mmrDelta: phase === 'laning' ? -18 : -12,
      },
      phase,
      polarity: 'mistake',
      position: death.position
        ? { x: death.position.x, y: death.position.y }
        : undefined,
    });
  }

  // --- Kills (excellent) ---
  for (const kill of subjectKills.slice(0, 12)) {
    const related = [kill.eventId].filter((x): x is string => Boolean(x));
    const assistHelp = subjectAssists.filter(
      (a) => Math.abs(a.timestamp - kill.timestamp) < 8
    );
    add({
      timestamp: kill.timestamp,
      title: 'Kill secured',
      whatHappened: `At ${formatClock(kill.timestamp)} you killed ${playerLabel(kill.targetId)}${
        assistHelp.length ? ' with assist support nearby in the event stream' : ''
      }.`,
      whyItHappened:
        'You converted a fight window into a confirmed kill on the combat timeline.',
      whyBadOrGood:
        'Confirmed kills create numbers advantages for the next walker/mid-boss decision.',
      alternativePlay: `Immediately path to the nearest objective or safe farm — convert the ${formatClock(kill.timestamp)} kill into map pressure within 15s.`,
      expectedOutcome: 'Higher objective conversion after winning the skirmish.',
      howToImprove:
        'After each kill, announce the next structure or camp out loud before looking for another fight.',
      drills: ['Post-kill conversion: force walker damage after 5 custom kills'],
      category: 'decision_making',
      severity: 'low',
      isEstimate: false,
      relatedEventIds: related,
      involvedPlayerIds: [replay.subjectPlayerId, kill.targetId].filter(
        (x): x is string => Boolean(x)
      ),
      confidence: 90,
      phase: phaseOf(kill.timestamp),
      polarity: 'excellent',
      position: kill.position
        ? { x: kill.position.x, y: kill.position.y }
        : undefined,
    });
  }

  // --- Ability casts near deaths (ability usage) ---
  for (const death of subjectDeaths.slice(0, 8)) {
    const wasteCasts = replay.events.filter(
      (e) =>
        e.type === 'ability_cast' &&
        e.actorId === replay.subjectPlayerId &&
        e.timestamp >= death.timestamp - 6 &&
        e.timestamp < death.timestamp
    );
    if (wasteCasts.length === 0) continue;
    const related = [death.eventId, ...wasteCasts.map((c) => c.eventId)].filter(
      (x): x is string => Boolean(x)
    );
    add({
      timestamp: death.timestamp,
      title: 'Ability cast before death',
      whatHappened: `At ${formatClock(death.timestamp)} you died after casting ${wasteCasts
        .map((c) => c.ability ?? 'ability')
        .join(', ')} in the prior 6 seconds.`,
      whyItHappened:
        'Ability commitment without a secured exit — the cast timeline ends in a death event.',
      whyBadOrGood:
        'Burning key abilities into a losing fight leaves you without tools for the next wave.',
      alternativePlay: `Hold ${wasteCasts[0]?.ability ?? 'your key ability'} until you have a confirmed escape or a numbers advantage.`,
      expectedOutcome: 'Fewer deaths with major cooldowns wasted.',
      howToImprove: `At ${formatClock(death.timestamp)}, check whether the cast had an exit plan before the commit.`,
      drills: ['Ability-commit checklist: target, escape, backup teammate'],
      category: 'ability_usage',
      severity: 'medium',
      isEstimate: false,
      relatedEventIds: related,
      involvedPlayerIds: [replay.subjectPlayerId],
      confidence: 82,
      phase: phaseOf(death.timestamp),
      polarity: 'mistake',
    });
  }

  // --- Item purchases ---
  const subjectItems = replay.events.filter(
    (e) => e.type === 'item_purchase' && (!e.actorId || e.actorId === replay.subjectPlayerId)
  );
  for (const item of subjectItems.slice(0, 8)) {
    const related = [item.eventId].filter((x): x is string => Boolean(x));
    if (related.length === 0) continue;
    add({
      timestamp: item.timestamp,
      title: `Item: ${item.item ?? 'purchase'}`,
      whatHappened: `At ${formatClock(item.timestamp)} the demo recorded purchase of ${item.item ?? 'an item'}.`,
      whyItHappened:
        'Item timing is taken from the purchase notification in the replay — cost/efficiency data is not available yet.',
      whyBadOrGood:
        'Purchase timing shapes your next power spike relative to fights on the timeline.',
      alternativePlay: `Compare this buy at ${formatClock(item.timestamp)} against the next teamfight on the timeline — buy before contested objectives when possible.`,
      expectedOutcome: 'Power spikes aligned with fights rather than after them.',
      howToImprove:
        'Before buying, name the next objective timer and whether you need combat stats or sustain.',
      drills: ['Item timing VOD: mark each buy vs next fight'],
      category: 'itemization',
      severity: 'low',
      isEstimate: false,
      relatedEventIds: related,
      involvedPlayerIds: [replay.subjectPlayerId],
      confidence: 70,
      phase: phaseOf(item.timestamp),
      polarity: 'neutral',
    });
  }

  // --- Objectives ---
  const objectives = replay.events.filter((e) => e.type === 'objective');
  for (const obj of objectives.slice(0, 6)) {
    const related = [obj.eventId].filter((x): x is string => Boolean(x));
    if (related.length === 0) continue;
    const label =
      obj.ability === 'mid_boss_spawn' ? 'Mid boss spawn' : 'Objective event';
    add({
      timestamp: obj.timestamp,
      title: label,
      whatHappened: `At ${formatClock(obj.timestamp)} an objective event fired (${label}).`,
      whyItHappened:
        'Objective notifications are parsed from the demo; subject participation is not fully attributed yet.',
      whyBadOrGood:
        'Objective windows decide map control even when KDA looks fine.',
      alternativePlay: `At ${formatClock(obj.timestamp)}, be pathing toward the objective 10–15s early with teammates.`,
      expectedOutcome: 'Higher conversion of fights into structures / mid boss.',
      howToImprove:
        'When an objective spawns, ping your ETA and clear the nearest wave only if you still arrive on time.',
      drills: ['Objective first: ignore side farm for 2 mid-boss windows in customs'],
      category: 'objective_play',
      severity: 'medium',
      isEstimate: true,
      relatedEventIds: related,
      involvedPlayerIds: [replay.subjectPlayerId],
      confidence: 55,
      phase: phaseOf(obj.timestamp),
      polarity: 'neutral',
    });
  }

  // --- Teamfights ---
  for (const fight of replay.teamFights.slice(0, 10)) {
    const fightEvents = replay.events.filter(
      (e) =>
        (e.type === 'kill' || e.type === 'death') &&
        e.timestamp >= fight.startTime &&
        e.timestamp <= fight.endTime
    );
    const related = fightEvents
      .map((e) => e.eventId)
      .filter((x): x is string => Boolean(x));
    if (related.length === 0) continue;

    const subjectDied = fightEvents.some(
      (e) => e.type === 'death' && e.targetId === replay.subjectPlayerId
    );
    const subjectGotKill = fightEvents.some(
      (e) => e.type === 'kill' && e.actorId === replay.subjectPlayerId
    );
    const isMistake = fight.outcome === 'lost' || (subjectDied && !subjectGotKill);

    add({
      timestamp: fight.startTime,
      title: `Teamfight (${fight.outcome})`,
      whatHappened: `Fight ${formatClock(fight.startTime)}–${formatClock(fight.endTime)}: ${fight.kills} kills, outcome ${fight.outcome} for your team. You ${
        subjectDied ? 'died' : 'survived'
      }${subjectGotKill ? ' and secured a kill' : ''}.`,
      whyItHappened: isMistake
        ? 'Kill clustering shows your side lost the exchange or you died without a trade in-window.'
        : 'Your side won the kill exchange or you contributed without feeding.',
      whyBadOrGood: isMistake
        ? 'Lost fights around this window often precede objective losses.'
        : 'Won fights should convert into walker/mid-boss damage immediately.',
      alternativePlay: isMistake
        ? `Enter ${formatClock(fight.startTime)} only with a numbers edge, or peel to the nearest safe structure.`
        : `From ${formatClock(fight.endTime)}, hit the nearest objective within 15 seconds.`,
      expectedOutcome: isMistake
        ? 'Fewer stacked deaths in clustered fights.'
        : 'Higher objective conversion after winning the cluster.',
      howToImprove: `Scrub ${formatClock(fight.startTime)} and mark who engaged first among: ${fight.participants
        .slice(0, 4)
        .map(playerLabel)
        .join(', ')}.`,
      drills: ['Fight entry checklist: count visible enemies before committing'],
      category: 'team_fighting',
      severity: (fight.outcome === 'lost' ? 'high' : 'low') as MistakeSeverity,
      isEstimate: false,
      relatedEventIds: related,
      involvedPlayerIds: fight.participants,
      confidence: 85,
      impactEstimate: {
        label: fight.outcome === 'won' ? 'fight win' : 'fight loss',
        winProbabilityDelta: fight.outcome === 'won' ? 0.1 : fight.outcome === 'lost' ? -0.12 : 0,
      },
      phase: phaseOf(fight.startTime),
      polarity: isMistake ? 'mistake' : 'excellent',
    });
  }

  // Aggregate early deaths (still event-backed)
  if (features.lanePhaseDeaths >= 2 && subjectDeaths.length >= 2) {
    const early = subjectDeaths.filter((d) => d.timestamp < duration / 3);
    const related = early
      .map((d) => d.eventId)
      .filter((x): x is string => Boolean(x));
    if (related.length > 0) {
      add({
        timestamp: early[0].timestamp,
        title: 'Repeated early deaths',
        whatHappened: `You died ${early.length} times before ${formatClock(duration / 3)} (events at ${early
          .slice(0, 4)
          .map((d) => formatClock(d.timestamp))
          .join(', ')}).`,
        whyItHappened: 'Lane aggression outpaced information and wave state across multiple death events.',
        whyBadOrGood: 'Stacked early deaths snowball into a permanent item and tempo deficit.',
        alternativePlay:
          'Play for XP safety until your first major item, then contest river fights.',
        expectedOutcome: 'Reach mid-game with fewer stacked death timers.',
        howToImprove:
          'Set a hard rule: no river fights before first major item unless you see 4+ enemies.',
        drills: ['10-minute freeze/slow-push practice', 'Minimap glance every 3 seconds'],
        category: 'awareness',
        severity: 'critical',
        isEstimate: false,
        relatedEventIds: related,
        involvedPlayerIds: [replay.subjectPlayerId],
        confidence: 92,
        impactEstimate: { label: 'early snowball risk', winProbabilityDelta: -0.14, mmrDelta: -25 },
        phase: 'laning',
        polarity: 'mistake',
      });
    }
  }

  // Scaffold / no combat — estimates only
  if (!hasRealCombat && features.isEstimate) {
    add({
      timestamp: Math.min(252, duration * 0.2),
      title: 'Limited parse — coaching estimate',
      whatHappened:
        'This demo did not yield combat events for your subject. Coaching below is heuristic, not evidence-backed.',
      whyItHappened:
        'Scaffold or incomplete deadem extraction — no death/kill stream available.',
      whyBadOrGood:
        'Without timestamps, advice cannot be tied to specific mistakes in this match.',
      alternativePlay:
        'Re-upload with a valid .dem and optional Steam ID so the parser can bind your subject.',
      expectedOutcome: 'Event-driven timeline with clickable deaths, fights, and items.',
      howToImprove:
        'Confirm the file is a full Deadlock match demo and that subjectSteamId matches your account.',
      drills: ['Upload a short custom demo to verify parsing'],
      category: 'decision_making',
      severity: 'medium',
      isEstimate: true,
      relatedEventIds: [],
      confidence: 20,
      phase: 'laning',
      polarity: 'neutral',
    });
  }

  return moments.sort((a, b) => a.timestamp - b.timestamp);
}

export function groupMistakesByCategory(
  mistakes: DetectedMistake[]
): Record<MistakeCategory, DetectedMistake[]> {
  const categories: MistakeCategory[] = [
    'positioning',
    'awareness',
    'mechanics',
    'greed',
    'objective_play',
    'economy',
    'ability_usage',
    'itemization',
    'team_fighting',
    'decision_making',
    'communication',
    'vision',
  ];

  const grouped = Object.fromEntries(
    categories.map((c) => [c, [] as DetectedMistake[]])
  ) as Record<MistakeCategory, DetectedMistake[]>;

  for (const m of mistakes) {
    grouped[m.category].push(m);
  }
  return grouped;
}

/** Exported for tests */
export function assertEvidenceBacked(moments: DetectedMistake[]): boolean {
  return moments
    .filter((m) => !m.isEstimate)
    .every(
      (m) =>
        Array.isArray(m.relatedEventIds) &&
        m.relatedEventIds.length > 0 &&
        m.whatHappened.trim().length > 0 &&
        m.alternativePlay.trim().length > 0
    );
}

function formatClock(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function shortId(id: string): string {
  if (id.startsWith('name:')) return id.slice(5);
  if (id.length > 12) return `${id.slice(0, 6)}…`;
  return id;
}
