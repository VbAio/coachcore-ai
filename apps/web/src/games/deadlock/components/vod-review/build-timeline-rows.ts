import type { CoachingReport, MatchTimeline } from '@coachcore/shared';
import type { TimelineRow } from './types';

export function buildTimelineRows(
  report: CoachingReport,
  timeline: MatchTimeline | null
): TimelineRow[] {
  const rows: TimelineRow[] = [];

  if (timeline) {
    for (const e of timeline.events) {
      if (e.type === 'damage' || e.type === 'heal' || e.type === 'item_activate') continue;
      rows.push({
        id: e.eventId,
        timestamp: e.timestamp,
        kind: e.type === 'item_purchase' ? 'item_purchase' : e.type,
        label: e.label,
        eventIds: [e.eventId],
        involvedPlayerIds: [e.actorId, e.targetId].filter((x): x is string => Boolean(x)),
        position: e.position,
      });
    }
    for (const f of timeline.teamFights) {
      rows.push({
        id: f.id,
        timestamp: f.startTime,
        kind: 'teamfight',
        label: `Teamfight (${f.outcome}) · ${f.kills} kills`,
        involvedPlayerIds: f.participants,
      });
    }
  }

  for (const insight of report.timeline) {
    const id = insight.id ?? `insight-${insight.timestamp}-${insight.title}`;
    const polarity = insight.polarity ?? (insight.severity === 'low' || insight.severity === 'minor' ? 'neutral' : 'mistake');
    rows.push({
      id,
      timestamp: insight.timestamp,
      kind: polarity === 'excellent' ? 'excellent' : polarity === 'mistake' ? 'mistake' : 'all',
      label: insight.title,
      insight,
      eventIds: insight.relatedEventIds,
      involvedPlayerIds: insight.involvedPlayerIds,
      position: insight.position,
      severity: insight.severity,
      polarity,
    });
  }

  // Deduplicate by id, prefer insight-enriched rows when same id
  const byId = new Map<string, TimelineRow>();
  for (const row of rows) {
    const existing = byId.get(row.id);
    if (!existing || (row.insight && !existing.insight)) {
      byId.set(row.id, row);
    }
  }

  return [...byId.values()].sort((a, b) => a.timestamp - b.timestamp || a.label.localeCompare(b.label));
}
