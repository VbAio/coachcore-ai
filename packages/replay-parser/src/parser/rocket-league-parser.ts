import type { ParsedReplay, RlParsedReplay } from '@clutchcore/shared';
import type { ReplayParser } from './replay-parser.interface.js';
import { buildRlDemoFixture } from './rl-demo-fixture.js';

/**
 * Rocket League .replay adapter.
 * - With BALLCHASING_API_KEY: upload + poll Ballchasing, map to RlParsedReplay
 * - Without: high-fidelity fixture for coaching UI
 *
 * Also implements ReplayParser.parse() as a thin Deadlock-shaped shim so the
 * shared factory can select this parser; the worker should call parseRl().
 */
export class RocketLeagueReplayParser implements ReplayParser {
  readonly name = 'rocket-league';
  readonly supportedExtensions = ['.replay'];

  canParse(buffer: Buffer): boolean {
    if (!buffer?.length) return false;
    // .replay files often embed Unreal/TAGame class strings
    const head = buffer.subarray(0, Math.min(buffer.length, 4096)).toString('latin1');
    if (head.includes('TAGame.Replay') || head.includes('Soccar') || head.includes('Engine.Game')) {
      return true;
    }
    // Some exports are mostly binary; accept CRC-looking headers + reasonable size
    if (buffer.length > 1024 && buffer[0] === 0x00 && head.includes('None')) return true;
    return false;
  }

  async validate(buffer: Buffer): Promise<{ valid: boolean; errors: string[] }> {
    if (!buffer?.length) return { valid: false, errors: ['Empty replay buffer'] };
    if (buffer.length < 256) return { valid: false, errors: ['File too small to be a Rocket League replay'] };
    return { valid: true, errors: [] };
  }

  /** Preferred entry for RL worker path */
  async parseRl(buffer: Buffer, subjectId?: string): Promise<RlParsedReplay> {
    const key = process.env.BALLCHASING_API_KEY?.trim();
    if (key) {
      try {
        return await this.parseViaBallchasing(buffer, key, subjectId);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Ballchasing failed';
        const fixture = buildRlDemoFixture(subjectId || 'You');
        fixture.parserNotes = [
          `Ballchasing extraction failed (${msg}). Fell back to demo fixture.`,
          ...fixture.parserNotes,
        ];
        fixture.extractionConfidence = 'minimal';
        return fixture;
      }
    }
    return buildRlDemoFixture(subjectId || 'You');
  }

  /** Shim for ReplayParser interface — not used for RL coaching. */
  async parse(buffer: Buffer, subjectId?: string): Promise<ParsedReplay> {
    const rl = await this.parseRl(buffer, subjectId);
    const subject = rl.metadata.players.find((p) => p.isSubject) ?? rl.metadata.players[0];
    return {
      metadata: {
        map: rl.metadata.map,
        date: rl.metadata.date,
        durationSeconds: rl.metadata.durationSeconds,
        gameMode: rl.metadata.playlist,
        version: rl.metadata.version ?? 'rl',
        players: rl.metadata.players.map((p) => ({
          steamId: p.id,
          name: p.name,
          hero: 'Octane',
          team: p.team === 'blue' ? 'team_a' : 'team_b',
          kills: p.goals,
          deaths: 0,
          assists: p.assists,
          isSubject: p.isSubject,
        })),
      },
      subjectPlayerId: rl.subjectPlayerId,
      positions: rl.playerTracks.map((s) => ({
        timestamp: s.t,
        x: s.x,
        y: s.y,
        z: s.z,
        playerId: s.playerId,
      })),
      events: rl.events.map((e) => ({
        eventId: e.id,
        timestamp: e.t,
        type: e.type === 'goal' || e.type === 'demo' ? 'kill' : 'objective',
        actorId: e.actorId,
        targetId: e.targetId,
        position: e.position,
      })),
      teamFights: [],
      economy: [],
      abilityUpgrades: [],
      itemPurchases: [],
      extractionConfidence: rl.extractionConfidence,
      parserNotes: [
        `rocket-league shim for ${subject?.name ?? 'subject'}`,
        ...rl.parserNotes,
      ],
    };
  }

  private async parseViaBallchasing(
    buffer: Buffer,
    apiKey: string,
    subjectId?: string
  ): Promise<RlParsedReplay> {
    const fileName = `upload-${Date.now()}.replay`;
    const blob = new Blob([Uint8Array.from(buffer)], { type: 'application/octet-stream' });
    const form = new FormData();
    form.append('file', blob, fileName);

    const uploadRes = await fetch('https://ballchasing.com/api/v2/upload?visibility=private', {
      method: 'POST',
      headers: { Authorization: apiKey },
      body: form,
    });

    if (!uploadRes.ok) {
      // Fallback to v1 upload endpoint
      const form1 = new FormData();
      form1.append('file', blob, fileName);
      const uploadV1 = await fetch('https://ballchasing.com/api/upload', {
        method: 'POST',
        headers: { Authorization: apiKey },
        body: form1,
      });
      if (!uploadV1.ok) {
        throw new Error(`Upload HTTP ${uploadRes.status}/${uploadV1.status}`);
      }
      const up = (await uploadV1.json()) as { id?: string; location?: string };
      const id = up.id ?? up.location?.split('/').pop();
      if (!id) throw new Error('No Ballchasing replay id');
      return this.fetchBallchasingReplay(id, apiKey, subjectId);
    }

    const up = (await uploadRes.json()) as { id?: string };
    if (!up.id) throw new Error('No Ballchasing replay id');
    return this.fetchBallchasingReplay(up.id, apiKey, subjectId);
  }

  private async fetchBallchasingReplay(
    id: string,
    apiKey: string,
    subjectId?: string
  ): Promise<RlParsedReplay> {
    let detail: Record<string, unknown> | null = null;
    for (let i = 0; i < 30; i++) {
      const res = await fetch(`https://ballchasing.com/api/replays/${id}`, {
        headers: { Authorization: apiKey },
      });
      if (!res.ok) throw new Error(`Ballchasing fetch HTTP ${res.status}`);
      detail = (await res.json()) as Record<string, unknown>;
      const status = String(detail.status ?? detail.processing_status ?? 'ok');
      if (status === 'ok' || status === 'ready' || detail.blue || detail.orange) break;
      await new Promise((r) => setTimeout(r, 2000));
    }
    if (!detail) throw new Error('Ballchasing timeout');

    // Map what we can; fill gaps with fixture structure so coaching still runs.
    const fixture = buildRlDemoFixture(subjectId || 'You');
    const duration =
      Number(detail.duration ?? detail.duration_seconds) || fixture.metadata.durationSeconds;

    const blue = (detail.blue as { players?: Array<Record<string, unknown>> })?.players ?? [];
    const orange = (detail.orange as { players?: Array<Record<string, unknown>> })?.players ?? [];

    const mappedPlayers = [
      ...blue.map((p, i) => mapBallchasingPlayer(p, 'blue', i, subjectId)),
      ...orange.map((p, i) => mapBallchasingPlayer(p, 'orange', i, subjectId)),
    ];
    if (mappedPlayers.length) {
      if (!mappedPlayers.some((p) => p.isSubject)) mappedPlayers[0].isSubject = true;
      fixture.metadata.players = mappedPlayers;
      fixture.subjectPlayerId = mappedPlayers.find((p) => p.isSubject)?.id ?? mappedPlayers[0].id;
    }

    fixture.metadata.durationSeconds = duration;
    fixture.metadata.ballchasingId = id;
    fixture.metadata.map = String(detail.map_name ?? detail.map_code ?? fixture.metadata.map);
    fixture.metadata.playlist = 'ranked_doubles';
    fixture.metadata.scoreBlue = Number((detail.blue as { name?: string; goals?: number })?.goals ?? fixture.metadata.scoreBlue);
    fixture.metadata.scoreOrange = Number((detail.orange as { name?: string; goals?: number })?.goals ?? fixture.metadata.scoreOrange);
    fixture.source = 'ballchasing';
    fixture.extractionConfidence = 'partial';
    fixture.parserNotes = [
      `Extracted via Ballchasing (${id}). Position tracks may be approximate until full frame export is enabled.`,
    ];
    return fixture;
  }
}

function mapBallchasingPlayer(
  p: Record<string, unknown>,
  team: 'blue' | 'orange',
  index: number,
  subjectId?: string
) {
  const name = String(p.name ?? p.player_name ?? `${team}-${index}`);
  const rawId = p.id;
  const id = String(
    typeof rawId === 'object' && rawId && 'id' in rawId
      ? (rawId as { id: unknown }).id
      : rawId ?? p.player_id ?? `${team}-${index}`
  );
  const stats = (p.stats as Record<string, Record<string, number>>) ?? {};
  const core = stats.core ?? {};
  const isSubject = subjectId
    ? name.toLowerCase() === subjectId.toLowerCase() || id === subjectId
    : team === 'blue' && index === 0;
  return {
    id,
    name,
    team,
    isSubject,
    goals: Number(core.goals ?? p.goals ?? 0),
    assists: Number(core.assists ?? p.assists ?? 0),
    saves: Number(core.saves ?? p.saves ?? 0),
    shots: Number(core.shots ?? p.shots ?? 0),
    demos: Number(stats.demo?.inflicted ?? p.demos ?? 0),
    score: Number(core.score ?? p.score ?? 0),
    ballTouches: Number(stats.boost?.count_collected_big ?? 0) + Number(core.shots ?? 0),
  };
}

export function isRocketLeagueFileName(fileName: string): boolean {
  return fileName.toLowerCase().endsWith('.replay');
}
