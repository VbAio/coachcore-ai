/** Deadlock Midtown world map radius (Hammer units). Origin is map center. */
export const MAP_RADIUS = 10752;

export const MINIMAP_SRC = '/maps/deadlock-minimap.png';

export interface WorldPoint {
  x: number;
  y: number;
}

export interface MapBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export const MIDTOWN_BOUNDS: MapBounds = {
  minX: -MAP_RADIUS,
  maxX: MAP_RADIUS,
  minY: -MAP_RADIUS,
  maxY: MAP_RADIUS,
};

/**
 * Project world XY → percentage of the circular minimap (0–100, top-left origin).
 * Matches deadlock-api-assets draw_minimap extent=(-R,R,-R,R) with +Y up.
 */
export function worldToMapPercent(
  x: number,
  y: number,
  bounds: MapBounds = MIDTOWN_BOUNDS
): { cx: number; cy: number } {
  const w = bounds.maxX - bounds.minX || 1;
  const h = bounds.maxY - bounds.minY || 1;
  const cx = ((x - bounds.minX) / w) * 100;
  // World +Y is “up”; CSS +Y is down
  const cy = ((bounds.maxY - y) / h) * 100;
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
  if (!samples || samples.length === 0) return null;
  const sorted =
    samples[0].t <= samples[samples.length - 1].t
      ? samples
      : [...samples].sort((a, b) => a.t - b.t);

  if (time <= sorted[0].t) return { x: sorted[0].x, y: sorted[0].y };
  const last = sorted[sorted.length - 1];
  if (time >= last.t) return { x: last.x, y: last.y };

  let lo = 0;
  let hi = sorted.length - 1;
  while (lo < hi - 1) {
    const mid = (lo + hi) >> 1;
    if (sorted[mid].t <= time) lo = mid;
    else hi = mid;
  }
  const a = sorted[lo];
  const b = sorted[hi];
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
  if (!samples?.length) return [];
  const sorted =
    samples[0].t <= samples[samples.length - 1].t
      ? samples
      : [...samples].sort((a, b) => a.t - b.t);
  const start = time - lookbackSec;
  const pts: WorldPoint[] = [];
  for (const s of sorted) {
    if (s.t < start) continue;
    if (s.t > time) break;
    pts.push({ x: s.x, y: s.y });
  }
  const tip = interpolateSamples(sorted, time);
  if (tip) pts.push(tip);
  if (pts.length <= maxPoints) return pts;
  const step = pts.length / maxPoints;
  const out: WorldPoint[] = [];
  for (let i = 0; i < maxPoints; i++) out.push(pts[Math.floor(i * step)]);
  return out;
}

/**
 * True when samples look like Midtown world space (thousands of Hammer units),
 * not Source 2 in-cell offsets (~0–512) that were stored by older parser builds.
 */
export function looksLikeWorldCoords(
  samples: Array<{ x: number; y: number; z?: number }>
): boolean {
  if (samples.length === 0) return false;
  let maxAbs = 0;
  let spanX = 0;
  let spanY = 0;
  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity;
  for (const s of samples) {
    maxAbs = Math.max(maxAbs, Math.abs(s.x), Math.abs(s.y), Math.abs(s.z ?? 0));
    minX = Math.min(minX, s.x);
    maxX = Math.max(maxX, s.x);
    minY = Math.min(minY, s.y);
    maxY = Math.max(maxY, s.y);
  }
  spanX = maxX - minX;
  spanY = maxY - minY;
  return maxAbs > 800 && (spanX > 200 || spanY > 200 || samples.length < 3);
}
