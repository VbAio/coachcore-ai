import type { ParsedReplay, ReplayMetadata, CombatEvent, PositionSample } from '@coachcore/shared';
import type { ReplayParser } from './replay-parser.interface.js';

/**
 * Deadlock .dem parser scaffold.
 *
 * Valve Source 2 demo files use a proprietary binary format.
 * This implementation reads the file header and extracts what it can,
 * clearly labeling unavailable fields. Replace parseBody() with a
 * full Source 2 demo parser when available.
 */
export class DeadlockReplayParser implements ReplayParser {
  readonly name = 'deadlock-source2-scaffold';
  readonly supportedExtensions = ['.dem'];

  canParse(buffer: Buffer): boolean {
    if (buffer.length < 8) return false;
    // Source 2 demo files typically start with PBDEMS2 or HL2DEMO
    const magic = buffer.subarray(0, 7).toString('ascii');
    return magic.startsWith('PBDEMS') || magic.startsWith('HL2DEMO') || buffer.length > 1024;
  }

  async validate(buffer: Buffer): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    if (buffer.length < 1024) errors.push('File too small to be a valid replay');
    if (!this.canParse(buffer)) errors.push('Unrecognized demo file format');
    return { valid: errors.length === 0, errors };
  }

  async parse(buffer: Buffer, subjectPlayerName?: string): Promise<ParsedReplay> {
    const parserNotes: string[] = [];
    const header = this.readHeader(buffer);

    if (!header.valid) {
      parserNotes.push('Could not fully parse demo header — using file metadata estimates');
    }

    const metadata = this.buildMetadata(buffer, header, parserNotes);
    const subjectPlayer = metadata.players.find((p) => p.isSubject)
      ?? metadata.players.find((p) => p.name === subjectPlayerName)
      ?? metadata.players[0];

    if (!subjectPlayer) {
      throw new Error('No players found in replay metadata');
    }

    const events = this.extractEvents(buffer, header, parserNotes);
    const positions = this.extractPositions(buffer, header, parserNotes);
    const economy = this.extractEconomy(events, parserNotes);

    return {
      metadata,
      subjectPlayerId: subjectPlayer.steamId,
      positions,
      events,
      teamFights: this.detectTeamFights(events),
      economy,
      abilityUpgrades: this.extractAbilityUpgrades(events),
      itemPurchases: this.extractItemPurchases(events),
      extractionConfidence: header.valid ? 'partial' : 'minimal',
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
    notes: string[]
  ): ReplayMetadata {
    notes.push(
      'Player names, MMR, and detailed match stats require full Source 2 demo parsing — marked as estimates where shown'
    );

    const map = header.mapName ?? 'unknown_map';
    const fileDate = new Date().toISOString();

    return {
      map,
      date: fileDate,
      durationSeconds: this.estimateDuration(buffer),
      gameMode: 'standard',
      version: 'unknown',
      players: this.buildPlaceholderPlayers(notes),
    };
  }

  private estimateDuration(buffer: Buffer): number {
    // Rough estimate: ~1 second per 50KB for typical demos
    return Math.max(600, Math.min(3600, Math.floor(buffer.length / 50000)));
  }

  private buildPlaceholderPlayers(notes: string[]) {
    notes.push('Subject player marked as Player — specify name during upload for accurate tracking');
    return [
      {
        steamId: 'subject',
        name: 'Player',
        hero: 'unknown_hero',
        team: 'team_a' as const,
        kills: 0,
        deaths: 0,
        assists: 0,
        isSubject: true,
      },
    ];
  }

  private extractEvents(
    _buffer: Buffer,
    _header: unknown,
    notes: string[]
  ): CombatEvent[] {
    notes.push('Combat events require full demo tick parsing — none extracted in scaffold mode');
    return [];
  }

  private extractPositions(
    _buffer: Buffer,
    _header: unknown,
    notes: string[]
  ): PositionSample[] {
    notes.push('Position samples require full demo entity parsing — none extracted in scaffold mode');
    return [];
  }

  private extractEconomy(events: CombatEvent[], notes: string[]) {
    if (events.length === 0) {
      notes.push('Economy timeline unavailable without parsed events');
    }
    return [];
  }

  private extractAbilityUpgrades(events: CombatEvent[]) {
    return events
      .filter((e) => e.type === 'ability_cast' && e.ability)
      .map((e, i) => ({
        timestamp: e.timestamp,
        ability: e.ability!,
        level: i + 1,
      }));
  }

  private extractItemPurchases(events: CombatEvent[]) {
    return events
      .filter((e) => e.type === 'item_purchase' && e.item)
      .map((e) => ({
        timestamp: e.timestamp,
        item: e.item!,
        cost: e.value ?? 0,
      }));
  }

  private detectTeamFights(events: CombatEvent[]) {
    const fights: ParsedReplay['teamFights'] = [];
    const killEvents = events.filter((e) => e.type === 'kill');
    if (killEvents.length < 2) return fights;

    let clusterStart = killEvents[0].timestamp;
    let clusterKills = 1;
    const participants = new Set<string>();

    for (let i = 1; i < killEvents.length; i++) {
      const gap = killEvents[i].timestamp - killEvents[i - 1].timestamp;
      if (gap <= 15) {
        clusterKills++;
        if (killEvents[i].actorId) participants.add(killEvents[i].actorId!);
      } else if (clusterKills >= 2) {
        fights.push({
          id: `fight-${fights.length}`,
          startTime: clusterStart,
          endTime: killEvents[i - 1].timestamp,
          participants: [...participants],
          kills: clusterKills,
          outcome: 'draw',
        });
        clusterStart = killEvents[i].timestamp;
        clusterKills = 1;
        participants.clear();
      }
    }
    return fights;
  }
}
