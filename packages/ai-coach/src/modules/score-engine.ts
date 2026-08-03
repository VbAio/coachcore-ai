import type { Grade, SkillScores } from '@coachcore/shared';
import type { ExtractedFeatures } from '@coachcore/replay-parser';
import type { DetectedMistake } from './mistake-detector.js';

export function computeSkillScores(
  features: ExtractedFeatures,
  mistakes: DetectedMistake[]
): SkillScores {
  const majorCount = mistakes.filter((m) => m.severity === 'major' || m.severity === 'game_losing').length;
  const penalty = majorCount * 8 + mistakes.length * 2;

  const clamp = (n: number) => Math.max(20, Math.min(95, n));

  const scores: SkillScores = {
    mechanics: clamp(70 - penalty * 0.5),
    macro: clamp(65 - features.idleTimePercent),
    awareness: clamp(60 - features.lanePhaseDeaths * 10),
    positioning: clamp(68 - majorCount * 6),
    consistency: clamp(72 - mistakes.length * 3),
    economy: clamp(70 - Math.max(0, features.idleTimePercent - 8) * 2),
    aggression: clamp(55 + features.killTimestamps.length * 3),
    teamFighting: clamp(60 + features.fightParticipation * 30),
    overall: 0,
  };

  scores.overall = Math.round(
    (scores.mechanics + scores.macro + scores.awareness + scores.positioning +
      scores.consistency + scores.economy + scores.aggression + scores.teamFighting) / 8
  );

  return scores;
}

export function scoreToGrade(score: number): Grade {
  if (score >= 93) return 'A+';
  if (score >= 85) return 'A';
  if (score >= 75) return 'B';
  if (score >= 65) return 'C';
  if (score >= 50) return 'D';
  return 'F';
}
