import { describe, it, expect } from 'vitest';
import { detectMistakes } from './mistake-detector.js';
import { scoreToGrade } from './score-engine.js';
import { buildReportFromPipeline } from '../pipeline/coaching-pipeline.js';
import { extractFeatures } from '@clutchcore/replay-parser';
import type { ParsedReplay } from '@clutchcore/shared';

const mockReplay: ParsedReplay = {
  metadata: {
    map: 'dl_test',
    date: new Date().toISOString(),
    durationSeconds: 1800,
    gameMode: 'standard',
    version: '1.0',
    players: [{
      steamId: 'subject', name: 'Player', hero: 'test_hero',
      team: 'team_a', kills: 5, deaths: 3, assists: 7, isSubject: true,
    }],
  },
  subjectPlayerId: 'subject',
  positions: [],
  events: [],
  teamFights: [],
  economy: [],
  abilityUpgrades: [],
  itemPurchases: [],
  extractionConfidence: 'minimal',
  parserNotes: ['Test parser note'],
};

describe('Mistake Detector', () => {
  it('detects mistakes with coaching structure', () => {
    const features = extractFeatures(mockReplay);
    const mistakes = detectMistakes(mockReplay, features);
    expect(mistakes.length).toBeGreaterThan(0);
    expect(mistakes[0]).toHaveProperty('whatHappened');
    expect(mistakes[0]).toHaveProperty('alternativePlay');
    expect(mistakes[0]).toHaveProperty('drills');
  });
});

describe('Score Engine', () => {
  it('converts scores to letter grades', () => {
    expect(scoreToGrade(95)).toBe('A+');
    expect(scoreToGrade(87)).toBe('A');
    expect(scoreToGrade(40)).toBe('F');
  });
});

describe('Coaching Pipeline', () => {
  it('generates a full coaching report', () => {
    const report = buildReportFromPipeline('test-replay', mockReplay);
    expect(report.overallGrade).toBeDefined();
    expect(report.improvementPlan).toBeDefined();
    expect(report.topPriorities).toHaveLength(3);
    expect(report.estimatedSections.length).toBeGreaterThan(0);
  });
});
