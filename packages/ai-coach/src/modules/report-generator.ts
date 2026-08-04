import type {
  CoachingReport,
  ProComparison,
  TeamFightBreakdown,
} from '@coachcore/shared';
import type { ParsedReplay } from '@coachcore/shared';
import type { ExtractedFeatures } from '@coachcore/replay-parser';
import type { DetectedMistake } from './mistake-detector.js';
import { groupMistakesByCategory } from './mistake-detector.js';
import { generateTimeline } from './timeline-generator.js';
import { generateHeatmaps } from './heatmap-generator.js';
import { computeSkillScores, scoreToGrade } from './score-engine.js';
import { generateImprovementPlan } from './recommendation-engine.js';
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
  // Souls/economy not extracted yet — never present fake economy coaching as fact
  if (replay.economy.length === 0) {
    estimatedSections.push('economyAnalysis');
  }

  const laneMistakes = mistakes.filter((m) =>
    ['awareness', 'positioning', 'economy'].includes(m.category) && m.timestamp < replay.metadata.durationSeconds * 0.25
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
  const strengths = Object.entries(scores)
    .filter(([k]) => k !== 'overall')
    .sort((a, b) => (b[1] as number) - (a[1] as number));

  const buildReview = analyzeBuild(replay);
  if (buildReview.purchases.every((p) => p.isEstimate) || buildReview.purchases.length === 0) {
    estimatedSections.push('buildReview');
  }

  // Prefer combat moments in the scrubber timeline — item deep-dives live in buildReview
  const timelineMoments = generateTimeline(
    mistakes.filter((m) => m.category !== 'ability_usage')
  );

  return {
    id: `report-${replayId}`,
    replayId,
    generatedAt: new Date().toISOString(),
    overallGrade: grade,
    overallScore: scores.overall,
    potentialRank: estimateRank(scores.overall + 12),
    currentPerformance: estimateRank(scores.overall),
    biggestWeakness: weaknesses[0]?.[0]?.replace('_', ' ') ?? 'None detected',
    biggestStrength: strengths[0]?.[0] ?? 'Consistency',
    topPriorities: [
      weaknesses[0]?.[0]?.replace('_', ' ') ?? 'Map awareness',
      weaknesses[1]?.[0]?.replace('_', ' ') ?? 'Economy',
      weaknesses[2]?.[0]?.replace('_', ' ') ?? 'Team fighting',
    ] as [string, string, string],
    lanePhaseAnalysis: laneMistakes.filter((m) => m.category !== 'ability_usage'),
    macroAnalysis: macroMistakes,
    microAnalysis: microMistakes.filter((m) => m.category !== 'ability_usage'),
    teamFightAnalysis: buildTeamFightBreakdowns(replay, mistakes),
    heatmaps: generateHeatmaps(replay, features),
    economyAnalysis:
      replay.economy.length === 0
        ? []
        : mistakes.filter((m) => m.category === 'economy'),
    heroSpecificCoaching: buildHeroCoaching(replay, mistakes),
    timeline: timelineMoments,
    mistakesByCategory: grouped,
    improvementPlan: generateImprovementPlan(mistakes, scores),
    proComparison: buildProComparison(features),
    skillScores: scores,
    buildReview,
    estimatedSections,
    extractionConfidence: replay.extractionConfidence,
    parserNotes: replay.parserNotes,
  };
}

function estimateRank(score: number): string {
  if (score >= 90) return 'Ascendant';
  if (score >= 80) return 'Diamond';
  if (score >= 70) return 'Platinum';
  if (score >= 60) return 'Gold';
  if (score >= 50) return 'Silver';
  return 'Bronze';
}

function buildTeamFightBreakdowns(
  replay: ParsedReplay,
  mistakes: DetectedMistake[]
): TeamFightBreakdown[] {
  return replay.teamFights.map((fight) => ({
    fightId: fight.id,
    startTime: fight.startTime,
    endTime: fight.endTime,
    timeline: [
      `${fight.startTime}s: Fight initiated`,
      `${fight.endTime}s: Fight resolved (${fight.outcome})`,
    ],
    whoEngaged: fight.participants[0] ?? 'Unknown',
    mistakes: mistakes.filter(
      (m) => m.timestamp >= fight.startTime && m.timestamp <= fight.endTime
    ),
    goodPlays: [],
    positioningNotes: 'Review spacing relative to primary threat — stay at max effective range.',
    targetFocus: 'Focus lowest-armor carry after cooldowns are burned.',
    threatEvaluation: 'Identify enemy burst window before committing.',
    abilitySequencing: 'Lead with CC, follow with damage amp, save escape for disengage.',
    retreatTiming: 'Disengage when two or more allies are dead or ultimate-less.',
    ultimateValue: 'Hold ultimate unless fight win probability exceeds 60%.',
    winProbabilityChange: fight.outcome === 'won' ? '+15%' : '-20%',
  }));
}

function buildHeroCoaching(replay: ParsedReplay, mistakes: DetectedMistake[]) {
  const hero = replay.metadata.players.find((p) => p.isSubject)?.hero ?? 'your hero';
  const eventBacked = mistakes.filter((m) => !m.isEstimate && (m.relatedEventIds?.length ?? 0) > 0);
  const topMistake = eventBacked.find((m) => m.polarity === 'mistake');
  const topPlay = eventBacked.find((m) => m.polarity === 'excellent');

  return [
    {
      timestamp: topMistake?.timestamp ?? 0,
      title: 'Coach summary',
      whatHappened: topMistake
        ? `Primary focus: ${topMistake.title} at the matched timestamp — ${topMistake.whatHappened}`
        : `Parsed ${replay.events.length} combat events on ${hero}. Scrub the timeline for deaths and fights.`,
      whyItHappened: topMistake?.whyItHappened ?? 'See event-backed moments on the timeline.',
      whyBadOrGood: topPlay
        ? `Keep doing: ${topPlay.title} — ${topPlay.whyBadOrGood}`
        : 'Convert winning skirmishes into objectives within 15 seconds.',
      alternativePlay: topMistake?.alternativePlay ?? 'Use the VOD scrubber to review each death.',
      expectedOutcome: topMistake?.expectedOutcome ?? 'Clearer decision quality next match.',
      howToImprove: topMistake?.howToImprove ?? 'Review every death timestamp before queueing again.',
      drills: topMistake?.drills?.slice(0, 3) ?? [`${hero} VOD: pause on every death`],
      category: 'decision_making' as const,
      severity: 'medium' as const,
      isEstimate: !topMistake,
      relatedEventIds: topMistake?.relatedEventIds,
      confidence: topMistake?.confidence ?? 40,
      polarity: 'neutral' as const,
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
      isEstimate: features.isEstimate,
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
