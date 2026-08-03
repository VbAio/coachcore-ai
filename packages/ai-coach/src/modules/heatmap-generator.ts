import type { HeatmapData, ParsedReplay } from '@coachcore/shared';
import type { ExtractedFeatures } from '@coachcore/replay-parser';

export function generateHeatmaps(
  replay: ParsedReplay,
  features: ExtractedFeatures
): HeatmapData[] {
  const mapName = replay.metadata.map;
  const basePoints = replay.positions.map((p) => ({
    x: p.x,
    y: p.y,
    weight: 1,
  }));

  const deathPoints = replay.events
    .filter((e) => e.type === 'death' && e.position)
    .map((e) => ({
      x: e.position!.x,
      y: e.position!.y,
      weight: 3,
    }));

  // Placeholder grid when no position data
  const placeholder = generatePlaceholderGrid(features.avgPosition);

  return [
    {
      type: 'movement',
      points: basePoints.length > 0 ? basePoints : placeholder,
      mapName,
    },
    {
      type: 'deaths',
      points: deathPoints.length > 0 ? deathPoints : [],
      mapName,
    },
    {
      type: 'farming',
      points: basePoints.length > 0 ? basePoints.filter((_, i) => i % 3 === 0) : placeholder,
      mapName,
    },
    {
      type: 'danger',
      points: deathPoints,
      mapName,
    },
  ];
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
