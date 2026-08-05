import type { ChatCoachMessage, CoachingReport, CoachInsight, ParsedReplay } from '@coachcore/shared';
import type { ExtractedFeatures } from '@coachcore/replay-parser';
import { extractFeatures } from '@coachcore/replay-parser';
import { detectMistakes } from '../modules/mistake-detector.js';
import type { CoachProvider, CoachProviderConfig } from './coach-provider.interface.js';
import { buildReportFromPipeline } from '../pipeline/coaching-pipeline.js';

interface AiEnhancementPayload {
  currentPerformance?: string;
  biggestWeakness?: string;
  biggestStrength?: string;
  topPriorities?: string[];
  overviewSummary?: string;
  insightEnhancements?: Array<{
    index?: number;
    title?: string;
    whatHappened?: string;
    whyItHappened?: string;
    whyBadOrGood?: string;
    alternativePlay?: string;
    howToImprove?: string;
    drills?: string[];
  }>;
  improvementPlan?: {
    todaysFocus?: string;
    weeklyFocus?: string;
    practiceDrills?: string[];
    goalForNextMatch?: string;
  };
}

/**
 * OpenAI-powered coach provider.
 * Builds a rule-based report, then merges validated AI enhancements.
 */
export class OpenAICoachProvider implements CoachProvider {
  readonly name = 'openai';
  private config: CoachProviderConfig;

  constructor(config: CoachProviderConfig) {
    this.config = config;
  }

  async generateReport(
    replay: ParsedReplay,
    features: ExtractedFeatures,
    replayId?: string
  ): Promise<CoachingReport> {
    const baseReport = buildReportFromPipeline(replayId ?? `openai-${Date.now()}`, replay);

    if (!this.config.apiKey) {
      return baseReport;
    }

    try {
      const mistakes = detectMistakes(replay, features);
      const subject = replay.metadata.players.find((p) => p.isSubject);
      const compact = {
        hero: subject?.hero,
        playerName: subject?.name,
        kda: subject
          ? `${subject.kills}/${subject.deaths}/${subject.assists}`
          : null,
        durationSeconds: replay.metadata.durationSeconds,
        map: replay.metadata.map,
        extractionConfidence: replay.extractionConfidence,
        features: {
          gpm: features.gpm,
          xpm: features.xpm,
          lanePhaseDeaths: features.lanePhaseDeaths,
          midGameDeaths: features.midGameDeaths,
          lateGameDeaths: features.lateGameDeaths,
          fightParticipation: features.fightParticipation,
          objectiveParticipation: features.objectiveParticipation,
          abilityCastCount: features.abilityCastCount,
          isEstimate: features.isEstimate,
        },
        topMistakes: mistakes.slice(0, 12).map((m, index) => ({
          index,
          timestamp: m.timestamp,
          title: m.title,
          category: m.category,
          severity: m.severity,
          whatHappened: m.whatHappened,
          relatedEventIds: m.relatedEventIds,
          involvedPlayerIds: m.involvedPlayerIds,
          confidence: m.confidence,
          polarity: m.polarity,
          isEstimate: m.isEstimate,
        })),
        recentEvents: replay.events.slice(0, 40).map((e) => ({
          eventId: e.eventId,
          t: e.timestamp,
          type: e.type,
          actorId: e.actorId,
          targetId: e.targetId,
          ability: e.ability,
          item: e.item,
        })),
        parserNotes: replay.parserNotes.slice(0, 8),
        grades: {
          overallGrade: baseReport.overallGrade,
          overallScore: baseReport.overallScore,
          biggestWeakness: baseReport.biggestWeakness,
        },
      };

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.config.model ?? 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `You are a premium Deadlock esports coach writing a $50 private VOD review (Chess.com Game Review / Mobalytics quality).
Rules:
- Never invent timestamps, locations, items, souls, cooldowns, or events. Only rewrite provided mistake indexes and cite relatedEventIds.
- BANNED phrases: "play safer", "play better", "farm more", "position better", "rotate earlier", "be less greedy", "improve your gameplay".
- Every enhancement must keep the original timestamp and answer: what happened, why, why bad/good, exact alternative, expected outcome, and a concrete drill.
- If unsure, lower confidence — do not invent.
- Hero-specific advice when hero is known.
Return ONLY JSON matching:
{
  "currentPerformance": string,
  "biggestWeakness": string,
  "biggestStrength": string,
  "topPriorities": [string, string, string],
  "overviewSummary": string,
  "insightEnhancements": [{
    "index": number,
    "title": string,
    "whatHappened": string,
    "whyItHappened": string,
    "whyBadOrGood": string,
    "alternativePlay": string,
    "howToImprove": string,
    "drills": string[]
  }],
  "improvementPlan": {
    "todaysFocus": string,
    "weeklyFocus": string,
    "practiceDrills": string[],
    "goalForNextMatch": string
  }
}`,
            },
            {
              role: 'user',
              content: JSON.stringify(compact),
            },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.4,
        }),
      });

      if (!response.ok) {
        return baseReport;
      }

      const data = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const raw = data.choices?.[0]?.message?.content;
      if (!raw) return baseReport;

      const enhancement = parseEnhancement(raw);
      if (!enhancement) return baseReport;

      return mergeEnhancement(baseReport, enhancement, mistakes.length);
    } catch {
      return baseReport;
    }
  }

  async chat(
    replay: ParsedReplay,
    report: CoachingReport,
    messages: ChatCoachMessage[]
  ): Promise<ChatCoachMessage> {
    if (!this.config.apiKey) {
      return {
        role: 'assistant',
        content: 'OpenAI API key not configured.',
      };
    }

    try {
      const features = extractFeatures(replay);
      const subject = replay.metadata.players.find((p) => p.isSubject);
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.config.model ?? 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `You are CoachCore AI for Deadlock. Reference replay timestamps when helpful.
Subject: ${subject?.name ?? 'player'} on ${subject?.hero ?? 'unknown'} (${subject ? `${subject.kills}/${subject.deaths}/${subject.assists}` : 'n/a'}).
Report: grade ${report.overallGrade}, weakness ${report.biggestWeakness}, strength ${report.biggestStrength}.
Confidence: ${replay.extractionConfidence}. Notes: ${replay.parserNotes.slice(0, 5).join('; ')}.
Features: GPM~${features.gpm}, fight participation ${(features.fightParticipation * 100).toFixed(0)}%.`,
            },
            ...messages.map((m) => ({ role: m.role, content: m.content })),
          ],
        }),
      });

      const data = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };

      return {
        role: 'assistant',
        content: data.choices?.[0]?.message?.content ?? 'Unable to generate response.',
      };
    } catch {
      return {
        role: 'assistant',
        content: 'AI coach temporarily unavailable. Try again shortly.',
      };
    }
  }
}

function parseEnhancement(raw: string): AiEnhancementPayload | null {
  try {
    const parsed = JSON.parse(raw) as AiEnhancementPayload;
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
  } catch {
    return null;
  }
}

function asString(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function asStringArray(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return fallback;
  const items = value.filter((v): v is string => typeof v === 'string' && v.trim().length > 0);
  return items.length > 0 ? items : fallback;
}

function mergeEnhancement(
  base: CoachingReport,
  ai: AiEnhancementPayload,
  mistakeCount: number
): CoachingReport {
  const priorities = asStringArray(ai.topPriorities, [...base.topPriorities]).slice(0, 3);
  while (priorities.length < 3) priorities.push(base.topPriorities[priorities.length] ?? 'Fundamentals');

  const timeline = base.timeline.map((insight, index) =>
    enhanceInsight(insight, ai.insightEnhancements?.find((e) => e.index === index), index, mistakeCount)
  );
  const lanePhaseAnalysis = base.lanePhaseAnalysis.map((insight, index) =>
    enhanceInsight(insight, ai.insightEnhancements?.find((e) => e.index === index), index, mistakeCount)
  );

  const plan = ai.improvementPlan ?? {};

  return {
    ...base,
    currentPerformance: asString(ai.currentPerformance, base.currentPerformance),
    biggestWeakness: asString(ai.biggestWeakness, base.biggestWeakness),
    biggestStrength: asString(ai.biggestStrength, base.biggestStrength),
    topPriorities: priorities as [string, string, string],
    timeline,
    lanePhaseAnalysis,
    // Stash a short AI overview into hero-specific coaching as a lead insight when provided
    heroSpecificCoaching: ai.overviewSummary
      ? [
          {
            timestamp: 0,
            title: 'Coach summary',
            whatHappened: ai.overviewSummary,
            whyItHappened: base.biggestWeakness,
            whyBadOrGood: base.currentPerformance,
            alternativePlay: priorities[0] ?? base.topPriorities[0],
            expectedOutcome: base.potentialRank,
            howToImprove: asString(plan.todaysFocus, base.improvementPlan.todaysFocus),
            drills: asStringArray(plan.practiceDrills, base.improvementPlan.practiceDrills).slice(0, 5),
            category: 'decision_making',
            severity: 'medium',
            isEstimate: base.estimatedSections.length > 0,
          } satisfies CoachInsight,
          ...base.heroSpecificCoaching,
        ]
      : base.heroSpecificCoaching,
    improvementPlan: {
      ...base.improvementPlan,
      todaysFocus: asString(plan.todaysFocus, base.improvementPlan.todaysFocus),
      weeklyFocus: asString(plan.weeklyFocus, base.improvementPlan.weeklyFocus),
      practiceDrills: asStringArray(plan.practiceDrills, base.improvementPlan.practiceDrills),
      goalForNextMatch: asString(plan.goalForNextMatch, base.improvementPlan.goalForNextMatch),
    },
  };
}

function enhanceInsight(
  insight: CoachInsight,
  patch:
    | NonNullable<AiEnhancementPayload['insightEnhancements']>[number]
    | undefined,
  index: number,
  mistakeCount: number
): CoachInsight {
  if (!patch || index >= mistakeCount) return insight;
  return {
    ...insight,
    title: asString(patch.title, insight.title),
    whatHappened: asString(patch.whatHappened, insight.whatHappened),
    whyItHappened: asString(patch.whyItHappened, insight.whyItHappened),
    whyBadOrGood: asString(patch.whyBadOrGood, insight.whyBadOrGood),
    alternativePlay: asString(patch.alternativePlay, insight.alternativePlay),
    howToImprove: asString(patch.howToImprove, insight.howToImprove),
    drills: asStringArray(patch.drills, insight.drills),
  };
}
