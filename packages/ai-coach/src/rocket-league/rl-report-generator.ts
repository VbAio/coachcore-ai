import type {
  RlAiInsights,
  RlCoachInsight,
  RlCoachingReport,
  RlImprovementPlan,
  RlMatchSummaryStats,
  RlParsedReplay,
  RlPlanStep,
} from '@coachcore/shared';
import { detectRlMistakes } from './rl-mistake-detector.js';
import { groupRlPatterns } from './rl-pattern-grouper.js';
import { computeRlSkillScores } from './rl-score-engine.js';
import {
  analyzeRlBoost,
  analyzeRlDefense,
  analyzeRlRotation,
  analyzeRlShots,
  generateRlHeatmaps,
} from './rl-analyzers.js';

function step(
  title: string,
  reason: string,
  impact: string,
  difficulty: RlPlanStep['difficulty'],
  priority: RlPlanStep['priority'],
  drills: string[],
  mmr = 15,
  minutes = 45
): RlPlanStep {
  return {
    title,
    reason,
    expectedImpact: impact,
    difficulty,
    priority,
    estimatedMmrGain: mmr,
    estimatedMinutes: minutes,
    drills,
    progressHint: 'Log whether the mistake repeated after each match.',
  };
}

export function generateRlReport(replayId: string, replay: RlParsedReplay): RlCoachingReport {
  const insights = detectRlMistakes(replay);
  const patterns = groupRlPatterns(insights);
  const { scores, axes, overallGrade } = computeRlSkillScores(replay, insights);
  const subject = replay.metadata.players.find((p) => p.isSubject);
  const mistakes = insights.filter((i) => i.polarity === 'mistake');
  const topMistake = [...mistakes].sort((a, b) => b.severityScore - a.severityScore)[0];
  const topExcellent = insights.find((i) => i.polarity === 'excellent');

  const weakness = topMistake?.title ?? 'Inconsistent challenge timing';
  const strength = topExcellent?.title ?? 'Flash moments of patient defense';

  const matchSummary: RlMatchSummaryStats = {
    overallScore: scores.overall,
    letterGrade: overallGrade,
    estimatedRank: estimateRank(scores.overall, replay.metadata.rank),
    currentRank: replay.metadata.rank ?? 'Unranked',
    playlist: replay.metadata.playlist,
    durationSeconds: replay.metadata.durationSeconds,
    goals: subject?.goals ?? 0,
    assists: subject?.assists ?? 0,
    saves: subject?.saves ?? 0,
    shots: subject?.shots ?? 0,
    demos: subject?.demos ?? 0,
    boostEfficiency: Math.max(0, 100 - analyzeRlBoost(replay, insights).boostWasted),
    averageSpeed: subject?.averageSpeed ?? 1200,
    possessionTime: Math.round(replay.metadata.durationSeconds * 0.28),
    ballTouches: subject?.ballTouches ?? 0,
    aerialSuccessRate: scores.aerial,
    fiftyFiftyWinRate: clamp(55 - mistakes.filter((m) => m.eventType === 'whiff').length * 8),
    recoveryScore: scores.recovery,
    rotationScore: scores.rotation,
    decisionMakingScore: scores.decisionMaking,
    mechanicalScore: scores.mechanical,
    consistencyScore: scores.consistency,
    confidence: replay.extractionConfidence === 'full' ? 82 : replay.extractionConfidence === 'partial' ? 64 : 42,
    biggestStrength: strength,
    biggestWeakness: weakness,
    topPriorities: [
      patterns[0]?.title ?? weakness,
      patterns[1]?.title ?? 'Boost path discipline',
      patterns[2]?.title ?? 'Second-man patience',
    ],
  };

  const aiInsights: RlAiInsights = {
    biggestStrengths: [strength, ...insights.filter((i) => i.polarity === 'excellent').slice(0, 2).map((i) => i.title)],
    mostCostlyMistakes: mistakes
      .sort((a, b) => b.severityScore - a.severityScore)
      .slice(0, 3)
      .map((i) => i.title),
    hiddenPatterns: patterns.map((p) => p.title).slice(0, 3),
    recurringHabits: patterns.map((p) => p.patternExplanation).slice(0, 3),
    highestImpactImprovement: patterns[0]?.expectedImprovement ?? 'Stabilize back-post coverage',
    biggestLostOpportunity: mistakes.find((m) => m.eventType === 'missed_open_net')?.title ?? weakness,
    riskAssessment:
      replay.extractionConfidence === 'minimal'
        ? 'Low extraction confidence — treat ranks/boost math as directional.'
        : 'Focus the top pattern before adding mechanical grind.',
    confidenceSummary: `Extraction ${replay.extractionConfidence}; coaching confidence averaged ${Math.round(
      insights.reduce((s, i) => s + i.confidence, 0) / Math.max(1, insights.length)
    )}%.`,
  };

  const improvementPlan: RlImprovementPlan = {
    today: step(
      patterns[0]?.practiceDrill.title ?? 'Shadow before you swing',
      weakness,
      'Immediate reduction in free goals from overcommits',
      'medium',
      'critical',
      [patterns[0]?.practiceDrill.description ?? 'Shadow defense free play 20 min'],
      20,
      30
    ),
    nextFiveMatches: step(
      'Zero double commits',
      'Repeated midfield double commits are the highest leverage leak',
      'Fewer odd-man rushes against',
      'medium',
      'high',
      ['Call “I am second” every mid challenge', 'Watch one concede clip post-match'],
      35,
      150
    ),
    nextTwentyMatches: step(
      'Boost path automation',
      'Starvation after dark corner pads',
      'More aerial contests and safer rotates',
      'hard',
      'high',
      ['Small-pad back-wall loops', 'Pad path custom training'],
      80,
      400
    ),
    longTerm: step(
      'SSL defensive defaults',
      'Build automatic shadow → fake → challenge chains',
      'Rank floor rises; fewer tilt losses',
      'hard',
      'medium',
      ['Weekly replay review of 3 challenges', '1s shadow sessions'],
      150,
      1200
    ),
  };

  const estimatedSections: string[] = [];
  if (replay.source === 'fixture') estimatedSections.push('positions', 'boost', 'heatmaps', 'winProbability');
  if (replay.extractionConfidence !== 'full') estimatedSections.push('possession', 'xg');

  return {
    id: `rl-report-${replayId}`,
    replayId,
    game: 'rocket-league',
    generatedAt: new Date().toISOString(),
    overallGrade,
    overallScore: scores.overall,
    matchSummary,
    skillScores: scores,
    skillAxisMeta: axes,
    timeline: insights,
    mistakePatterns: patterns,
    aiInsights,
    improvementPlan,
    heatmaps: generateRlHeatmaps(replay),
    boostAnalysis: analyzeRlBoost(replay, insights),
    rotationAnalysis: analyzeRlRotation(replay, insights),
    shotAnalysis: analyzeRlShots(replay),
    defenseAnalysis: analyzeRlDefense(replay, insights),
    estimatedSections,
    extractionConfidence: replay.extractionConfidence,
    parserNotes: replay.parserNotes,
    futureHooks: {
      voiceCoachingReady: false,
      clipExportReady: false,
      sslComparisonReady: false,
      trainingPacksReady: false,
    },
  };
}

function estimateRank(score: number, current?: string): string {
  if (score >= 90) return 'Grand Champion';
  if (score >= 82) return 'Champion III';
  if (score >= 75) return current ?? 'Champion I';
  if (score >= 68) return 'Diamond III';
  if (score >= 60) return 'Diamond I';
  return 'Platinum II';
}

function clamp(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

export function polishRlInsightsWithRules(insights: RlCoachInsight[]): RlCoachInsight[] {
  // Placeholder for OpenAI rewrite — keep evidence fields intact
  return insights;
}
