import type { RlCoachInsight, RlMistakePattern } from '@coachcore/shared';

export function groupRlPatterns(insights: RlCoachInsight[]): RlMistakePattern[] {
  const mistakes = insights.filter((i) => i.polarity === 'mistake');
  const buckets = new Map<string, RlCoachInsight[]>();

  for (const m of mistakes) {
    const key = `${m.category}:${m.eventType}`;
    const list = buckets.get(key) ?? [];
    list.push(m);
    buckets.set(key, list);
  }

  const patterns: RlMistakePattern[] = [];
  for (const [, list] of buckets) {
    const sample = list[0];
    // Prefer repeats; still surface single high-severity leaks so the panel isn't empty
    if (list.length < 2 && sample.severityScore < 70) continue;
    patterns.push({
      id: `pat-${sample.category}-${sample.eventType}`,
      title: list.length > 1 ? `${sample.title} (${list.length}x)` : sample.title,
      category: sample.category,
      count: list.length,
      timestamps: list.map((i) => i.timestamp),
      insightIds: list.map((i) => i.id),
      commonCauses: [sample.whyItHappened],
      patternExplanation:
        list.length > 1
          ? `This ${sample.category.replace(/_/g, ' ')} habit showed up ${list.length} times. Same failure mode: ${sample.whyBadOrGood}`
          : `High-impact ${sample.category.replace(/_/g, ' ')} leak: ${sample.whyBadOrGood}`,
      practiceDrill:
        sample.practiceDrill ?? {
          title: 'Pattern breaker',
          description: sample.howToImprove,
          durationMinutes: 15,
          difficulty: 'medium',
          successMetric: 'Zero repeats next 3 matches',
        },
      priorityScore: Math.min(100, sample.severityScore + list.length * 4),
      expectedImprovement: `Cutting this pattern should raise win chance ~${Math.round(Math.abs(sample.winProbabilityDelta ?? 0.05) * Math.max(1, list.length) * 40)}% across similar matches.`,
      estimatedRankGain: list.length >= 3 ? 'Div+/rank toward next tier' : 'Stabilizes current rank',
      severity: sample.severity,
    });
  }

  return patterns.sort((a, b) => b.priorityScore - a.priorityScore).slice(0, 8);
}
