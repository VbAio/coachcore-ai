import type { ParsedReplay } from '@clutchcore/shared';

export interface ExtractedFeatures {
  gpm: number;
  xpm: number;
  idleTimePercent: number;
  deathTimestamps: number[];
  killTimestamps: number[];
  avgPosition: { x: number; y: number };
  fightParticipation: number;
  abilityCastCount: number;
  itemPurchaseTimings: Array<{ item: string; timestamp: number; delayEstimate: boolean }>;
  lanePhaseDeaths: number;
  midGameDeaths: number;
  lateGameDeaths: number;
  rotationCount: number;
  objectiveParticipation: number;
  isEstimate: boolean;
  notes: string[];
}

/**
 * Transforms raw parsed replay data into coaching-relevant features.
 */
export function extractFeatures(replay: ParsedReplay): ExtractedFeatures {
  const notes: string[] = [...replay.parserNotes];
  const durationMin = Math.max(1, replay.metadata.durationSeconds / 60);
  const subject = replay.metadata.players.find((p) => p.isSubject);
  const hasRealEvents = replay.events.length > 0;
  const isEstimate = replay.extractionConfidence !== 'full' && !hasRealEvents;

  const deathTimestamps = replay.events
    .filter((e) => e.type === 'death' && e.targetId === replay.subjectPlayerId)
    .map((e) => e.timestamp);

  const killTimestamps = replay.events
    .filter((e) => e.type === 'kill' && e.actorId === replay.subjectPlayerId)
    .map((e) => e.timestamp);

  const assistCount = replay.events.filter(
    (e) => e.type === 'assist' && e.actorId === replay.subjectPlayerId
  ).length;

  const objectiveEvents = replay.events.filter((e) => e.type === 'objective');
  const positions = replay.positions;
  const avgPosition =
    positions.length > 0
      ? {
          x: positions.reduce((s, p) => s + p.x, 0) / positions.length,
          y: positions.reduce((s, p) => s + p.y, 0) / positions.length,
        }
      : { x: 0, y: 0 };

  if (positions.length === 0) {
    notes.push('Position-based features are limited — no position data parsed');
  }

  const third = replay.metadata.durationSeconds / 3;
  const subjectFights = replay.teamFights.filter((f) =>
    f.participants.includes(replay.subjectPlayerId)
  );
  const fightParticipation =
    replay.teamFights.length > 0
      ? subjectFights.length / replay.teamFights.length
      : killTimestamps.length + assistCount > 0
        ? Math.min(1, (killTimestamps.length + assistCount) / Math.max(1, deathTimestamps.length + killTimestamps.length))
        : 0;

  const lastEconomy = replay.economy[replay.economy.length - 1];
  const netWorthProxy =
    lastEconomy != null
      ? lastEconomy.netWorth
      : (subject?.kills ?? 0) * 300 +
        (subject?.assists ?? 0) * 150 +
        objectiveEvents.length * 200;

  return {
    gpm: subject
      ? Math.round(
          (lastEconomy != null
            ? lastEconomy.netWorth
            : Math.max(netWorthProxy, subject.kills * 200 + 300)) / durationMin
        )
      : 0,
    xpm: Math.round(
      ((subject?.kills ?? 0) * 80 + (subject?.assists ?? 0) * 40 + 300) / durationMin
    ),
    idleTimePercent: hasRealEvents
      ? Math.min(40, Math.max(4, 20 - killTimestamps.length - assistCount))
      : isEstimate
        ? 15
        : 8,
    deathTimestamps,
    killTimestamps,
    avgPosition,
    fightParticipation,
    abilityCastCount: replay.events.filter((e) => e.type === 'ability_cast').length,
    itemPurchaseTimings: replay.itemPurchases.map((p) => ({
      item: p.item,
      timestamp: p.timestamp,
      delayEstimate: !hasRealEvents,
    })),
    lanePhaseDeaths: deathTimestamps.filter((t) => t < third).length,
    midGameDeaths: deathTimestamps.filter((t) => t >= third && t < third * 2).length,
    lateGameDeaths: deathTimestamps.filter((t) => t >= third * 2).length,
    rotationCount: hasRealEvents
      ? Math.floor(objectiveEvents.length + subjectFights.length)
      : 0,
    objectiveParticipation: objectiveEvents.length,
    isEstimate,
    notes,
  };
}
