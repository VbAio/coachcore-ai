import { describe, it, expect } from 'vitest';
import { analyzeBuild } from './item-analyzer.js';
import type { ParsedReplay } from '@clutchcore/shared';

const replay: ParsedReplay = {
  metadata: {
    map: 'map',
    date: new Date().toISOString(),
    durationSeconds: 1200,
    gameMode: 'standard',
    version: 'test',
    players: [
      {
        steamId: '111',
        name: 'Alice',
        hero: 'Haze',
        team: 'team_a',
        kills: 5,
        deaths: 2,
        assists: 3,
        isSubject: true,
      },
    ],
  },
  subjectPlayerId: '111',
  positions: [],
  events: [
    {
      eventId: 'buy-1',
      timestamp: 120,
      type: 'item_purchase',
      item: 'Sprint Boots',
      value: 800,
      actorId: '111',
    },
    {
      eventId: 'buy-2',
      timestamp: 280,
      type: 'item_purchase',
      item: 'Mystic Burst',
      value: 800,
      actorId: '111',
    },
    {
      eventId: 'kill-1',
      timestamp: 300,
      type: 'kill',
      actorId: '111',
      targetId: '222',
    },
  ],
  teamFights: [],
  economy: [],
  abilityUpgrades: [],
  itemPurchases: [
    { timestamp: 120, item: 'Sprint Boots', cost: 800, actorId: '111', eventId: 'buy-1' },
    { timestamp: 280, item: 'Mystic Burst', cost: 800, actorId: '111', eventId: 'buy-2' },
  ],
  extractionConfidence: 'partial',
  parserNotes: [],
};

describe('analyzeBuild', () => {
  it('scores purchases and builds a review', () => {
    const review = analyzeBuild(replay);
    expect(review.purchases.length).toBe(2);
    expect(review.purchases[0].itemName).toBe('Sprint Boots');
    expect(review.purchases[0].category).toBe('Vitality');
    expect(review.purchases[1].itemName).toBe('Mystic Burst');
    expect(review.overallScore).toBeGreaterThan(0);
    expect(review.phases.some((p) => p.itemNames.length > 0)).toBe(true);
    expect(review.comparisons.length).toBeGreaterThan(0);
  });
});
