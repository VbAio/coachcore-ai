import type {
  CoachInsight,
  MatchPhase,
  MistakeCategory,
  MistakeSeverity,
} from '@clutchcore/shared';
import type { ExtractedFeatures } from '@clutchcore/replay-parser';
import type { ParsedReplay } from '@clutchcore/shared';

export interface DetectedMistake extends CoachInsight {
  id: string;
}

const VAGUE_BANNED = [
  'play safer',
  'play better',
  'be more careful',
  'improve your gameplay',
  'just farm',
  'farm more',
  'position better',
  'rotate earlier',
  'be less greedy',
];

const SEVERITY_SCORE: Record<string, number> = {
  critical: 95,
  game_losing: 98,
  high: 80,
  major: 78,
  medium: 55,
  low: 30,
  minor: 20,
};

const HERO_TIPS: Record<string, string> = {
  haze: 'On Haze, only re-engage after Sleep Dagger is available or you have fog cover — your DPS requires uninterrupted channel time.',
  infernus: 'On Infernus, flame trail should cut escape routes before you commit body; do not chase through unlit corners.',
  wraith: 'On Wraith, cards are your engage tax — never walk into a 1v2 without a card ready to reset spacing.',
  dynamo: 'On Dynamo, Singularity is a conversion tool after numbers advantage, not an opener into fog.',
  bebop: 'On Bebop, hook only when a teammate can confirm — failed hooks are death timers.',
  seven: 'On Seven, storm placement should deny the retreat path; standing in your own storm to chase is a common throw.',
  vindicta: 'On Vindicta, stake first, then take the off-angle — committing without stake burns your only peel.',
  abrams: 'On Abrams, charge is a gap-close after enemies burn mobility, not a blind engage into full HP backline.',
};

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

  const subjectHero =
    replay.metadata.players.find((p) => p.isSubject)?.hero?.toLowerCase() ?? '';

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
        partial.howToImprove = `${partial.howToImprove} At ${formatClock(partial.timestamp)}, name the exact info gap (enemy IDs, cooldowns, or wave state) you missed.`;
        break;
      }
    }
    if (!partial.isEstimate && (!partial.relatedEventIds || partial.relatedEventIds.length === 0)) {
      // Refuse orphan non-estimate insights
      return;
    }

    const severityScore = partial.severityScore ?? SEVERITY_SCORE[partial.severity] ?? 50;
    const wp =
      partial.winProbabilityDelta ??
      partial.impactEstimate?.winProbabilityDelta;
    const difficulty =
      partial.difficulty ??
      (severityScore >= 80 ? 8 : severityScore >= 55 ? 6 : 4);

    const heroTip =
      partial.heroSpecificAdvice ??
      Object.entries(HERO_TIPS).find(([k]) => subjectHero.includes(k))?.[1];

    const practiceDrill =
      partial.practiceDrill ??
      ({
        title: `${partial.category.replace(/_/g, ' ')} drill @ ${formatClock(partial.timestamp)}`,
        description:
          partial.drills[0] ??
          `Replay from ${formatClock(Math.max(0, partial.timestamp - 15))} and execute the alternative play written above.`,
        durationMinutes: severityScore >= 80 ? 20 : 12,
        difficulty: (difficulty >= 7 ? 'hard' : difficulty >= 5 ? 'medium' : 'easy') as
          | 'easy'
          | 'medium'
          | 'hard',
        successMetric: `Complete 3 clean reps without repeating the failure mode from ${formatClock(partial.timestamp)}.`,
      });

    const { id: explicitId, ...rest } = partial;
    moments.push({
      ...rest,
      id: explicitId ?? `moment-${id++}`,
      severityScore,
      difficulty,
      winProbabilityDelta: wp,
      practiceDrill,
      heroSpecificAdvice: heroTip,
      isCommonMistake: partial.isCommonMistake ?? partial.polarity === 'mistake',
      replayContext:
        partial.replayContext ??
        `${partial.polarity ?? 'neutral'} · ${partial.category.replace(/_/g, ' ')} · ${formatClock(partial.timestamp)}`,
    });
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

  const subjectItems = replay.events.filter(
    (e) => e.type === 'item_purchase' && (!e.actorId || e.actorId === replay.subjectPlayerId)
  );

  // --- Deaths ---
  for (const death of subjectDeaths.slice(0, 16)) {
    const recentKill = subjectKills.find(
      (k) => Math.abs(k.timestamp - death.timestamp) < 20
    );
    const recentItem = subjectItemsNear(replay, death.timestamp, 45);
    const phase = phaseOf(death.timestamp);
    const killer = playerLabel(death.actorId);
    const related = [death.eventId, recentKill?.eventId, recentItem?.eventId].filter(
      (x): x is string => Boolean(x)
    );

    const itemNote = recentItem
      ? ` Your last recorded buy before this death was ${recentItem.item} at ${formatClock(recentItem.timestamp)}.`
      : '';

    add({
      timestamp: death.timestamp,
      title: phase === 'laning' ? 'Lane-phase death' : 'Death',
      whatHappened: `At ${formatClock(death.timestamp)} you were killed by ${killer}.${itemNote}`,
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
        'Higher chance of surviving to the next item spike and keeping wave pressure.',
      howToImprove: `Pause the VOD at ${formatClock(death.timestamp)}. Write: (1) last safe window, (2) who killed you, (3) whether your last item spike was online.`,
      drills: [
        `VOD drill: pause every death and list the last safe second`,
        'Custom: practice disengaging under pressure for 10 minutes',
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
      confidence: recentItem || recentKill ? 88 : 78,
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

  // Itemization deep-dives are produced by analyzeBuild() → report.buildReview.
  // Keep a thin timeline marker for each purchase so the scrubber can jump to buys.
  for (const item of subjectItems.slice(0, 24)) {
    const related = [item.eventId].filter((x): x is string => Boolean(x));
    if (related.length === 0) continue;
    add({
      timestamp: item.timestamp,
      title: `Purchased ${item.item ?? 'item'}`,
      whatHappened: `At ${formatClock(item.timestamp)} you purchased ${item.item ?? 'an item'}${
        item.value ? ` (${item.value} souls)` : ''
      }. Open the Items panel for full AI analysis.`,
      whyItHappened: 'Purchase notification from the demo event stream.',
      whyBadOrGood: 'See Items → AI analysis for timing, alternatives, and fight impact.',
      alternativePlay: 'Select this purchase in the Items panel for recommended alternatives.',
      expectedOutcome: 'Power spike aligned with the next fight/objective window.',
      howToImprove: 'Review the Items build path and compare timing to the next teamfight.',
      drills: ['Item timing VOD: mark each buy vs next fight'],
      category: 'itemization',
      severity: 'low',
      isEstimate: false,
      relatedEventIds: related,
      involvedPlayerIds: [replay.subjectPlayerId],
      confidence: 75,
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

function subjectItemsNear(replay: ParsedReplay, timestamp: number, windowSec: number) {
  return replay.events
    .filter(
      (e) =>
        e.type === 'item_purchase' &&
        (!e.actorId || e.actorId === replay.subjectPlayerId) &&
        e.timestamp <= timestamp &&
        timestamp - e.timestamp <= windowSec
    )
    .sort((a, b) => b.timestamp - a.timestamp)[0];
}
