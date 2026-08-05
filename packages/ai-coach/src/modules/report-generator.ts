import type {
  CoachingReport,
  MatchSummaryStats,
  ProComparison,
  TeamFightBreakdown,
} from '@coachcore/shared';
import type { ParsedReplay } from '@coachcore/shared';
import type { ExtractedFeatures } from '@coachcore/replay-parser';
import type { DetectedMistake } from './mistake-detector.js';
import { groupMistakesByCategory } from './mistake-detector.js';
import { groupMistakePatterns } from './pattern-grouper.js';
import { generateTimeline } from './timeline-generator.js';
import { generateHeatmaps } from './heatmap-generator.js';
import { buildSkillAxisMeta, computeSkillScores, scoreToGrade } from './score-engine.js';
import { generateAiInsights, generateImprovementPlan } from './recommendation-engine.js';
import { analyzeBuild } from './item-analyzer.js';

export function generateReport(
  replayId: string,
  replay: ParsedReplay,
  features: ExtractedFeatures,
  mistakes: DetectedMistake[]
): CoachingReport {
  const scores = computeSkillScores(features, mistakes);
  const grade = scoreToGrade(scores.overall);
  const grouped = groupMistakesByCategory(mistakes);
  const patterns = groupMistakePatterns(mistakes);
  const skillAxisMeta = buildSkillAxisMeta(scores);
  const estimatedSections: string[] = [];

  if (features.isEstimate) {
    estimatedSections.push(
      'lanePhaseAnalysis',
      'macroAnalysis',
      'heatmaps',
      'proComparison',
      'timeline'
    );
  }
  if (replay.economy.length === 0) {
    estimatedSections.push('economyAnalysis');
  }
  if (replay.positions.length < 8) {
    estimatedSections.push('heatmaps');
  }

  const laneMistakes = mistakes.filter(
    (m) =>
      ['awareness', 'positioning', 'economy'].includes(m.category) &&
      m.timestamp < replay.metadata.durationSeconds * 0.25
  );
  const macroMistakes = mistakes.filter((m) =>
    ['objective_play', 'economy', 'decision_making', 'vision'].includes(m.category)
  );
  const microMistakes = mistakes.filter((m) =>
    ['mechanics', 'ability_usage', 'team_fighting'].includes(m.category)
  );

  const weaknesses = Object.entries(grouped)
    .filter(([, v]) => v.length > 0)
    .sort((a, b) => b[1].length - a[1].length);
  const strengths = skillAxisMeta
    .filter((s) => s.isStrength)
    .map((s) => s.label);

  const buildReview = analyzeBuild(replay);
  if (buildReview.purchases.every((p) => p.isEstimate) || buildReview.purchases.length === 0) {
    estimatedSections.push('buildReview');
  }

  const timelineMoments = generateTimeline(
    mistakes.filter((m) => m.category !== 'ability_usage')
  );

  const subject = replay.metadata.players.find((p) => p.isSubject);
  const hero = subject?.hero ?? 'unknown_hero';
  const aiInsights = generateAiInsights(mistakes, scores, patterns, hero);
  const improvementPlan = generateImprovementPlan(mistakes, scores, patterns);

  const biggestWeakness =
    patterns[0]?.category.replace(/_/g, ' ') ??
    weaknesses[0]?.[0]?.replace(/_/g, ' ') ??
    'None detected';
  const biggestStrength = strengths[0] ?? skillAxisMeta.sort((a, b) => b.score - a.score)[0]?.label ?? 'Consistency';

  const topPriorities: [string, string, string] = [
    patterns[0]?.title ?? biggestWeakness,
    patterns[1]?.title ?? weaknesses[1]?.[0]?.replace(/_/g, ' ') ?? 'Economy timing',
    patterns[2]?.title ?? weaknesses[2]?.[0]?.replace(/_/g, ' ') ?? 'Objective conversion',
  ];

  const confidences = mistakes.map((m) => m.confidence ?? 50);
  const avgConf =
    confidences.length > 0
      ? Math.round(confidences.reduce((a, b) => a + b, 0) / confidences.length)
      : replay.extractionConfidence === 'full'
        ? 75
        : replay.extractionConfidence === 'partial'
          ? 55
          : 30;

  const fightWins = replay.teamFights.filter((f) => f.outcome === 'won').length;
  const fightTotal = Math.max(1, replay.teamFights.length);
  const objEvents = replay.events.filter((e) => e.type === 'objective').length;

  const matchSummary: MatchSummaryStats = {
    hero: hero === 'unknown_hero' ? 'Unknown hero' : hero,
    durationSeconds: replay.metadata.durationSeconds,
    kills: subject?.kills ?? 0,
    deaths: subject?.deaths ?? 0,
    assists: subject?.assists ?? 0,
    damage: 0,
    healing: 0,
    objectiveScore: Math.min(100, Math.round(objEvents * 18 + features.objectiveParticipation * 40)),
    teamFightScore: Math.min(100, Math.round((fightWins / fightTotal) * 70 + features.fightParticipation * 30)),
    confidence: avgConf,
    letterGrade: grade,
    overallScore: scores.overall,
    currentSkillRating: estimateRank(scores.overall),
    estimatedRank: estimateRank(scores.overall + 10),
    biggestStrength,
    biggestWeakness,
    topPriorities,
  };

  return {
    id: `report-${replayId}`,
    replayId,
    generatedAt: new Date().toISOString(),
    overallGrade: grade,
    overallScore: scores.overall,
    potentialRank: matchSummary.estimatedRank,
    currentPerformance: matchSummary.currentSkillRating,
    biggestWeakness,
    biggestStrength,
    topPriorities,
    lanePhaseAnalysis: laneMistakes.filter((m) => m.category !== 'ability_usage'),
    macroAnalysis: macroMistakes,
    microAnalysis: microMistakes.filter((m) => m.category !== 'ability_usage'),
    teamFightAnalysis: buildTeamFightBreakdowns(replay, mistakes),
    heatmaps: generateHeatmaps(replay, features),
    economyAnalysis:
      replay.economy.length === 0 ? [] : mistakes.filter((m) => m.category === 'economy'),
    heroSpecificCoaching: buildHeroCoaching(replay, mistakes),
    timeline: timelineMoments,
    mistakesByCategory: grouped,
    improvementPlan,
    proComparison: buildProComparison(features),
    skillScores: scores,
    buildReview,
    estimatedSections,
    extractionConfidence: replay.extractionConfidence,
    parserNotes: replay.parserNotes,
    mistakePatterns: patterns,
    aiInsights,
    matchSummary,
    skillAxisMeta,
  };
}

function estimateRank(score: number): string {
  if (score >= 92) return 'Eternus';
  if (score >= 86) return 'Ascendant';
  if (score >= 78) return 'Phantom';
  if (score >= 70) return 'Oracle';
  if (score >= 62) return 'Archon';
  if (score >= 54) return 'Emissary';
  if (score >= 46) return 'Ritualist';
  return 'Alchemist';
}

function buildTeamFightBreakdowns(
  replay: ParsedReplay,
  mistakes: DetectedMistake[]
): TeamFightBreakdown[] {
  return replay.teamFights.map((fight) => {
    const inFight = mistakes.filter(
      (m) => m.timestamp >= fight.startTime && m.timestamp <= fight.endTime
    );
    return {
      fightId: fight.id,
      startTime: fight.startTime,
      endTime: fight.endTime,
      timeline: [
        `${formatClock(fight.startTime)}: Fight cluster opens (${fight.kills} kills in window)`,
        `${formatClock(fight.endTime)}: Cluster resolves — outcome ${fight.outcome}`,
      ],
      whoEngaged: fight.participants[0] ?? 'Unknown',
      mistakes: inFight.filter((m) => m.polarity === 'mistake'),
      goodPlays: inFight.filter((m) => m.polarity === 'excellent'),
      positioningNotes: inFight.find((m) => m.category === 'positioning')?.whatHappened
        ?? 'Review spacing relative to the first kill in this cluster.',
      targetFocus: 'Confirm the lowest-threat target after the first kill lands — do not hard-commit into fog.',
      threatEvaluation: 'Count visible enemies before you step into the kill zone.',
      abilitySequencing: 'Save escape tools until after the commit; do not burn them on approach.',
      retreatTiming:
        fight.outcome === 'lost'
          ? 'Leave as soon as two allies are down or you cannot name an escape path.'
          : 'Convert the win: path to the nearest objective within 15s.',
      ultimateValue: 'Ultimates should close a winning fight, not open a losing one.',
      winProbabilityChange:
        fight.outcome === 'won' ? '+10% (est.)' : fight.outcome === 'lost' ? '-12% (est.)' : '±0%',
    };
  });
}

function buildHeroCoaching(replay: ParsedReplay, mistakes: DetectedMistake[]) {
  const hero = replay.metadata.players.find((p) => p.isSubject)?.hero ?? 'your hero';
  const eventBacked = mistakes.filter(
    (m) => !m.isEstimate && (m.relatedEventIds?.length ?? 0) > 0
  );
  const topMistake = eventBacked.find((m) => m.polarity === 'mistake');
  const topPlay = eventBacked.find((m) => m.polarity === 'excellent');

  return [
    {
      timestamp: topMistake?.timestamp ?? 0,
      title: `${hero} — coach focus`,
      whatHappened: topMistake
        ? `Primary ${hero} focus at ${formatClock(topMistake.timestamp)}: ${topMistake.whatHappened}`
        : `Parsed ${replay.events.length} combat events on ${hero}. Scrub deaths and fights on the timeline.`,
      whyItHappened: topMistake?.whyItHappened ?? 'See event-backed moments on the timeline.',
      whyBadOrGood: topPlay
        ? `Keep doing (${formatClock(topPlay.timestamp)}): ${topPlay.whyBadOrGood}`
        : 'Convert winning skirmishes into objectives within 15 seconds.',
      alternativePlay: topMistake?.alternativePlay ?? 'Use the scrubber to review each death with a written alternative.',
      expectedOutcome: topMistake?.expectedOutcome ?? 'Clearer decision quality next match.',
      howToImprove: topMistake?.howToImprove ?? 'Review every death timestamp before queueing again.',
      drills: topMistake?.drills?.slice(0, 3) ?? [`${hero} VOD: pause on every death`],
      category: 'decision_making' as const,
      severity: 'medium' as const,
      isEstimate: !topMistake,
      relatedEventIds: topMistake?.relatedEventIds,
      confidence: topMistake?.confidence ?? 40,
      polarity: 'neutral' as const,
      heroSpecificAdvice: topMistake?.heroSpecificAdvice,
      practiceDrill: topMistake?.practiceDrill,
      difficulty: topMistake?.difficulty,
      winProbabilityDelta: topMistake?.winProbabilityDelta,
    },
    ...mistakes.filter((m) => m.category === 'itemization'),
  ];
}

function buildProComparison(features: ExtractedFeatures): ProComparison[] {
  return [
    {
      metric: 'Gold per minute',
      playerValue: features.gpm,
      proAverage: 520,
      percentile: Math.min(99, Math.round((features.gpm / 520) * 50)),
      unit: 'GPM',
      isEstimate: features.isEstimate || features.gpm === 0,
    },
    {
      metric: 'Idle time',
      playerValue: features.idleTimePercent,
      proAverage: 5,
      percentile: Math.max(1, 100 - features.idleTimePercent * 5),
      unit: '%',
      isEstimate: true,
    },
    {
      metric: 'Fight participation',
      playerValue: Math.round(features.fightParticipation * 100),
      proAverage: 75,
      percentile: Math.round(features.fightParticipation * 100),
      unit: '%',
      isEstimate: features.isEstimate,
    },
  ];
}

function formatClock(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
