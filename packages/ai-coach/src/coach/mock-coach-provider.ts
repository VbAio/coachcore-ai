import type { ChatCoachMessage, CoachingReport, ParsedReplay } from '@clutchcore/shared';
import type { ExtractedFeatures } from '@clutchcore/replay-parser';
import type { CoachProvider } from './coach-provider.interface.js';
import { buildReportFromPipeline } from '../pipeline/coaching-pipeline.js';

export class MockCoachProvider implements CoachProvider {
  readonly name = 'mock';

  async generateReport(replay: ParsedReplay, _features: ExtractedFeatures, replayId?: string): Promise<CoachingReport> {
    return buildReportFromPipeline(replayId ?? `local-${Date.now()}`, replay);
  }

  async chat(
    replay: ParsedReplay,
    report: CoachingReport,
    messages: ChatCoachMessage[]
  ): Promise<ChatCoachMessage> {
    const last = messages[messages.length - 1]?.content.toLowerCase() ?? '';

    if (last.includes('death') || last.includes('die')) {
      const death = report.timeline.find((t) => t.title.toLowerCase().includes('death'))
        ?? report.timeline[0];
      return {
        role: 'assistant',
        content: death
          ? `At ${formatTs(death.timestamp)}: ${death.whatHappened} ${death.alternativePlay}`
          : 'No deaths with detailed coaching data in this replay yet. Upload a fully parsed replay for timestamp-specific analysis.',
        timestampReferences: death ? [death.timestamp] : [],
      };
    }

    if (last.includes('position')) {
      const pos = report.mistakesByCategory.positioning;
      return {
        role: 'assistant',
        content: pos.length
          ? `Found ${pos.length} positioning issues. Top one at ${formatTs(pos[0].timestamp)}: ${pos[0].whatHappened}`
          : 'No positioning mistakes detected in this analysis.',
        timestampReferences: pos.map((p) => p.timestamp),
      };
    }

    if (last.includes('buy') || last.includes('item')) {
      return {
        role: 'assistant',
        content:
          'Based on your economy analysis: prioritize core item before luxury upgrades. Check the Economy section for delayed purchase notes.',
        timestampReferences: [],
      };
    }

    return {
      role: 'assistant',
      content:
        'I can help explain deaths, positioning, itemization, and matchup decisions. Reference a timestamp or ask about a specific topic.',
      timestampReferences: report.timeline.slice(0, 3).map((t) => t.timestamp),
    };
  }
}

function formatTs(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}
