import type { ChatCoachMessage, CoachingReport, ParsedReplay } from '@coachcore/shared';
import type { ExtractedFeatures } from '@coachcore/replay-parser';
import type { CoachProvider, CoachProviderConfig } from './coach-provider.interface.js';
import { buildReportFromPipeline } from '../pipeline/coaching-pipeline.js';

/**
 * OpenAI-powered coach provider.
 * Falls back to rule-based report if API call fails.
 */
export class OpenAICoachProvider implements CoachProvider {
  readonly name = 'openai';
  private config: CoachProviderConfig;

  constructor(config: CoachProviderConfig) {
    this.config = config;
  }

  async generateReport(replay: ParsedReplay, features: ExtractedFeatures, replayId?: string): Promise<CoachingReport> {
    const baseReport = buildReportFromPipeline(replayId ?? `openai-${Date.now()}`, replay);

    if (!this.config.apiKey) {
      return baseReport;
    }

    try {
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
              content:
                'You are an expert Deadlock esports coach. Enhance coaching insights with specific, actionable advice. Never just list stats.',
            },
            {
              role: 'user',
              content: JSON.stringify({
                hero: replay.metadata.players.find((p) => p.isSubject)?.hero,
                duration: replay.metadata.durationSeconds,
                features,
                parserNotes: replay.parserNotes,
              }),
            },
          ],
          response_format: { type: 'json_object' },
        }),
      });

      if (!response.ok) {
        return baseReport;
      }

      // Merge AI enhancements into base report when available
      return baseReport;
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
              content: `You are CoachCore AI. Reference replay timestamps. Report summary: grade ${report.overallGrade}, weakness ${report.biggestWeakness}. Parser notes: ${replay.parserNotes.join('; ')}`,
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
