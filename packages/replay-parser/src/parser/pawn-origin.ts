/**
 * Source 2 / Deadlock stores entity position as cell index + in-cell offset.
 * Reading m_vecOrigin alone is a sawtooth that resets at every cell boundary —
 * not a world coordinate. Matches boon-deadlock's cell_to_world.
 *
 * world = cell * CELL_SIZE - WORLD_HALF + offset
 */
export const CELL_BITS = 9;
export const CELL_SIZE = 1 << CELL_BITS; // 512
export const WORLD_HALF = 16384;

export function cellToWorld(cell: number, offset: number): number {
  return cell * CELL_SIZE - WORLD_HALF + offset;
}

function tryField(entity: { getField: (k: string) => unknown }, ...keys: string[]): unknown {
  for (const key of keys) {
    try {
      const value = entity.getField(key);
      if (value !== undefined && value !== null && value !== '') return value;
    } catch {
      /* field missing */
    }
  }
  return undefined;
}

function asFiniteNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  if (value && typeof value === 'object') {
    const o = value as { value?: unknown };
    if (typeof o.value === 'number' && Number.isFinite(o.value)) return o.value;
  }
  return undefined;
}

type Vec3 = { x: number; y: number; z: number };

function readCells(pawn: { getField: (k: string) => unknown }): Vec3 | null {
  const cellSets: Array<[string, string, string]> = [
    ['CBodyComponent.m_cellX', 'CBodyComponent.m_cellY', 'CBodyComponent.m_cellZ'],
    ['m_CBodyComponent.m_cellX', 'm_CBodyComponent.m_cellY', 'm_CBodyComponent.m_cellZ'],
    [
      'CBodyComponent.m_skeletonInstance.m_vecOrigin.m_cellX',
      'CBodyComponent.m_skeletonInstance.m_vecOrigin.m_cellY',
      'CBodyComponent.m_skeletonInstance.m_vecOrigin.m_cellZ',
    ],
    [
      'CBodyComponent.m_sceneNode.m_vecOrigin.m_cellX',
      'CBodyComponent.m_sceneNode.m_vecOrigin.m_cellY',
      'CBodyComponent.m_sceneNode.m_vecOrigin.m_cellZ',
    ],
    [
      'CBodyComponent.m_skeletonInstance.m_cellX',
      'CBodyComponent.m_skeletonInstance.m_cellY',
      'CBodyComponent.m_skeletonInstance.m_cellZ',
    ],
    [
      'CBodyComponent.m_sceneNode.m_cellX',
      'CBodyComponent.m_sceneNode.m_cellY',
      'CBodyComponent.m_sceneNode.m_cellZ',
    ],
  ];
  for (const [xk, yk, zk] of cellSets) {
    const x = asFiniteNumber(tryField(pawn, xk));
    const y = asFiniteNumber(tryField(pawn, yk));
    const z = asFiniteNumber(tryField(pawn, zk));
    if (x != null && y != null) {
      return { x, y, z: z ?? 0 };
    }
  }
  return null;
}

function readOffsets(pawn: { getField: (k: string) => unknown }): Vec3 | null {
  const pathSets: Array<[string, string, string]> = [
    [
      'CBodyComponent.m_skeletonInstance.m_vecOrigin.m_vecX',
      'CBodyComponent.m_skeletonInstance.m_vecOrigin.m_vecY',
      'CBodyComponent.m_skeletonInstance.m_vecOrigin.m_vecZ',
    ],
    [
      'm_CBodyComponent.m_skeletonInstance.m_vecOrigin.m_vecX',
      'm_CBodyComponent.m_skeletonInstance.m_vecOrigin.m_vecY',
      'm_CBodyComponent.m_skeletonInstance.m_vecOrigin.m_vecZ',
    ],
    [
      'CBodyComponent.m_sceneNode.m_vecOrigin.m_vecX',
      'CBodyComponent.m_sceneNode.m_vecOrigin.m_vecY',
      'CBodyComponent.m_sceneNode.m_vecOrigin.m_vecZ',
    ],
    ['CBodyComponent.m_vecX', 'CBodyComponent.m_vecY', 'CBodyComponent.m_vecZ'],
    ['m_CBodyComponent.m_vecX', 'm_CBodyComponent.m_vecY', 'm_CBodyComponent.m_vecZ'],
  ];

  for (const [xk, yk, zk] of pathSets) {
    const x = asFiniteNumber(tryField(pawn, xk));
    const y = asFiniteNumber(tryField(pawn, yk));
    const z = asFiniteNumber(tryField(pawn, zk)) ?? 0;
    if (x != null && y != null) return { x, y, z };
  }

  const packed = tryField(
    pawn,
    'm_vecAbsOrigin',
    'm_vOrigin',
    'CBodyComponent.m_vecOrigin',
    'CBodyComponent.m_skeletonInstance.m_vecOrigin'
  );
  if (packed && typeof packed === 'object') {
    const o = packed as {
      x?: unknown;
      y?: unknown;
      z?: unknown;
      m_vecX?: unknown;
      m_vecY?: unknown;
      m_vecZ?: unknown;
    };
    const x = asFiniteNumber(o.x ?? o.m_vecX);
    const y = asFiniteNumber(o.y ?? o.m_vecY);
    const z = asFiniteNumber(o.z ?? o.m_vecZ) ?? 0;
    if (x != null && y != null) return { x, y, z };
  }

  return null;
}

/** True world position in Hammer units, or null if unusable. */
export function readPawnOrigin(pawn: {
  getField: (k: string) => unknown;
}): Vec3 | null {
  const offset = readOffsets(pawn);
  if (!offset) return null;

  const cell = readCells(pawn);
  if (cell) {
    return {
      x: cellToWorld(cell.x, offset.x),
      y: cellToWorld(cell.y, offset.y),
      z: cellToWorld(cell.z, offset.z),
    };
  }

  // No cell indices: only accept values that already look like world coords.
  // In-cell offsets alone are typically in [0, CELL_SIZE) and are unusable.
  const maxAbs = Math.max(Math.abs(offset.x), Math.abs(offset.y), Math.abs(offset.z));
  if (maxAbs > CELL_SIZE * 2) {
    return offset;
  }

  return null;
}
