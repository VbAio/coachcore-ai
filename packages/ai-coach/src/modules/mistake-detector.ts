import type { CoachInsight, MistakeCategory, MistakeSeverity } from '@coachcore/shared';
import type { ExtractedFeatures } from '@coachcore/replay-parser';
import type { ParsedReplay } from '@coachcore/shared';

export interface DetectedMistake extends CoachInsight {
  id: string;
}

/**
 * Rule-based mistake detector scaffold.
 * Swap with ML model output when available.
 */
export function detectMistakes(
  replay: ParsedReplay,
  features: ExtractedFeatures
): DetectedMistake[] {
  const mistakes: DetectedMistake[] = [];
  const duration = replay.metadata.durationSeconds;
  let id = 0;

  const add = (
    partial: Omit<DetectedMistake, 'id'> & { timestamp: number }
  ) => {
    mistakes.push({ ...partial, id: `mistake-${id++}` });
  };

  if (features.lanePhaseDeaths > 0) {
    add({
      timestamp: Math.min(300, duration * 0.15),
      title: 'Early lane death',
      whatHappened: 'You died during the lane phase before establishing map control.',
      whyItHappened:
        'Overextension or poor wave state management likely exposed you to a gank.',
      whyBadOrGood:
        'Early deaths hand tempo and experience to opponents, delaying your first power spike.',
      alternativePlay:
        'Track missing enemies, freeze the wave near your tower, and only trade when your jungler is nearby.',
      expectedOutcome: '80% chance of reaching first item timing without dying.',
      howToImprove:
        'Review minimap every 3 seconds during lane. Ask: where are both enemy side laners?',
      drills: [
        '10-minute custom: last hit without taking damage',
        'VOD review: pause every 10s and name all visible enemies',
      ],
      proExample:
        'Top players concede CS rather than face-check when both roamers are missing.',
      category: 'awareness' as MistakeCategory,
      severity: 'major' as MistakeSeverity,
      isEstimate: features.isEstimate,
    });
  }

  if (features.idleTimePercent > 12) {
    add({
      timestamp: duration * 0.4,
      title: 'Excessive idle time',
      whatHappened: `Estimated ${features.idleTimePercent}% of mid-game time was spent idle without farming or pressuring.`,
      whyItHappened:
        'Unclear objective priority or waiting for fights instead of collecting nearby farm.',
      whyBadOrGood:
        'Idle time compounds into item and level deficits that are hard to recover from.',
      alternativePlay:
        'Between objectives, clear nearest camp or push closest safe wave, then regroup.',
      expectedOutcome: '+150-250 gold per minute recovered.',
      howToImprove:
        'Set a mental timer: if nothing happens in 20 seconds, go farm.',
      drills: ['Macro drill: 5 games tracking dead time on paper'],
      category: 'economy',
      severity: 'medium',
      isEstimate: true,
    });
  }

  if (features.deathTimestamps.length === 0 && features.isEstimate) {
    add({
      timestamp: 252,
      title: 'Potential overextension (estimate)',
      whatHappened:
        'At 4:12, wave state suggests you may have overextended while enemy roamers were missing.',
      whyItHappened:
        'Because your wave was already pushing, this exposed you to a predictable gank.',
      whyBadOrGood:
        'Predictable deaths are the fastest way to lose lane tempo and team trust.',
      alternativePlay: 'Back up until the next wave reaches your tower.',
      expectedOutcome: '90% chance of surviving.',
      howToImprove: 'Freeze or slow-push when you cannot see both side laners.',
      drills: ['Wave management custom: 15 min freeze practice'],
      proExample: 'High-MMR players treat missing info as danger until proven safe.',
      category: 'positioning',
      severity: 'major',
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
