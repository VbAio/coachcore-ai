import type { CoachingReport, CoachInsight, MatchTimeline } from '@clutchcore/shared';

export type TimelineFilter =
  | 'all'
  | 'death'
  | 'kill'
  | 'assist'
  | 'objective'
  | 'item_purchase'
  | 'teamfight'
  | 'mistake'
  | 'excellent';

export interface VodReviewData {
  report: CoachingReport;
  timeline: MatchTimeline | null;
}

export interface TimelineRow {
  id: string;
  timestamp: number;
  kind: TimelineFilter;
  label: string;
  insight?: CoachInsight;
  eventIds?: string[];
  involvedPlayerIds?: string[];
  position?: { x: number; y: number };
  severity?: string;
  polarity?: CoachInsight['polarity'];
}
