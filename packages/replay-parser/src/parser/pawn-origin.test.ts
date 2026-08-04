import { describe, it, expect } from 'vitest';

// Mirror the field-path strategy used in deadem-extract (keep in sync if paths change)
function readPawnOrigin(pawn: { getField: (k: string) => unknown }): {
  x: number;
  y: number;
  z: number;
} | null {
  const x = pawn.getField('CBodyComponent.m_skeletonInstance.m_vecOrigin.m_vecX');
  const y = pawn.getField('CBodyComponent.m_skeletonInstance.m_vecOrigin.m_vecY');
  const z = pawn.getField('CBodyComponent.m_skeletonInstance.m_vecOrigin.m_vecZ');
  if (typeof x === 'number' && typeof y === 'number') {
    return { x, y, z: typeof z === 'number' ? z : 0 };
  }
  return null;
}

describe('Deadlock pawn origin fields', () => {
  it('reads skeletonInstance vecOrigin components', () => {
    const pawn = {
      getField: (k: string) => {
        const map: Record<string, number> = {
          'CBodyComponent.m_skeletonInstance.m_vecOrigin.m_vecX': 1200,
          'CBodyComponent.m_skeletonInstance.m_vecOrigin.m_vecY': -400,
          'CBodyComponent.m_skeletonInstance.m_vecOrigin.m_vecZ': 64,
        };
        return map[k];
      },
    };
    expect(readPawnOrigin(pawn)).toEqual({ x: 1200, y: -400, z: 64 });
  });

  it('returns null when abs-origin-only (legacy) is missing skeleton paths', () => {
    const pawn = {
      getField: (k: string) => (k === 'm_vecAbsOrigin' ? { x: 1, y: 2, z: 3 } : undefined),
    };
    // This unit test documents that skeleton paths are required for the primary path;
    // full fallback coverage lives in deadem-extract.readPawnOrigin.
    expect(readPawnOrigin(pawn)).toBeNull();
  });
});
