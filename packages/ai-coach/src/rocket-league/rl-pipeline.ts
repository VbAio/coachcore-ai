import type { RlCoachingReport, RlParsedReplay } from '@clutchcore/shared';
import { generateRlReport, polishRlInsightsWithRules } from './rl-report-generator.js';

export type RlPipelineProgress = (stage: string, progress: number, message: string) => void;

/**
 * Rocket League coaching pipeline — fully separate from Deadlock runCoachingPipeline.
 */
export async function runRlCoachingPipeline(
  replayId: string,
  replay: RlParsedReplay,
  onProgress?: RlPipelineProgress
): Promise<RlCoachingReport> {
  onProgress?.('feature_extraction', 15, 'Reading cars, ball, and boost events...');
  onProgress?.('mistake_detection', 40, 'Detecting mechanical and decision errors...');
  onProgress?.('coaching', 65, 'Building SSL-style coaching insights...');

  let report = generateRlReport(replayId, replay);

  if (process.env.AI_COACH_PROVIDER === 'openai' && process.env.OPENAI_API_KEY) {
    onProgress?.('coaching', 78, 'Polishing evidence-bound coaching copy...');
    try {
      report = await rewriteRlReportWithOpenAI(report, replay);
    } catch {
      report = {
        ...report,
        timeline: polishRlInsightsWithRules(report.timeline),
        parserNotes: [
          ...report.parserNotes,
          'OpenAI polish skipped — using rule-based SSL coaching copy.',
        ],
      };
    }
  }

  onProgress?.('report_generation', 92, 'Assembling heatmaps, boost, and improvement plan...');
  return report;
}

async function rewriteRlReportWithOpenAI(
  report: RlCoachingReport,
  replay: RlParsedReplay
): Promise<RlCoachingReport> {
  const key = process.env.OPENAI_API_KEY!;
  const system = `You are an SSL Rocket League coach. Rewrite ONLY the text fields of the provided insights.
Rules:
- Keep timestamps, ids, relatedEventIds, positions, winProbabilityDelta, confidence unchanged.
- Ban vague phrases: "rotate better", "hit the ball harder", "position better", "use boost wisely", "challenge sooner".
- Every insight must state what happened, why, alternative, expected outcome, and a drill.
- If unsure, lower confidence — never invent ball/car positions not in the JSON.
Return JSON { "timeline": RlCoachInsight[] } only.`;

  const user = JSON.stringify({
    map: replay.metadata.map,
    playlist: replay.metadata.playlist,
    timeline: report.timeline.slice(0, 24),
  });

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
      temperature: 0.4,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
  });

  if (!res.ok) throw new Error(`OpenAI ${res.status}`);
  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('Empty OpenAI response');
  const parsed = JSON.parse(content) as { timeline?: typeof report.timeline };
  if (!parsed.timeline?.length) return report;

  // Merge text fields onto originals to preserve evidence
  const byId = new Map(report.timeline.map((t) => [t.id, t]));
  const merged = parsed.timeline.map((t) => {
    const orig = byId.get(t.id);
    if (!orig) return t;
    return {
      ...orig,
      title: t.title || orig.title,
      whatHappened: t.whatHappened || orig.whatHappened,
      whyItHappened: t.whyItHappened || orig.whyItHappened,
      whyBadOrGood: t.whyBadOrGood || orig.whyBadOrGood,
      alternativePlay: t.alternativePlay || orig.alternativePlay,
      expectedOutcome: t.expectedOutcome || orig.expectedOutcome,
      howToImprove: t.howToImprove || orig.howToImprove,
      mechanicsOrDecision: t.mechanicsOrDecision || orig.mechanicsOrDecision,
      proExample: t.proExample ?? orig.proExample,
    };
  });

  return { ...report, timeline: merged };
}
