import type { ParsedReplay, ReplayMetadata, CombatEvent, PositionSample } from '@coachcore/shared';
import type { ReplayParser } from './replay-parser.interface.js';
import { extractWithDeadem } from './deadem-extract.js';

/**
 * Deadlock .dem parser backed by deadem, with a minimal scaffold fallback
 * when the binary cannot be fully decoded.
 */
export class DeadlockReplayParser implements ReplayParser {
  readonly name = 'deadlock-deadem';
  readonly supportedExtensions = ['.dem'];

  canParse(buffer: Buffer): boolean {
    if (buffer.length < 8) return false;
    const magic = buffer.subarray(0, 7).toString('ascii');
    return magic.startsWith('PBDEMS') || magic.startsWith('HL2DEMO') || buffer.length > 1024;
  }

  async validate(buffer: Buffer): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    if (buffer.length < 1024) errors.push('File too small to be a valid replay');
    if (!this.canParse(buffer)) errors.push('Unrecognized demo file format');
    return { valid: errors.length === 0, errors };
  }

  /**
   * @param subjectId Optional Steam ID or player name for the coached player
   */
  async parse(buffer: Buffer, subjectId?: string): Promise<ParsedReplay> {
    try {
      return await extractWithDeadem(buffer, subjectId);
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      return this.scaffoldParse(buffer, subjectId, [
        `deadem parse failed (${reason}) — using scaffold estimates`,
      ]);
    }
  }

  private scaffoldParse(
    buffer: Buffer,
    subjectId: string | undefined,
    extraNotes: string[]
  ): ParsedReplay {
    const parserNotes: string[] = [...extraNotes];
    const header = this.readHeader(buffer);

    if (!header.valid) {
      parserNotes.push('Could not fully parse demo header — using file metadata estimates');
    }

    const metadata = this.buildMetadata(buffer, header, parserNotes, subjectId);
    const subjectPlayer =
      metadata.players.find((p) => p.isSubject) ?? metadata.players[0];

    if (!subjectPlayer) {
      throw new Error('No players found in replay metadata');
    }

    const events = this.extractEvents(parserNotes);
    const positions = this.extractPositions(parserNotes);

    return {
      metadata,
      subjectPlayerId: subjectPlayer.steamId,
      positions,
      events,
      teamFights: [],
      economy: [],
      abilityUpgrades: [],
      itemPurchases: [],
      extractionConfidence: 'minimal',
      parserNotes,
    };
  }

  private readHeader(buffer: Buffer): { valid: boolean; demoVersion?: string; mapName?: string } {
    try {
      const magic = buffer.subarray(0, 8).toString('ascii').replace(/\0/g, '');
      if (magic.startsWith('PBDEMS') || magic.startsWith('HL2DEMO')) {
        return {
          valid: true,
          demoVersion: magic,
          mapName: this.scanForString(buffer, 'de_') ?? this.scanForString(buffer, 'dl_'),
        };
      }
    } catch {
      /* fall through */
    }
    return { valid: false };
  }

  private scanForString(buffer: Buffer, prefix: string): string | undefined {
    const text = buffer.toString('latin1');
    const match = text.match(new RegExp(`${prefix}[a-z0-9_]+`, 'i'));
    return match?.[0];
  }

  private buildMetadata(
    buffer: Buffer,
    header: { valid: boolean; mapName?: string },
    notes: string[],
    subjectId?: string
  ): ReplayMetadata {
    notes.push(
      'Player names, MMR, and detailed match stats require successful deadem parsing — marked as estimates where shown'
    );

    const steamId = subjectId && /^\d+$/.test(subjectId) ? subjectId : subjectId ?? 'subject';
    const name =
      subjectId && !/^\d+$/.test(subjectId) ? subjectId : 'Player';

    return {
      map: header.mapName ?? 'unknown_map',
      date: new Date().toISOString(),
      durationSeconds: Math.max(600, Math.min(3600, Math.floor(buffer.length / 50000))),
      gameMode: 'standard',
      version: 'unknown',
      players: [
        {
          steamId,
          name,
          hero: 'unknown_hero',
          team: 'team_a',
          kills: 0,
          deaths: 0,
          assists: 0,
          isSubject: true,
        },
      ],
    };
  }

  private extractEvents(notes: string[]): CombatEvent[] {
    notes.push('Combat events require full demo tick parsing — none extracted in scaffold mode');
    return [];
  }

  private extractPositions(notes: string[]): PositionSample[] {
    notes.push('Position samples require full demo entity parsing — none extracted in scaffold mode');
    return [];
  }
}
