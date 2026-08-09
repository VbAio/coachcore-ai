import type { AiInsights, ImprovementPlan, SkillScores } from '@clutchcore/shared';
import type { DetectedMistake } from './mistake-detector.js';
import type { MistakePattern } from '@clutchcore/shared';

export function generateImprovementPlan(
  mistakes: DetectedMistake[],
  scores: SkillScores,
  patterns: MistakePattern[] = []
): ImprovementPlan {
  const topCategories = [...mistakes]
    .filter((m) => m.polarity === 'mistake')
    .sort((a, b) => severityWeight(b.severity) - severityWeight(a.severity))
    .slice(0, 3);

  const focus = topCategories[0]?.category ?? 'awareness';
  const topPattern = patterns[0];
  const weak = weakestSkill(scores);

  return {
    todaysFocus: topPattern
      ? `Break “${topPattern.title}” — review all ${topPattern.count} timestamps before queueing`
      : `Eliminate one ${focus.replace('_', ' ')} mistake with a written alternative at the timestamp`,
    weeklyFocus: `Raise ${weak} by 10 points: one focused custom + one VOD review session daily`,
    topHabits: [
      'Before every river step, name two enemy positions out loud',
      'After every kill, path to the nearest objective within 15 seconds',
      'Buy only when the next fight/objective window is known',
    ],
    practiceDrills: [
      ...(topPattern ? [topPattern.practiceDrill.description] : []),
      ...topCategories.flatMap((m) => m.drills).slice(0, 3),
    ].slice(0, 5),
    warmupRoutine: [
      '3 minutes: review yesterday’s highest-severity timestamp',
      '5 minutes: ability combo range practice on your hero',
      '2 minutes: write your first-item spike plan',
    ],
    replayReviewChecklist: [
      'First death — exact missing information?',
      'Best fight — what information made it free?',
      'Every objective event — were you pathing 15s early?',
      'Item buys — did they line up with the next fight?',
    ],
    goalForNextMatch: topPattern
      ? `Repeat the “${normalizeShort(topPattern.title)}” pattern ≤ ${Math.max(1, Math.floor(topPattern.count / 2))} times`
      : `Die no more than ${Math.max(1, topCategories.length)} times to major positioning/awareness errors`,
    estimatedMmrGain: Math.round((100 - scores.overall) * 0.8),
    today: {
      title: topPattern?.title ?? `Fix ${focus.replace('_', ' ')}`,
      reason: topPattern?.patternExplanation ?? topCategories[0]?.whyItHappened ?? 'Highest severity event-backed mistake.',
      expectedImpact: topPattern?.expectedImprovement ?? 'Immediate reduction in avoidable death timers.',
      difficulty: topPattern?.practiceDrill.difficulty ?? 'medium',
      progressHint: 'Done when you can narrate the alternative at every listed timestamp.',
    },
    thisWeek: {
      title: `Improve ${weak}`,
      reason: `${weak} is your lowest skill axis this match.`,
      expectedImpact: '+8–12 on that axis if the pattern count halves.',
      difficulty: 'medium',
      progressHint: 'Track pattern count across your next 5 ranked games.',
    },
    nextTenMatches: {
      title: 'Convert won fights into objectives',
      reason: 'Kill events without objective events waste tempo.',
      expectedImpact: 'Higher walker/mid-boss conversion after skirmish wins.',
      difficulty: 'hard',
      progressHint: 'After each kill streak, note objective damage within 20s.',
    },
    longTerm: {
      title: 'Build a personal decision checklist',
      reason: 'Pros reduce variance with pre-commit rules, not vibes.',
      expectedImpact: 'Lower death variance and more consistent grades.',
      difficulty: 'hard',
      progressHint: 'Maintain a one-page checklist and update it weekly.',
    },
  };
}

export function generateAiInsights(
  mistakes: DetectedMistake[],
  scores: SkillScores,
  patterns: MistakePattern[],
  hero: string
): AiInsights {
  const strengths = Object.entries(scores)
    .filter(([k]) => k !== 'overall')
    .sort((a, b) => (b[1] as number) - (a[1] as number))
    .slice(0, 3)
    .map(([k, v]) => `${labelSkill(k)} (${v})`);

  const costly = [...mistakes]
    .filter((m) => m.polarity === 'mistake')
    .sort(
      (a, b) =>
        Math.abs(b.winProbabilityDelta ?? b.impactEstimate?.winProbabilityDelta ?? 0) -
        Math.abs(a.winProbabilityDelta ?? a.impactEstimate?.winProbabilityDelta ?? 0)
    )
    .slice(0, 3)
    .map(
      (m) =>
        `${formatClock(m.timestamp)} — ${m.title} (est. WP ${formatWp(m.winProbabilityDelta ?? m.impactEstimate?.winProbabilityDelta)})`
    );

  const excellents = mistakes.filter((m) => m.polarity === 'excellent');
  const lostOpp = mistakes
    .filter((m) => m.polarity === 'mistake' && m.category === 'objective_play')
    .sort((a, b) => a.timestamp - b.timestamp)[0];

  const confAvg =
    mistakes.length > 0
      ? Math.round(
          mistakes.reduce((s, m) => s + (m.confidence ?? 50), 0) / mistakes.length
        )
      : 40;

  return {
    biggestStrengths: strengths.length
      ? strengths
      : [`Solid baseline on ${hero}`],
    mostCostlyMistakes: costly.length ? costly : ['No high-impact event-backed mistakes detected'],
    hiddenPatterns: patterns.slice(0, 3).map((p) => p.title),
    recurringHabits: patterns.slice(0, 3).flatMap((p) => p.commonCauses.slice(0, 1)),
    mostImprovedArea:
      excellents.length > mistakes.filter((m) => m.polarity === 'mistake').length
        ? 'Fight conversion / kills'
        : labelSkill(weakestSkill(scores)),
    highestImpactImprovement: patterns[0]?.title ?? costly[0] ?? 'Reduce avoidable deaths',
    biggestLostOpportunity: lostOpp
      ? `${formatClock(lostOpp.timestamp)} — ${lostOpp.title}: ${lostOpp.alternativePlay}`
      : excellents[0]
        ? `Convert ${formatClock(excellents[0].timestamp)} kill into an objective within 15s`
        : 'No clear objective miss parsed — focus on post-kill pathing',
    riskAssessment:
      scores.discipline != null && scores.discipline < 55
        ? 'High tilt/greed risk: discipline axis is low — expect stacked deaths if you chase.'
        : scores.awareness < 55
          ? 'Information risk: awareness is low — river steps without vision will punish you.'
          : 'Moderate risk profile — execute the top pattern drill to stabilize.',
    confidenceSummary: `Insight confidence averages ${confAvg}/100. Event-backed claims are preferred; estimated sections are labeled in the report.`,
  };
}

function severityWeight(s: string): number {
  return (
    {
      critical: 5,
      game_losing: 5,
      high: 4,
      major: 4,
      medium: 2,
      low: 1,
      minor: 1,
    }[s] ?? 0
  );
}

function weakestSkill(scores: SkillScores): string {
  const entries = Object.entries(scores).filter(([k]) => k !== 'overall') as [
    string,
    number,
  ][];
  entries.sort((a, b) => a[1] - b[1]);
  return entries[0]?.[0] ?? 'awareness';
}

function labelSkill(k: string): string {
  return k.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase());
}

function formatClock(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatWp(v?: number): string {
  if (v == null) return 'n/a';
  const pct = Math.round(v * 100);
  return `${pct >= 0 ? '+' : ''}${pct}%`;
}

function normalizeShort(s: string): string {
  return s.length > 48 ? `${s.slice(0, 48)}…` : s;
}
