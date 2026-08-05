import { describe, it, expect } from 'vitest';
import { CELL_SIZE, WORLD_HALF, cellToWorld, readPawnOrigin } from './pawn-origin.js';

describe('cellToWorld', () => {
  it('matches Source 2 / boon-deadlock constants', () => {
    expect(CELL_SIZE).toBe(512);
    expect(WORLD_HALF).toBe(16384);
    expect(cellToWorld(32, 0)).toBe(0);
    expect(cellToWorld(32, 256)).toBe(256);
    expect(cellToWorld(0, 0)).toBe(-WORLD_HALF);
  });
});

describe('readPawnOrigin', () => {
  it('combines cell index with in-cell offset into world coords', () => {
    const pawn = {
      getField: (k: string) => {
        const map: Record<string, number> = {
          'CBodyComponent.m_cellX': 32,
          'CBodyComponent.m_cellY': 30,
          'CBodyComponent.m_cellZ': 35,
          'CBodyComponent.m_skeletonInstance.m_vecOrigin.m_vecX': 120,
          'CBodyComponent.m_skeletonInstance.m_vecOrigin.m_vecY': 400,
          'CBodyComponent.m_skeletonInstance.m_vecOrigin.m_vecZ': 64,
        };
        return map[k];
      },
    };
    // world = cell * 512 - 16384 + offset
    expect(readPawnOrigin(pawn)).toEqual({
      x: 32 * 512 - 16384 + 120, // 120
      y: 30 * 512 - 16384 + 400, // -1624
      z: 35 * 512 - 16384 + 64, // 1600
    });
  });

  it('rejects in-cell offsets when cell indices are missing', () => {
    const pawn = {
      getField: (k: string) => {
        const map: Record<string, number> = {
          'CBodyComponent.m_skeletonInstance.m_vecOrigin.m_vecX': 120,
          'CBodyComponent.m_skeletonInstance.m_vecOrigin.m_vecY': 400,
          'CBodyComponent.m_skeletonInstance.m_vecOrigin.m_vecZ': 64,
        };
        return map[k];
      },
    };
    expect(readPawnOrigin(pawn)).toBeNull();
  });

  it('accepts already-absolute coords when cells are missing', () => {
    const pawn = {
      getField: (k: string) => {
        const map: Record<string, number> = {
          'CBodyComponent.m_skeletonInstance.m_vecOrigin.m_vecX': 2400,
          'CBodyComponent.m_skeletonInstance.m_vecOrigin.m_vecY': -4100,
          'CBodyComponent.m_skeletonInstance.m_vecOrigin.m_vecZ': 1504,
        };
        return map[k];
      },
    };
    expect(readPawnOrigin(pawn)).toEqual({ x: 2400, y: -4100, z: 1504 });
  });
});
