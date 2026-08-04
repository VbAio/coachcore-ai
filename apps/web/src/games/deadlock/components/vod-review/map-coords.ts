/** Deadlock world map radius (game units). Origin is map center. */
export const MAP_RADIUS = 10752;

export const MINIMAP_SRC = '/maps/deadlock-minimap.png';

export interface WorldPoint {
  x: number;
  y: number;
}

/** Project world XY → percentage of the circular minimap (0–100, top-left origin). */
export function worldToMapPercent(x: number, y: number): { cx: number; cy: number } {
  const cx = ((x + MAP_RADIUS) / (MAP_RADIUS * 2)) * 100;
  // World +Y is “up”; CSS/SVG +Y is down
  const cy = ((MAP_RADIUS - y) / (MAP_RADIUS * 2)) * 100;
  return {
    cx: Math.min(100, Math.max(0, cx)),
    cy: Math.min(100, Math.max(0, cy)),
  };
}

/** Smoothstep for nicer motion between sparse samples */
export function smoothstep(t: number): number {
  const u = Math.min(1, Math.max(0, t));
  return u * u * (3 - 2 * u);
}

export function interpolateSamples(
  samples: Array<{ t: number; x: number; y: number }>,
  time: number
): WorldPoint | null {
  if (samples.length === 0) return null;
  if (time <= samples[0].t) return { x: samples[0].x, y: samples[0].y };
  const last = samples[samples.length - 1];
  if (time >= last.t) return { x: last.x, y: last.y };

  // Binary search for segment
  let lo = 0;
  let hi = samples.length - 1;
  while (lo < hi - 1) {
    const mid = (lo + hi) >> 1;
    if (samples[mid].t <= time) lo = mid;
    else hi = mid;
  }
  const a = samples[lo];
  const b = samples[hi];
  const u = smoothstep((time - a.t) / Math.max(0.001, b.t - a.t));
  return {
    x: a.x + (b.x - a.x) * u,
    y: a.y + (b.y - a.y) * u,
  };
}

/** Recent path points for a motion trail */
export function trailSamples(
  samples: Array<{ t: number; x: number; y: number }>,
  time: number,
  lookbackSec = 8,
  maxPoints = 24
): WorldPoint[] {
  const start = time - lookbackSec;
  const pts: WorldPoint[] = [];
  for (const s of samples) {
    if (s.t < start) continue;
    if (s.t > time) break;
    pts.push({ x: s.x, y: s.y });
  }
  const tip = interpolateSamples(samples, time);
  if (tip) pts.push(tip);
  if (pts.length <= maxPoints) return pts;
  const step = pts.length / maxPoints;
  const out: WorldPoint[] = [];
  for (let i = 0; i < maxPoints; i++) out.push(pts[Math.floor(i * step)]);
  return out;
}
