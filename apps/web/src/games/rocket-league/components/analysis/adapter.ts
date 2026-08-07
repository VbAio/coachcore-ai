import type { RlCoachingReport, RlCoachingReportPayload, RlMatchTimeline } from '@coachcore/shared';

export function normalizeRlPayload(raw: unknown): RlCoachingReportPayload | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;

  if (obj.report && typeof obj.report === 'object') {
    const report = obj.report as RlCoachingReport;
    if (report.game !== 'rocket-league' && obj.game !== 'rocket-league') {
      // Still accept if skill axes look RL-shaped
      if (!('boostAnalysis' in report) && !('rotationAnalysis' in report)) return null;
    }
    return {
      report: { ...report, game: 'rocket-league' },
      timeline: (obj.timeline as RlMatchTimeline | null) ?? null,
      game: 'rocket-league',
    };
  }

  return null;
}
