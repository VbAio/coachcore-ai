import type {
  AiInsights,
  CoachingReport,
  MatchSummaryStats,
  MistakePattern,
  SkillAxisMeta,
  SkillScores,
} from '@clutchcore/shared';
import { buildSkillAxisMeta } from './skill-meta';

/** Normalize legacy reports into v2 fields the premium UI expects. */
export function adaptReport(report: CoachingReport): CoachingReport {
  const skillScores = fillSkillScores(report.skillScores);
  const skillAxisMeta = report.skillAxisMeta?.length
    ? report.skillAxisMeta
    : buildSkillAxisMeta(skillScores);

  const matchSummary = report.matchSummary ?? buildSummaryFromLegacy(report, skillScores);
  const mistakePatterns = report.mistakePatterns ?? [];
  const aiInsights = report.aiInsights ?? buildAiInsightsFromLegacy(report, mistakePatterns);

  const timeline = report.timeline.map((insight) => ({
    ...insight,
    severityScore:
      insight.severityScore ??
      ({
        critical: 95,
        game_losing: 98,
        high: 80,
        major: 78,
        medium: 55,
        low: 30,
        minor: 20,
      }[insight.severity] ?? 50),
    winProbabilityDelta:
      insight.winProbabilityDelta ?? insight.impactEstimate?.winProbabilityDelta,
    replayContext:
      insight.replayContext ??
      `${insight.polarity ?? 'neutral'} · ${insight.category.replace(/_/g, ' ')}`,
  }));

  return {
    ...report,
    skillScores,
    skillAxisMeta,
    matchSummary,
    mistakePatterns,
    aiInsights,
    timeline,
    improvementPlan: {
      ...report.improvementPlan,
      today: report.improvementPlan.today ?? {
        title: report.improvementPlan.todaysFocus,
        reason: report.biggestWeakness,
        expectedImpact: 'Immediate reduction in the top failure mode.',
        difficulty: 'medium',
        progressHint: 'Complete today’s focus before queueing.',
      },
      thisWeek: report.improvementPlan.thisWeek ?? {
        title: report.improvementPlan.weeklyFocus,
        reason: 'Weekly skill raise target from this match.',
        expectedImpact: `~${report.improvementPlan.estimatedMmrGain} MMR potential (est.)`,
        difficulty: 'medium',
        progressHint: 'Track across the next 5 games.',
      },
      nextTenMatches: report.improvementPlan.nextTenMatches ?? {
        title: report.improvementPlan.goalForNextMatch,
        reason: 'Stabilize the highest-severity pattern.',
        expectedImpact: 'Fewer stacked death timers.',
        difficulty: 'hard',
        progressHint: 'Log pattern count after each match.',
      },
      longTerm: report.improvementPlan.longTerm ?? {
        title: 'Personal decision checklist',
        reason: 'Consistency compounds.',
        expectedImpact: 'Lower grade variance.',
        difficulty: 'hard',
        progressHint: 'Update checklist weekly.',
      },
    },
  };
}

function fillSkillScores(scores: SkillScores): SkillScores {
  return {
    ...scores,
    decisionMaking: scores.decisionMaking ?? avg(scores.awareness, scores.positioning),
    micro: scores.micro ?? scores.mechanics,
    abilityUsage: scores.abilityUsage ?? scores.mechanics,
    itemization: scores.itemization ?? scores.economy,
    objectives: scores.objectives ?? scores.macro,
    mapControl: scores.mapControl ?? scores.macro,
    rotations: scores.rotations ?? avg(scores.macro, scores.awareness),
    discipline: scores.discipline ?? scores.consistency,
  };
}

function avg(a: number, b: number) {
  return Math.round((a + b) / 2);
}

function buildSummaryFromLegacy(
  report: CoachingReport,
  scores: SkillScores
): MatchSummaryStats {
  return {
    hero: 'Unknown',
    durationSeconds: Math.max(
      ...report.timeline.map((t) => t.timestamp),
      600
    ),
    kills: 0,
    deaths: 0,
    assists: 0,
    damage: 0,
    healing: 0,
    objectiveScore: Math.round(scores.macro ?? 50),
    teamFightScore: Math.round(scores.teamFighting ?? 50),
    confidence: report.extractionConfidence === 'full' ? 75 : report.extractionConfidence === 'partial' ? 55 : 35,
    letterGrade: report.overallGrade,
    overallScore: report.overallScore,
    currentSkillRating: report.currentPerformance,
    estimatedRank: report.potentialRank,
    biggestStrength: report.biggestStrength,
    biggestWeakness: report.biggestWeakness,
    topPriorities: report.topPriorities,
  };
}

function buildAiInsightsFromLegacy(
  report: CoachingReport,
  patterns: MistakePattern[]
): AiInsights {
  return {
    biggestStrengths: [report.biggestStrength],
    mostCostlyMistakes: report.timeline
      .filter((t) => t.polarity === 'mistake')
      .slice(0, 3)
      .map((t) => t.title),
    hiddenPatterns: patterns.map((p) => p.title).slice(0, 3),
    recurringHabits: report.improvementPlan.topHabits.slice(0, 3),
    mostImprovedArea: report.biggestStrength,
    highestImpactImprovement: report.topPriorities[0],
    biggestLostOpportunity: report.biggestWeakness,
    riskAssessment:
      report.extractionConfidence === 'minimal'
        ? 'Low data confidence — treat coaching as directional until you re-upload.'
        : 'Focus the top priority; secondary issues can wait.',
    confidenceSummary: `Extraction: ${report.extractionConfidence ?? 'unknown'}. Estimated sections: ${
      report.estimatedSections.join(', ') || 'none'
    }.`,
  };
}
