import type { CoachInsight, MistakeCategory, MistakeSeverity } from '@coachcore/shared';
import type { ExtractedFeatures } from '@coachcore/replay-parser';
import type { ParsedReplay } from '@coachcore/shared';

export interface DetectedMistake extends CoachInsight {
  id: string;
}

/**
 * Rule-based mistake detector. Prefers timestamped events from a real parse;
 * only invents estimate insights when combat data is missing.
 */
export function detectMistakes(
  replay: ParsedReplay,
  features: ExtractedFeatures
): DetectedMistake[] {
  const mistakes: DetectedMistake[] = [];
  const duration = replay.metadata.durationSeconds;
  let id = 0;

  const add = (partial: Omit<DetectedMistake, 'id'> & { timestamp: number }) => {
    mistakes.push({ ...partial, id: `mistake-${id++}` });
  };

  const subjectDeaths = replay.events.filter(
    (e) => e.type === 'death' && e.targetId === replay.subjectPlayerId
  );
  const subjectKills = replay.events.filter(
    (e) => e.type === 'kill' && e.actorId === replay.subjectPlayerId
  );
  const hasRealCombat = subjectDeaths.length + subjectKills.length > 0;

  // Real death events → concrete coaching moments
  for (const death of subjectDeaths.slice(0, 12)) {
    const recentKillsNearby = subjectKills.filter(
      (k) => Math.abs(k.timestamp - death.timestamp) < 20
    ).length;
    const lane = death.timestamp < duration / 3;
    add({
      timestamp: death.timestamp,
      title: lane ? 'Lane-phase death' : 'Death without trade',
      whatHappened: `You died at ${formatClock(death.timestamp)}${
        death.actorId ? ` (killed by ${shortId(death.actorId)})` : ''
      }.`,
      whyItHappened: lane
        ? 'Likely overextension or missing information on enemy roamers during lane.'
        : recentKillsNearby > 0
          ? 'You stayed in the fight after committing — check HP and ability cooldowns before re-engaging.'
          : 'Caught without vision or without teammates nearby.',
      whyBadOrGood:
        'Deaths without a trade dump tempo, souls, and map control to the enemy team.',
      alternativePlay: lane
        ? 'Concede contested farm, play closer to tower, and track both missing side laners.'
        : 'Disengage when below ~40% HP unless an objective is secured in the next 5 seconds.',
      expectedOutcome: 'Higher chance of surviving to the next item spike.',
      howToImprove:
        'Before every engage, name two enemy positions and your escape path out loud.',
      drills: [
        'VOD: pause on every death and write the last safe window',
        'Custom: practice disengage casts under 40% HP',
      ],
      proExample: 'High-MMR players leave skirmishes the moment the kill is no longer free.',
      category: (lane ? 'awareness' : 'positioning') as MistakeCategory,
      severity: (lane ? 'major' : 'medium') as MistakeSeverity,
      isEstimate: false,
    });
  }

  if (features.lanePhaseDeaths >= 2) {
    add({
      timestamp: Math.min(300, duration * 0.15),
      title: 'Repeated early deaths',
      whatHappened: `You died ${features.lanePhaseDeaths} times in the first third of the match.`,
      whyItHappened: 'Lane aggression outpaced information and wave state.',
      whyBadOrGood: 'Stacked early deaths snowball into a permanent item deficit.',
      alternativePlay: 'Play for XP safety until your first major item, then contest.',
      expectedOutcome: 'Reach mid-game with at least even net worth.',
      howToImprove: 'Set a hard rule: no river fights before first item unless you see 4+ enemies.',
      drills: ['10-minute freeze/slow-push practice', 'Minimap glance every 3 seconds'],
      category: 'awareness',
      severity: 'game_losing',
      isEstimate: !hasRealCombat,
    });
  }

  if (features.fightParticipation < 0.35 && replay.teamFights.length >= 2) {
    add({
      timestamp: duration * 0.55,
      title: 'Low teamfight participation',
      whatHappened: `You were present in only ${Math.round(features.fightParticipation * 100)}% of clustered fights.`,
      whyItHappened: 'Late rotations or farming through decisive fights.',
      whyBadOrGood: 'Missing fights cedes objectives even when your farm looks fine.',
      alternativePlay: 'Move toward the next fight 10–15 seconds earlier when the wave is pushed.',
      expectedOutcome: 'More assists/kills around objectives.',
      howToImprove: 'When your wave crashes, immediately path toward the nearest contested objective.',
      drills: ['Queue with a shotcaller; call your ETA to every fight'],
      category: 'team_fighting',
      severity: 'major',
      isEstimate: false,
    });
  }

  if (features.objectiveParticipation === 0 && hasRealCombat && duration > 600) {
    add({
      timestamp: duration * 0.5,
      title: 'No objective participation tracked',
      whatHappened: 'No mid-boss/tower objective events were tied to your impact timeline.',
      whyItHappened: 'Fights may not have converted into structures or mid-boss.',
      whyBadOrGood: 'Winning skirmishes without objectives wastes tempo.',
      alternativePlay: 'After two kills, immediately hit the nearest walker or mid boss.',
      expectedOutcome: 'Higher conversion rate from kills to map control.',
      howToImprove: 'Announce the next objective before the fight starts.',
      drills: ['Post-fight conversion: 5 customs forcing walker damage after kills'],
      category: 'objective_play',
      severity: 'medium',
      isEstimate: true,
    });
  }

  // Placeholder only when we truly have no combat signal
  if (!hasRealCombat && features.isEstimate) {
    add({
      timestamp: Math.min(252, duration * 0.2),
      title: 'Potential overextension (estimate)',
      whatHappened:
        'Limited combat data — wave state heuristics suggest possible overextension while enemies were missing.',
      whyItHappened: 'Without parsed deaths, this insight is inferred from incomplete demo extraction.',
      whyBadOrGood: 'Predictable deaths are the fastest way to lose lane tempo.',
      alternativePlay: 'Back up until the next wave reaches your tower when information is incomplete.',
      expectedOutcome: 'Higher survival rate in lane.',
      howToImprove: 'Freeze or slow-push when you cannot see both side laners.',
      drills: ['Wave management custom: 15 min freeze practice'],
      proExample: 'High-MMR players treat missing info as danger until proven safe.',
      category: 'positioning',
      severity: 'major',
      isEstimate: true,
    });
  }

  if (features.idleTimePercent > 18 && !hasRealCombat) {
    add({
      timestamp: duration * 0.4,
      title: 'Excessive idle time',
      whatHappened: `Estimated ${features.idleTimePercent}% of mid-game time may have been idle.`,
      whyItHappened: 'Unclear objective priority or waiting for fights instead of farming.',
      whyBadOrGood: 'Idle time compounds into item and level deficits.',
      alternativePlay: 'Between objectives, clear the nearest camp or push the closest safe wave.',
      expectedOutcome: '+150–250 souls per minute recovered.',
      howToImprove: 'If nothing happens for 20 seconds, go farm.',
      drills: ['Macro drill: track dead time on paper for 5 games'],
      category: 'economy',
      severity: 'medium',
      isEstimate: true,
    });
  }

  return mistakes;
}

export function groupMistakesByCategory(
  mistakes: DetectedMistake[]
): Record<MistakeCategory, DetectedMistake[]> {
  const categories: MistakeCategory[] = [
    'positioning', 'awareness', 'mechanics', 'greed', 'objective_play',
    'economy', 'ability_usage', 'itemization', 'team_fighting',
    'decision_making', 'communication', 'vision',
  ];

  const grouped = Object.fromEntries(
    categories.map((c) => [c, [] as DetectedMistake[]])
  ) as Record<MistakeCategory, DetectedMistake[]>;

  for (const m of mistakes) {
    grouped[m.category].push(m);
  }
  return grouped;
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
