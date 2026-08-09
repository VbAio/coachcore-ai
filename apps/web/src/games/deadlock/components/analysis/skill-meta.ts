import type { SkillAxisMeta, SkillScores } from '@clutchcore/shared';

/** Client-side mirror of score-engine.buildSkillAxisMeta for legacy reports. */
export function buildSkillAxisMeta(scores: SkillScores): SkillAxisMeta[] {
  const entries: Array<{
    key: keyof SkillScores;
    label: string;
    importance: SkillAxisMeta['importance'];
  }> = [
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
