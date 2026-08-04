import { describe, it, expect } from 'vitest';
import { extractFeatures } from '@coachcore/replay-parser';
import { assertEvidenceBacked, detectMistakes } from './mistake-detector.js';
import { buildReportFromPipeline } from '../pipeline/coaching-pipeline.js';
import { OpenAICoachProvider } from '../coach/openai-coach-provider.js';
import { buildMatchTimeline, type ParsedReplay } from '@coachcore/shared';

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
        hero: 'Haze',
        team: 'team_a',
        kills: 8,
        deaths: 4,
        assists: 6,
        isSubject: true,
      },
      {
        steamId: '222',
        name: 'Bob',
        hero: 'Bebop',
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
    { timestamp: 60, x: 100, y: 200, z: 0, playerId: '111' },
    { timestamp: 90, x: 120, y: 210, z: 0, playerId: '111' },
    { timestamp: 90, x: 140, y: 180, z: 0, playerId: '222' },
    { timestamp: 120, x: 150, y: 220, z: 0, playerId: '111' },
  ],
  events: [
    {
      eventId: 'evt-1-death-90',
      timestamp: 90,
      type: 'death',
      actorId: '222',
      targetId: '111',
      position: { x: 120, y: 210, z: 0 },
    },
    {
      eventId: 'evt-2-kill-95',
      timestamp: 95,
      type: 'kill',
      actorId: '222',
      targetId: '111',
      position: { x: 120, y: 210, z: 0 },
    },
    {
      eventId: 'evt-3-kill-200',
      timestamp: 200,
      type: 'kill',
      actorId: '111',
      targetId: '222',
      position: { x: 150, y: 220, z: 0 },
    },
    {
      eventId: 'evt-4-death-210',
      timestamp: 210,
      type: 'death',
      actorId: '111',
      targetId: '222',
    },
    {
      eventId: 'evt-5-death-400',
      timestamp: 400,
      type: 'death',
      actorId: '222',
      targetId: '111',
    },
    {
      eventId: 'evt-6-kill-405',
      timestamp: 405,
      type: 'kill',
      actorId: '222',
      targetId: '111',
    },
    {
      eventId: 'evt-7-objective-500',
      timestamp: 500,
      type: 'objective',
      value: 2,
    },
    {
      eventId: 'evt-8-ability-600',
      timestamp: 600,
      type: 'ability_cast',
      actorId: '111',
      ability: 'Dash',
    },
    {
      eventId: 'evt-9-item-300',
      timestamp: 300,
      type: 'item_purchase',
      item: 'Extra Health',
      actorId: '111',
    },
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
  itemPurchases: [{ timestamp: 300, item: 'Extra Health', cost: 0, actorId: '111' }],
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

  it('requires relatedEventIds on every non-estimate insight', () => {
    const features = extractFeatures(realEventsReplay);
    const mistakes = detectMistakes(realEventsReplay, features);
    expect(assertEvidenceBacked(mistakes)).toBe(true);
    for (const m of mistakes.filter((x) => !x.isEstimate)) {
      expect(m.relatedEventIds?.length).toBeGreaterThan(0);
      expect(m.whatHappened.length).toBeGreaterThan(10);
      expect(m.alternativePlay.length).toBeGreaterThan(10);
    }
  });

  it('builds a seekable MatchTimeline with tagged tracks', () => {
    const tl = buildMatchTimeline(realEventsReplay, 'replay-1');
    expect(tl.version).toBe(1);
    expect(tl.events.length).toBeGreaterThan(0);
    expect(tl.events.every((e) => e.eventId)).toBe(true);
    expect(tl.tracks.some((t) => t.playerId === '111' && t.samples.length > 0)).toBe(true);
    expect(tl.teamFights[0]?.outcome).toBe('lost');
  });

  it('generates a report with parser confidence notes', () => {
    const report = buildReportFromPipeline('real-events', realEventsReplay);
    expect(report.extractionConfidence).toBe('partial');
    expect(report.parserNotes?.length).toBeGreaterThan(0);
    expect(report.timeline.length).toBeGreaterThan(0);
    expect(report.overallGrade).toBeDefined();
    expect(report.estimatedSections).toContain('economyAnalysis');
  });

  it('OpenAI provider falls back to rule report without API key', async () => {
    const provider = new OpenAICoachProvider({});
    const features = extractFeatures(realEventsReplay);
    const report = await provider.generateReport(realEventsReplay, features, 'no-key');
    expect(report.overallScore).toBeGreaterThan(0);
    expect(report.parserNotes).toBeDefined();
  });
});
