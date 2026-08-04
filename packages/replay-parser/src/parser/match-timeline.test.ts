import { describe, it, expect } from 'vitest';
import { buildMatchTimeline, type ParsedReplay } from '@coachcore/shared';

describe('buildMatchTimeline', () => {
  it('assigns labels and groups position tracks by playerId', () => {
    const replay: ParsedReplay = {
      metadata: {
        map: 'map_a',
        date: new Date().toISOString(),
        durationSeconds: 600,
        gameMode: 'standard',
        version: 'test',
        players: [
          {
            steamId: 's1',
            name: 'Subject',
            hero: 'Abrams',
            team: 'team_a',
            kills: 1,
            deaths: 1,
            assists: 0,
            isSubject: true,
          },
          {
            steamId: 'e1',
            name: 'Enemy',
            hero: 'Haze',
            team: 'team_b',
            kills: 1,
            deaths: 1,
            assists: 0,
            isSubject: false,
          },
        ],
      },
      subjectPlayerId: 's1',
      positions: [
        { timestamp: 10, x: 1, y: 2, z: 0, playerId: 's1' },
        { timestamp: 20, x: 3, y: 4, z: 0, playerId: 's1' },
        { timestamp: 15, x: 9, y: 8, z: 0, playerId: 'e1' },
      ],
      events: [
        {
          eventId: 'evt-kill',
          timestamp: 30,
          type: 'kill',
          actorId: 's1',
          targetId: 'e1',
          position: { x: 5, y: 5, z: 0 },
        },
        {
          eventId: 'evt-death',
          timestamp: 30,
          type: 'death',
          actorId: 's1',
          targetId: 'e1',
        },
      ],
      teamFights: [],
      economy: [],
      abilityUpgrades: [],
      itemPurchases: [],
      extractionConfidence: 'full',
      parserNotes: [],
    };

    const tl = buildMatchTimeline(replay, 'r1');
    expect(tl.replayId).toBe('r1');
    expect(tl.tracks).toHaveLength(2);
    expect(tl.events.find((e) => e.type === 'kill')?.label).toContain('killed');
    expect(tl.events[0].eventId).toBeTruthy();
  });
});
