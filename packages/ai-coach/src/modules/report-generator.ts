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
    lanePhaseAnalysis: laneMistakes,
    macroAnalysis: macroMistakes,
    microAnalysis: microMistakes,
    teamFightAnalysis: buildTeamFightBreakdowns(replay, mistakes),
    heatmaps: generateHeatmaps(replay, features),
    economyAnalysis: mistakes.filter((m) => m.category === 'economy'),
    heroSpecificCoaching: buildHeroCoaching(replay, mistakes),
    timeline: generateTimeline(mistakes),
    mistakesByCategory: grouped,
    improvementPlan: generateImprovementPlan(mistakes, scores),
    proComparison: buildProComparison(features),
    skillScores: scores,
    estimatedSections,
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
  return [
    {
      timestamp: 0,
      title: `${hero} — common mistakes`,
      whatHappened: `Players on ${hero} often overcommit after landing key abilities.`,
      whyItHappened: 'Ability hit confirmation bias — assuming kill without checking escape tools.',
      whyBadOrGood: 'Forces unfavorable trades when enemy defensive cooldowns are available.',
      alternativePlay: 'Chunk, observe reaction, commit only if escape is burned.',
      expectedOutcome: 'Higher trade win rate in extended laning.',
      howToImprove: 'Track enemy defensive cooldowns on a notepad for 5 games.',
      drills: [`${hero} combo trainer — 10 min daily`],
      category: 'ability_usage' as const,
      severity: 'medium' as const,
      isEstimate: true,
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
