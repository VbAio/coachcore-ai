import { describe, it, expect } from 'vitest';
import { DeadlockReplayParser } from './deadlock-parser.js';

describe('DeadlockReplayParser', () => {
  const parser = new DeadlockReplayParser();

  it('validates minimum file size', async () => {
    const result = await parser.validate(Buffer.alloc(100));
    expect(result.valid).toBe(false);
  });

  it('parses a buffer and returns structured replay', async () => {
    const buffer = Buffer.alloc(50000);
    buffer.write('PBDEMS2', 0, 'ascii');
    const replay = await parser.parse(buffer);
    expect(replay.metadata).toBeDefined();
    expect(replay.extractionConfidence).toBeDefined();
    expect(replay.parserNotes.length).toBeGreaterThan(0);
  });

  it('labels incomplete data in parser notes', async () => {
    const buffer = Buffer.alloc(50000);
    buffer.write('PBDEMS2', 0, 'ascii');
    const replay = await parser.parse(buffer);
    expect(
      replay.parserNotes.some(
        (n) =>
          n.toLowerCase().includes('estimate') ||
          n.toLowerCase().includes('parsing') ||
          n.toLowerCase().includes('deadem') ||
          n.toLowerCase().includes('scaffold')
      )
    ).toBe(true);
  });

  it('accepts subjectId for scaffold fallback', async () => {
    const buffer = Buffer.alloc(50000);
    buffer.write('PBDEMS2', 0, 'ascii');
    const replay = await parser.parse(buffer, '76561198000000000');
    expect(replay.subjectPlayerId).toBeTruthy();
    expect(replay.metadata.players.some((p) => p.isSubject)).toBe(true);
  });
});
