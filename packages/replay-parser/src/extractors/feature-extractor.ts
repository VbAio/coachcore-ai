import type { ParsedReplay } from '@coachcore/shared';

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
 * Separated from parser so feature logic can evolve independently.
 */
export function extractFeatures(replay: ParsedReplay): ExtractedFeatures {
  const notes: string[] = [...replay.parserNotes];
  const durationMin = replay.metadata.durationSeconds / 60;
  const subject = replay.metadata.players.find((p) => p.isSubject);

  const deathTimestamps = replay.events
    .filter((e) => e.type === 'death' && e.targetId === replay.subjectPlayerId)
    .map((e) => e.timestamp);

  const killTimestamps = replay.events
    .filter((e) => e.type === 'kill' && e.actorId === replay.subjectPlayerId)
    .map((e) => e.timestamp);

  const positions = replay.positions;
  const avgPosition =
    positions.length > 0
      ? {
          x: positions.reduce((s, p) => s + p.x, 0) / positions.length,
          y: positions.reduce((s, p) => s + p.y, 0) / positions.length,
        }
      : { x: 0, y: 0 };

  const isEstimate = replay.extractionConfidence !== 'full';

  if (positions.length === 0) {
    notes.push('Position-based features are estimates — no position data parsed');
  }

  const third = replay.metadata.durationSeconds / 3;

  return {
    gpm: subject ? Math.round((subject.kills * 200 + 300) / durationMin) : 0,
    xpm: Math.round(400 / durationMin),
    idleTimePercent: isEstimate ? 15 : 8,
    deathTimestamps,
    killTimestamps,
    avgPosition,
    fightParticipation: replay.teamFights.length > 0 ? 0.6 : 0,
    abilityCastCount: replay.events.filter((e) => e.type === 'ability_cast').length,
    itemPurchaseTimings: replay.itemPurchases.map((p) => ({
      item: p.item,
      timestamp: p.timestamp,
      delayEstimate: isEstimate,
    })),
    lanePhaseDeaths: deathTimestamps.filter((t) => t < third).length,
    midGameDeaths: deathTimestamps.filter((t) => t >= third && t < third * 2).length,
    lateGameDeaths: deathTimestamps.filter((t) => t >= third * 2).length,
    rotationCount: isEstimate ? 0 : Math.floor(replay.events.length / 50),
    objectiveParticipation: 0,
    isEstimate,
    notes,
  };
}
