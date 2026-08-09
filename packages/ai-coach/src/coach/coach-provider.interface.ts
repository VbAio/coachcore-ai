import type { CoachingReport, ChatCoachMessage, ParsedReplay } from '@clutchcore/shared';
import type { ExtractedFeatures } from '@clutchcore/replay-parser';

export interface CoachProvider {
  readonly name: string;

  generateReport(
    replay: ParsedReplay,
    features: ExtractedFeatures,
    replayId?: string
  ): Promise<CoachingReport>;

  chat(
    replay: ParsedReplay,
    report: CoachingReport,
    messages: ChatCoachMessage[]
  ): Promise<ChatCoachMessage>;
}

export interface CoachProviderConfig {
  apiKey?: string;
  model?: string;
}
