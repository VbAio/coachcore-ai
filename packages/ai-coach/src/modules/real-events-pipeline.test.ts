import { describe, it, expect } from 'vitest';
import { extractFeatures } from '@coachcore/replay-parser';
import { detectMistakes } from './mistake-detector.js';
import { buildReportFromPipeline } from '../pipeline/coaching-pipeline.js';
import { OpenAICoachProvider } from '../coach/openai-coach-provider.js';
import type { ParsedReplay } from '@coachcore/shared';

const realEventsReplay: ParsedReplay = {
  metadata: {
    map: 'street_test',
    date: new Date().toISOString(),
    durationSeconds: 1200,
    gameMode: 'standard',
    version: 'deadem',
    players: [
      {
        steamId: '111',
        name: 'Alice',
        hero: 'hero_1',
        team: 'team_a',
        kills: 8,
        deaths: 4,
        assists: 6,
        isSubject: true,
      },
      {
        steamId: '222',
        name: 'Bob',
        hero: 'hero_2',
        team: 'team_b',
        kills: 4,
        deaths: 8,
        assists: 3,
        isSubject: false,
      },
    ],
  },
  subjectPlayerId: '111',
  positions: [
    { timestamp: 60, x: 100, y: 200, z: 0 },
    { timestamp: 120, x: 150, y: 220, z: 0 },
  ],
  events: [
    { timestamp: 90, type: 'death', actorId: '222', targetId: '111' },
    { timestamp: 95, type: 'kill', actorId: '222', targetId: '111' },
    { timestamp: 200, type: 'kill', actorId: '111', targetId: '222' },
    { timestamp: 210, type: 'death', actorId: '111', targetId: '222' },
    { timestamp: 400, type: 'death', actorId: '222', targetId: '111' },
    { timestamp: 405, type: 'kill', actorId: '222', targetId: '111' },
    { timestamp: 500, type: 'objective', value: 2 },
    { timestamp: 600, type: 'ability_cast', actorId: '111', ability: 'Dash' },
  ],
  teamFights: [
    {
      id: 'fight-0',
      startTime: 90,
      endTime: 100,
      participants: ['111', '222'],
      kills: 2,
      outcome: 'lost',
    },
  ],
  economy: [],
  abilityUpgrades: [],
  itemPurchases: [],
  extractionConfidence: 'partial',
  parserNotes: ['Steam IDs from USER_INFO'],
};

describe('Real-events coaching pipeline', () => {
  it('builds non-estimate death insights from parsed events', () => {
    const features = extractFeatures(realEventsReplay);
    expect(features.isEstimate).toBe(false);
    expect(features.deathTimestamps.length).toBeGreaterThan(0);

    const mistakes = detectMistakes(realEventsReplay, features);
    expect(mistakes.some((m) => !m.isEstimate && m.title.toLowerCase().includes('death'))).toBe(
      true
    );
  });

  it('generates a report with parser confidence notes', () => {
    const report = buildReportFromPipeline('real-events', realEventsReplay);
    expect(report.extractionConfidence).toBe('partial');
    expect(report.parserNotes?.length).toBeGreaterThan(0);
    expect(report.timeline.length).toBeGreaterThan(0);
    expect(report.overallGrade).toBeDefined();
  });

  it('OpenAI provider falls back to rule report without API key', async () => {
    const provider = new OpenAICoachProvider({});
    const features = extractFeatures(realEventsReplay);
    const report = await provider.generateReport(realEventsReplay, features, 'no-key');
    expect(report.overallScore).toBeGreaterThan(0);
    expect(report.parserNotes).toBeDefined();
  });
});
