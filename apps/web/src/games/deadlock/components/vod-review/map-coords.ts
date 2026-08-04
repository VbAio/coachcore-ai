/** Deadlock world map radius (game units). Origin is map center. */
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

/** Project world XY → percentage of the circular minimap (0–100, top-left origin). */
export function worldToMapPercent(
  x: number,
  y: number,
  bounds: MapBounds = {
    minX: -MAP_RADIUS,
    maxX: MAP_RADIUS,
    minY: -MAP_RADIUS,
    maxY: MAP_RADIUS,
  }
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

/**
 * Choose projection bounds.
 * Prefer real map radius when samples look like Midtown world coords;
 * otherwise fit to data so dots still move visibly.
 */
export function chooseMapBounds(points: WorldPoint[]): MapBounds {
  const fixed: MapBounds = {
    minX: -MAP_RADIUS,
    maxX: MAP_RADIUS,
    minY: -MAP_RADIUS,
    maxY: MAP_RADIUS,
  };
  if (points.length === 0) return fixed;

  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity;
  for (const p of points) {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  }

  const spanX = maxX - minX;
  const spanY = maxY - minY;
  const maxAbs = Math.max(
    Math.abs(minX),
    Math.abs(maxX),
    Math.abs(minY),
    Math.abs(maxY)
  );

  // Looks like real Deadlock world space (thousands of units)
  const looksLikeWorld =
    maxAbs > 500 && maxAbs < MAP_RADIUS * 1.6 && (spanX > 200 || spanY > 200);

  if (looksLikeWorld) return fixed;

  // Fit-to-data (unknown scale / sparse parse) with padding
  const padX = Math.max(spanX * 0.15, 50);
  const padY = Math.max(spanY * 0.15, 50);
  // Avoid zero-size bounds
  if (spanX < 1 && spanY < 1) {
    return {
      minX: minX - 500,
      maxX: maxX + 500,
      minY: minY - 500,
      maxY: maxY + 500,
    };
  }
  return {
    minX: minX - padX,
    maxX: maxX + padX,
    minY: minY - padY,
    maxY: maxY + padY,
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
  const sorted = samples[0].t <= samples[samples.length - 1].t
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
  const sorted = samples[0].t <= samples[samples.length - 1].t
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

/** Also try X/Z as the ground plane (some dem dumps store height in Y). */
export function pickHorizontalAxes(
  samples: Array<{ t: number; x: number; y: number; z?: number }>
): 'xy' | 'xz' {
  if (samples.length < 2) return 'xy';
  let spanY = 0;
  let spanZ = 0;
  let minY = Infinity,
    maxY = -Infinity,
    minZ = Infinity,
    maxZ = -Infinity;
  for (const s of samples) {
    minY = Math.min(minY, s.y);
    maxY = Math.max(maxY, s.y);
    const z = s.z ?? 0;
    minZ = Math.min(minZ, z);
    maxZ = Math.max(maxZ, z);
  }
  spanY = maxY - minY;
  spanZ = maxZ - minZ;
  // If Y barely changes but Z spans the map, use XZ
  if (spanZ > spanY * 3 && spanZ > 400) return 'xz';
  return 'xy';
}
