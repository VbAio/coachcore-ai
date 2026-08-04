import type { ImprovementPlan } from '@coachcore/shared';
import type { DetectedMistake } from './mistake-detector.js';
import type { SkillScores } from '@coachcore/shared';

export function generateImprovementPlan(
  mistakes: DetectedMistake[],
  scores: SkillScores
): ImprovementPlan {
  const topCategories = [...mistakes]
    .sort((a, b) => severityWeight(b.severity) - severityWeight(a.severity))
    .slice(0, 3);

  const focus = topCategories[0]?.category ?? 'awareness';

  return {
    todaysFocus: `Eliminate one ${focus.replace('_', ' ')} mistake per game`,
    weeklyFocus: `Raise ${weakestSkill(scores)} score by 10 points through targeted VOD review`,
    topHabits: [
      'Glance minimap every 3 seconds',
      'Track enemy cooldowns before trading',
      'Farm between objectives — never stand idle',
    ],
    practiceDrills: topCategories.flatMap((m) => m.drills).slice(0, 4),
    warmupRoutine: [
      '5 min last-hit trainer',
      '3 min ability combo practice',
      'Review yesterday\'s top mistake timestamp',
    ],
    replayReviewChecklist: [
      'First death — what info was missing?',
      'Best team fight — what did you do right?',
      'Largest gold gap — where did farm leak?',
      'Item timing vs power spike windows',
    ],
    goalForNextMatch: `Die no more than ${Math.max(
      1,
      mistakes.filter((m) =>
        ['major', 'critical', 'high', 'game_losing'].includes(m.severity)
      ).length
    )} times to major positioning errors`,
    estimatedMmrGain: Math.round((100 - scores.overall) * 0.8),
  };
}

function severityWeight(s: string): number {
  return {
    critical: 5,
    game_losing: 5,
    high: 4,
    major: 4,
    medium: 2,
    low: 1,
    minor: 1,
  }[s] ?? 0;
}

function weakestSkill(scores: SkillScores): string {
  const entries = Object.entries(scores).filter(([k]) => k !== 'overall') as [string, number][];
  entries.sort((a, b) => a[1] - b[1]);
  return entries[0][0];
}
