import type { MistakeCategory, MistakePattern, MistakeSeverity } from '@clutchcore/shared';
import type { DetectedMistake } from './mistake-detector.js';

const SEVERITY_RANK: Record<string, number> = {
  critical: 5,
  game_losing: 5,
  high: 4,
  major: 4,
  medium: 2,
  low: 1,
  minor: 1,
};

/**
 * Group repeated mistake patterns (same category + similar title polarity)
 * so the UI can show “you did X six times” instead of 40 near-duplicates.
 */
export function groupMistakePatterns(mistakes: DetectedMistake[]): MistakePattern[] {
  const mistakesOnly = mistakes.filter((m) => m.polarity === 'mistake' && !m.isEstimate);
  const buckets = new Map<string, DetectedMistake[]>();

  for (const m of mistakesOnly) {
    const key = `${m.category}::${normalizeTitle(m.title)}`;
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key)!.push(m);
  }

  const patterns: MistakePattern[] = [];
  let i = 0;
  for (const [, group] of buckets) {
    if (group.length < 2) continue;
    group.sort((a, b) => a.timestamp - b.timestamp);
    const category = group[0].category;
    const severity = maxSeverity(group.map((g) => g.severity));
    const timestamps = group.map((g) => g.timestamp);
    const avgWp =
      group.reduce((s, g) => s + (g.winProbabilityDelta ?? g.impactEstimate?.winProbabilityDelta ?? -0.05), 0) /
      group.length;

    patterns.push({
      id: `pattern-${i++}`,
      title: patternTitle(category, group.length, group[0].title),
      category,
      count: group.length,
      timestamps,
      insightIds: group.map((g) => g.id),
      commonCauses: uniqueCauses(group),
      patternExplanation: `Across ${group.length} timestamps (${timestamps
        .slice(0, 6)
        .map(formatClock)
        .join(', ')}${timestamps.length > 6 ? '…' : ''}), the same ${category.replace(/_/g, ' ')} failure mode repeated. The shared root is decision timing under incomplete information — not random bad luck.`,
      practiceDrill: {
        title: `Break the ${category.replace(/_/g, ' ')} loop`,
        description: `VOD: jump to each listed timestamp. For every one, write the missing info and the 5-second alternative. Then run a 15-minute custom where you refuse that pattern.`,
        durationMinutes: 25,
        difficulty: group.length >= 4 ? 'hard' : 'medium',
        successMetric: `Next match: ≤${Math.max(1, Math.floor(group.length / 2))} repeats of this pattern.`,
      },
      priorityScore: Math.min(
        100,
        group.length * 12 + (SEVERITY_RANK[severity] ?? 1) * 10
      ),
      expectedImprovement: `Cutting this pattern in half typically recovers ~${Math.abs(Math.round(avgWp * group.length * 50))}% cumulative fight/tempo swing across a match (estimate).`,
      estimatedWinProbabilityGain: Math.min(0.25, Math.abs(avgWp) * group.length * 0.35),
      severity,
    });
  }

  return patterns.sort((a, b) => b.priorityScore - a.priorityScore);
}

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/\([^)]*\)/g, '')
    .replace(/\d+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function patternTitle(category: MistakeCategory, count: number, sample: string): string {
  const base = sample.replace(/\s+/g, ' ').trim();
  if (/death/i.test(base)) {
    return `You died to the same failure mode ${count} times`;
  }
  if (/teamfight/i.test(base)) {
    return `You repeated losing teamfight entries ${count} times`;
  }
  return `Repeated ${category.replace(/_/g, ' ')}: “${base}” ×${count}`;
}

function uniqueCauses(group: DetectedMistake[]): string[] {
  const causes = group.map((g) => g.whyItHappened).filter(Boolean);
  const uniq: string[] = [];
  for (const c of causes) {
    if (!uniq.some((u) => u.slice(0, 40) === c.slice(0, 40))) uniq.push(c);
    if (uniq.length >= 4) break;
  }
  return uniq;
}

function maxSeverity(list: MistakeSeverity[]): MistakeSeverity {
  return [...list].sort(
    (a, b) => (SEVERITY_RANK[b] ?? 0) - (SEVERITY_RANK[a] ?? 0)
  )[0];
}

function formatClock(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
