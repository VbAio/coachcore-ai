import type { Grade, SkillAxisMeta, SkillScores } from '@coachcore/shared';
import type { ExtractedFeatures } from '@coachcore/replay-parser';
import type { DetectedMistake } from './mistake-detector.js';

export function computeSkillScores(
  features: ExtractedFeatures,
  mistakes: DetectedMistake[]
): SkillScores {
  const majorCount = mistakes.filter((m) =>
    ['major', 'game_losing', 'critical', 'high'].includes(m.severity)
  ).length;
  const mistakeOnly = mistakes.filter((m) => m.polarity === 'mistake');
  const byCat = (c: string) => mistakeOnly.filter((m) => m.category === c).length;
  const penalty = majorCount * 8 + mistakeOnly.length * 2;
  const clamp = (n: number) => Math.max(18, Math.min(96, Math.round(n)));

  const positioning = clamp(70 - byCat('positioning') * 8 - majorCount * 4);
  const awareness = clamp(68 - features.lanePhaseDeaths * 10 - byCat('awareness') * 7);
  const mechanics = clamp(72 - byCat('mechanics') * 9 - penalty * 0.3);
  const decisionMaking = clamp(66 - byCat('decision_making') * 8 - majorCount * 3);
  const macro = clamp(64 - features.idleTimePercent * 0.8 - byCat('objective_play') * 6);
  const micro = clamp(70 - byCat('mechanics') * 5 - byCat('ability_usage') * 4);
  const economy = clamp(
    features.gpm > 0 ? 55 + Math.min(30, features.gpm / 25) - byCat('economy') * 6 : 50 - byCat('economy') * 6
  );
  const abilityUsage = clamp(68 - byCat('ability_usage') * 8);
  const itemization = clamp(70 - byCat('itemization') * 5);
  const objectives = clamp(60 + features.objectiveParticipation * 35 - byCat('objective_play') * 7);
  const mapControl = clamp(62 - features.idleTimePercent * 0.6 + features.objectiveParticipation * 20);
  const rotations = clamp(65 - byCat('vision') * 5 - byCat('decision_making') * 3);
  const teamFighting = clamp(58 + features.fightParticipation * 35 - byCat('team_fighting') * 7);
  const consistency = clamp(74 - mistakeOnly.length * 2.5);
  const aggression = clamp(50 + features.killTimestamps.length * 3 - byCat('greed') * 4);
  const discipline = clamp(72 - byCat('greed') * 8 - majorCount * 5);

  const scores: SkillScores = {
    mechanics,
    macro,
    awareness,
    positioning,
    consistency,
    economy,
    aggression,
    teamFighting,
    decisionMaking,
    micro,
    abilityUsage,
    itemization,
    objectives,
    mapControl,
    rotations,
    discipline,
    overall: 0,
  };

  const axes = [
    mechanics,
    macro,
    awareness,
    positioning,
    consistency,
    economy,
    aggression,
    teamFighting,
    decisionMaking,
    micro,
    abilityUsage,
    itemization,
    objectives,
    mapControl,
    rotations,
    discipline,
  ];
  scores.overall = Math.round(axes.reduce((a, b) => a + b, 0) / axes.length);
  return scores;
}

export function buildSkillAxisMeta(scores: SkillScores): SkillAxisMeta[] {
  const entries: Array<{ key: keyof SkillScores; label: string; importance: SkillAxisMeta['importance'] }> = [
    { key: 'mechanics', label: 'Mechanics', importance: 'high' },
    { key: 'positioning', label: 'Positioning', importance: 'critical' },
    { key: 'awareness', label: 'Awareness', importance: 'critical' },
    { key: 'decisionMaking', label: 'Decision Making', importance: 'critical' },
    { key: 'macro', label: 'Macro', importance: 'high' },
    { key: 'micro', label: 'Micro', importance: 'medium' },
    { key: 'economy', label: 'Economy', importance: 'high' },
    { key: 'abilityUsage', label: 'Ability Usage', importance: 'medium' },
    { key: 'itemization', label: 'Itemization', importance: 'medium' },
    { key: 'objectives', label: 'Objectives', importance: 'high' },
    { key: 'mapControl', label: 'Map Control', importance: 'medium' },
    { key: 'rotations', label: 'Rotations', importance: 'high' },
    { key: 'teamFighting', label: 'Team Fighting', importance: 'critical' },
    { key: 'consistency', label: 'Consistency', importance: 'medium' },
    { key: 'aggression', label: 'Aggression', importance: 'low' },
    { key: 'discipline', label: 'Discipline', importance: 'high' },
  ];

  const values = entries.map((e) => Number(scores[e.key] ?? 50));
  const avg = values.reduce((a, b) => a + b, 0) / Math.max(1, values.length);
  const sorted = [...values].sort((a, b) => a - b);
  const weakCut = sorted[Math.min(2, sorted.length - 1)] ?? avg;
  const strongCut = sorted[Math.max(0, sorted.length - 3)] ?? avg;

  return entries.map((e) => {
    const score = Number(scores[e.key] ?? 50);
    return {
      key: e.key,
      label: e.label,
      score,
      trend: score >= avg + 5 ? 'up' : score <= avg - 5 ? 'down' : 'flat',
      isStrength: score >= strongCut && score >= 70,
      isWeakness: score <= weakCut,
      importance: e.importance,
    };
  });
}

export function scoreToGrade(score: number): Grade {
  if (score >= 93) return 'A+';
  if (score >= 85) return 'A';
  if (score >= 75) return 'B';
  if (score >= 65) return 'C';
  if (score >= 50) return 'D';
  return 'F';
}
