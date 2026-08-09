import type { CoachingReport, ParsedReplay } from '@clutchcore/shared';
import { extractFeatures } from '@clutchcore/replay-parser';
import type { CoachProvider } from '../coach/coach-provider.interface.js';
import { MockCoachProvider } from '../coach/mock-coach-provider.js';
import { OpenAICoachProvider } from '../coach/openai-coach-provider.js';
import { detectMistakes } from '../modules/mistake-detector.js';
import { generateReport } from '../modules/report-generator.js';

export type PipelineProgress = (stage: string, progress: number, message: string) => void;

export function createCoachProvider(providerName?: string): CoachProvider {
  const name = providerName ?? process.env.AI_COACH_PROVIDER ?? 'mock';
  if (name === 'openai' && process.env.OPENAI_API_KEY) {
    return new OpenAICoachProvider({ apiKey: process.env.OPENAI_API_KEY });
  }
  return new MockCoachProvider();
}

export async function runCoachingPipeline(
  replayId: string,
  replay: ParsedReplay,
  onProgress?: PipelineProgress
): Promise<CoachingReport> {
  onProgress?.('feature_extraction', 10, 'Extracting gameplay features...');
  const features = extractFeatures(replay);

  onProgress?.('mistake_detection', 35, 'Detecting mistakes and decision errors...');
  const mistakes = detectMistakes(replay, features);

  onProgress?.('coaching', 60, 'Generating coaching insights...');
  const provider = createCoachProvider();

  onProgress?.('report_generation', 85, 'Building your coaching report...');
  const report = await provider.generateReport(replay, features, replayId);

  return {
    ...report,
    id: `report-${replayId}`,
    replayId,
  };
}

/** Direct report generation without external AI — used by MockCoachProvider */
export function buildReportFromPipeline(
  replayId: string,
  replay: ParsedReplay
): CoachingReport {
  const features = extractFeatures(replay);
  const mistakes = detectMistakes(replay, features);
  return generateReport(replayId, replay, features, mistakes);
}
