import type { HeatmapData, ParsedReplay } from '@clutchcore/shared';
import type { ExtractedFeatures } from '@clutchcore/replay-parser';

export function generateHeatmaps(
  replay: ParsedReplay,
  features: ExtractedFeatures
): HeatmapData[] {
  const mapName = replay.metadata.map;
  const subject = replay.subjectPlayerId;

  const subjectPositions = replay.positions.filter(
    (p) => !p.playerId || p.playerId === subject
  );
  const movement = subjectPositions.map((p) => ({
    x: p.x,
    y: p.y,
    weight: 1,
    t: p.timestamp,
  }));

  const deaths = replay.events
    .filter((e) => e.type === 'death' && e.targetId === subject && e.position)
    .map((e) => ({
      x: e.position!.x,
      y: e.position!.y,
      weight: 4,
      t: e.timestamp,
      label: 'Death',
    }));

  const kills = replay.events
    .filter((e) => e.type === 'kill' && e.actorId === subject && e.position)
    .map((e) => ({
      x: e.position!.x,
      y: e.position!.y,
      weight: 3,
      t: e.timestamp,
      label: 'Kill',
    }));

  const objectives = replay.events
    .filter((e) => e.type === 'objective' && e.position)
    .map((e) => ({
      x: e.position!.x,
      y: e.position!.y,
      weight: 3,
      t: e.timestamp,
      label: 'Objective',
    }));

  const placeholder = generatePlaceholderGrid(features.avgPosition);
  const hasPos = movement.length > 8;

  // Safe zones ≈ movement minus death neighborhoods
  const safe = hasPos
    ? movement.filter((m) =>
        deaths.every((d) => dist2(m.x, m.y, d.x, d.y) > 900 * 900)
      )
    : [];

  // Rotations: large jumps between consecutive samples
  const rotations: HeatmapData['points'] = [];
  if (hasPos) {
    const sorted = [...movement].sort((a, b) => (a.t ?? 0) - (b.t ?? 0));
    for (let i = 1; i < sorted.length; i++) {
      const a = sorted[i - 1];
      const b = sorted[i];
      const d = Math.sqrt(dist2(a.x, a.y, b.x, b.y));
      if (d > 1800) {
        rotations.push({
          x: (a.x + b.x) / 2,
          y: (a.y + b.y) / 2,
          weight: Math.min(5, d / 1500),
          t: b.t,
          label: 'Rotation',
        });
      }
    }
  }

  const farming = hasPos
    ? movement.filter((_, i) => i % 4 === 0)
    : generatePlaceholderGrid(features.avgPosition);

  return [
    { type: 'movement', points: hasPos ? movement : placeholder, mapName },
    { type: 'deaths', points: deaths, mapName },
    { type: 'kills', points: kills, mapName },
    { type: 'objective', points: objectives, mapName },
    { type: 'danger', points: deaths, mapName },
    { type: 'safe_zones', points: safe.slice(0, 400), mapName },
    { type: 'farming', points: farming, mapName },
    { type: 'rotations', points: rotations, mapName },
    { type: 'roaming', points: rotations, mapName },
  ];
}

function dist2(ax: number, ay: number, bx: number, by: number) {
  const dx = ax - bx;
  const dy = ay - by;
  return dx * dx + dy * dy;
}

function generatePlaceholderGrid(center: { x: number; y: number }) {
  const points: Array<{ x: number; y: number; weight: number }> = [];
  for (let i = -5; i <= 5; i++) {
    for (let j = -5; j <= 5; j++) {
      points.push({
        x: center.x + i * 100,
        y: center.y + j * 100,
        weight: Math.max(0, 1 - (Math.abs(i) + Math.abs(j)) / 10),
      });
    }
  }
  return points;
}
