import { Readable } from 'node:stream';
import type {
  AbilityUpgrade,
  CombatEvent,
  ItemPurchase,
  ParsedReplay,
  PositionSample,
  ReplayPlayer,
  TeamFight,
} from '@coachcore/shared';
import {
  InterceptorStage,
  MessagePacketType,
  Parser,
  ParserConfiguration,
  StringTableEvent,
  StringTableType,
} from 'deadem';

interface PlayerSlot {
  steamId: string;
  name: string;
  team: number;
  hero: string;
  kills: number;
  deaths: number;
  assists: number;
  heroDamage: number;
  controllerIndex?: number;
  pawnIndex?: number;
}

interface KillMsg {
  entindexAttacker?: number;
  entindexScorer?: number;
  entindexVictim?: number;
  entindexAssisters?: number[];
}

function tryField(entity: { getField: (k: string) => unknown }, ...keys: string[]): unknown {
  for (const key of keys) {
    try {
      const value = entity.getField(key);
      if (value !== undefined && value !== null && value !== '') return value;
    } catch {
      /* field missing */
    }
  }
  return undefined;
}

function teamLabel(teamNum: number): ReplayPlayer['team'] {
  // Deadlock commonly uses 2/3 for sides; keep stable mapping.
  if (teamNum === 2 || teamNum === 0) return 'team_a';
  if (teamNum === 3 || teamNum === 1) return 'team_b';
  return teamNum % 2 === 0 ? 'team_a' : 'team_b';
}

function resolveControllerFromPawn(
  demo: {
    getEntity: (i: number) => { getField: (k: string) => unknown; class: { name: string }; index: number } | null;
    getEntityByHandle: (h: unknown) => { getField: (k: string) => unknown; class: { name: string }; index: number } | null;
  },
  entityIndex: number
): { getField: (k: string) => unknown; class: { name: string }; index: number } | null {
  const entity = demo.getEntity(entityIndex);
  if (!entity) return null;
  if (entity.class.name === 'CCitadelPlayerController') return entity;
  if (entity.class.name === 'CCitadelPlayerPawn') {
    const ownerHandle = tryField(entity, 'm_hOwnerEntity');
    if (ownerHandle != null) {
      const owner = demo.getEntityByHandle(ownerHandle);
      if (owner?.class.name === 'CCitadelPlayerController') return owner;
    }
  }
  return null;
}

function controllerKey(
  controller: { getField: (k: string) => unknown; index: number } | null
): string | null {
  if (!controller) return null;
  const name = String(tryField(controller, 'm_iszPlayerName') ?? '');
  if (name) return `name:${name}`;
  return `idx:${controller.index}`;
}

function formatClockSeconds(seconds: number): number {
  return Math.max(0, Math.round(seconds));
}

/**
 * Parse a Deadlock .dem buffer with deadem into CoachCore ParsedReplay.
 */
export async function extractWithDeadem(
  buffer: Buffer,
  subjectId?: string
): Promise<ParsedReplay> {
  const parserNotes: string[] = [];
  const events: CombatEvent[] = [];
  const positions: PositionSample[] = [];
  const abilityUpgrades: AbilityUpgrade[] = [];
  const itemPurchases: ItemPurchase[] = [];
  const playersByKey = new Map<string, PlayerSlot>();
  const steamByName = new Map<string, string>();

  let mapName = 'unknown_map';
  let durationSeconds = 0;
  let gameClock = 0;
  let gameRulesIndex: number | null = null;
  let lastDemoTick = 0;
  let tickInterval = 1 / 64;
  let positionSampleCounter = 0;

  const ensurePlayer = (key: string, partial: Partial<PlayerSlot> & { name?: string }) => {
    const existing = playersByKey.get(key);
    if (existing) {
      Object.assign(existing, partial);
      return existing;
    }
    const slot: PlayerSlot = {
      steamId: partial.steamId ?? key.replace(/^name:/, 'unknown:'),
      name: partial.name ?? 'Unknown',
      team: partial.team ?? 0,
      hero: partial.hero ?? 'unknown_hero',
      kills: partial.kills ?? 0,
      deaths: partial.deaths ?? 0,
      assists: partial.assists ?? 0,
      heroDamage: partial.heroDamage ?? 0,
      controllerIndex: partial.controllerIndex,
      pawnIndex: partial.pawnIndex,
    };
    playersByKey.set(key, slot);
    return slot;
  };

  const updateGameClock = (demo: {
    getEntity: (i: number) => { getField: (k: string) => unknown } | null;
    server: { tickInterval?: number } | null;
  }) => {
    if (gameRulesIndex == null) return;
    const rules = demo.getEntity(gameRulesIndex);
    if (!rules) return;
    const clockLast = Number(
      tryField(rules, 'm_pGameRules.m_flMatchClockAtLastUpdate') ?? 0
    );
    const clockTick = Number(
      tryField(rules, 'm_pGameRules.m_nMatchClockUpdateTick') ?? 0
    );
    const paused = Boolean(tryField(rules, 'm_pGameRules.m_bGamePaused'));
    const interval = demo.server?.tickInterval ?? tickInterval;
    if (paused) {
      gameClock = Math.max(clockLast, 0);
    } else {
      const delta = Math.max(lastDemoTick - clockTick, 0);
      gameClock = Math.max(clockLast + delta * interval, 0);
    }
    durationSeconds = Math.max(durationSeconds, gameClock, lastDemoTick * interval);
  };

  const config = new ParserConfiguration({
    messagePacketTypes: [
      MessagePacketType.CITADEL_USER_MESSAGE_HERO_KILLED,
      MessagePacketType.CITADEL_USER_MESSAGE_IMPORTANT_ABILITY_USED,
      MessagePacketType.CITADEL_USER_MESSAGE_ITEM_PURCHASE_NOTIFICATION,
      MessagePacketType.CITADEL_USER_MESSAGE_BOSS_KILLED,
      MessagePacketType.CITADEL_USER_MESSAGE_MID_BOSS_SPAWNED,
      MessagePacketType.SVC_PACKET_ENTITIES,
    ],
    entityClasses: [
      'CCitadelGameRulesProxy',
      'CCitadelPlayerController',
      'CCitadelPlayerPawn',
      'CCitadel_Destroyable_Building',
      'CNPC_BarrackBoss',
      'CNPC_Boss_Tier2',
      'CNPC_Boss_Tier3',
      'CNPC_MidBoss',
      'CNPC_TrooperBoss',
    ],
  });

  const parser = new Parser(config);

  parser.registerPostInterceptor(InterceptorStage.DEMO_PACKET, (...args: unknown[]) => {
    const demoPacket = args[0] as { tick?: number };
    if (typeof demoPacket?.tick === 'number') {
      lastDemoTick = demoPacket.tick;
    }

    const demo = parser.getDemo() as {
      getEntitiesByClassName: (n: string) => Array<{
        index: number;
        getField: (k: string) => unknown;
        class: { name: string };
      }>;
      getEntity: (i: number) => { getField: (k: string) => unknown; class: { name: string }; index: number } | null;
      getEntityByHandle: (h: unknown) => { getField: (k: string) => unknown; class: { name: string }; index: number } | null;
      server: { tickInterval?: number; mapName?: string } | null;
      stringTableContainer: {
        getByType: (t: unknown) => { getEntries: () => Array<{ value: unknown }> } | null;
        subscribe: (e: unknown, cb: (...args: unknown[]) => void) => void;
      };
    };

    if (demo.server?.tickInterval) tickInterval = demo.server.tickInterval;
    if (demo.server?.mapName) mapName = demo.server.mapName;

    if (gameRulesIndex == null) {
      const rules = demo.getEntitiesByClassName('CCitadelGameRulesProxy');
      if (rules.length > 0) gameRulesIndex = rules[0].index;
    }

    updateGameClock(demo);

    // Capture controllers for roster / scoreboard fields
    for (const controller of demo.getEntitiesByClassName('CCitadelPlayerController')) {
      const name = String(tryField(controller, 'm_iszPlayerName') ?? '');
      if (!name) continue;
      const team = Number(tryField(controller, 'm_iTeamNum') ?? 0);
      const heroId = tryField(
        controller,
        'm_nHeroID',
        'm_unHeroID',
        'm_iHeroID',
        'm_pData.m_nHeroID'
      );
      const hero =
        heroId != null && heroId !== 0 ? `hero_${heroId}` : 'unknown_hero';
      const damage = Number(tryField(controller, 'm_iHeroDamage') ?? 0);
      const steamFromTable = steamByName.get(name);
      const key = steamFromTable ? `steam:${steamFromTable}` : `name:${name}`;
      ensurePlayer(key, {
        name,
        team,
        hero,
        heroDamage: damage,
        steamId: steamFromTable ?? `name:${name}`,
        controllerIndex: controller.index,
      });
    }

    // Downsample subject positions roughly every ~2s of demo time
    positionSampleCounter++;
    if (positionSampleCounter % 128 === 0) {
      const pawns = demo.getEntitiesByClassName('CCitadelPlayerPawn');
      for (const pawn of pawns.slice(0, 12)) {
        const origin =
          tryField(pawn, 'm_vecAbsOrigin', 'm_vOrigin', 'CBodyComponent.m_vecOrigin') ??
          tryField(pawn, 'm_CBodyComponent.m_cellX');
        if (!origin || typeof origin !== 'object') continue;
        const o = origin as { x?: number; y?: number; z?: number };
        if (typeof o.x !== 'number' || typeof o.y !== 'number') continue;
        positions.push({
          timestamp: formatClockSeconds(gameClock),
          x: o.x,
          y: o.y,
          z: typeof o.z === 'number' ? o.z : 0,
        });
      }
      // Cap memory
      if (positions.length > 4000) positions.splice(0, positions.length - 4000);
    }
  });

  // Capture Steam IDs while USER_INFO is still populated mid-match
  const onUserInfo = (_container: unknown, table: { getEntries?: () => Array<{ value: unknown }> } | null) => {
    const entries = table?.getEntries?.() ?? [];
    for (const entry of entries) {
      const value = entry.value as Record<string, unknown> | null;
      if (!value || typeof value !== 'object') continue;
      const name = String(value.name ?? value.playername ?? value.PlayerName ?? '');
      const xuid = value.xuid ?? value.steamid ?? value.steamId ?? value.accountid;
      if (!name || xuid == null) continue;
      const steamId = String(xuid);
      steamByName.set(name, steamId);
      const key = `steam:${steamId}`;
      ensurePlayer(key, { name, steamId });
    }
  };

  parser.registerPostInterceptor(InterceptorStage.DEMO_PACKET, () => {
    const demo = parser.getDemo() as {
      stringTableContainer: {
        getByType: (t: unknown) => { getEntries: () => Array<{ value: unknown }> } | null;
        subscribe: (e: unknown, cb: (...args: unknown[]) => void) => void;
      };
    };
    // Subscribe once when container is ready
    const container = demo.stringTableContainer;
    if (container && !(container as { __ccSubscribed?: boolean }).__ccSubscribed) {
      (container as { __ccSubscribed?: boolean }).__ccSubscribed = true;
      container.subscribe(StringTableEvent.TABLE_UPDATED, (c, table) => {
        const t = table as { type?: { name?: string }; getEntries?: () => Array<{ value: unknown }> };
        if (t?.type === StringTableType.USER_INFO || t?.type?.name === 'USER_INFO') {
          onUserInfo(c, t);
        }
      });
      const userTable = container.getByType(StringTableType.USER_INFO);
      if (userTable) onUserInfo(container, userTable);
    }
  });

  parser.registerPostInterceptor(
    InterceptorStage.MESSAGE_PACKET,
    (...args: unknown[]) => {
      const messagePacket = args[1] as { type: unknown; data: Record<string, unknown> };
      const demo = parser.getDemo() as {
        getEntity: (i: number) => { getField: (k: string) => unknown; class: { name: string }; index: number } | null;
        getEntityByHandle: (h: unknown) => { getField: (k: string) => unknown; class: { name: string }; index: number } | null;
        getEntitiesByClassName: (n: string) => Array<{ index: number; getField: (k: string) => unknown; class: { name: string } }>;
        server: { tickInterval?: number } | null;
      };
      updateGameClock(demo);
      const ts = formatClockSeconds(gameClock);

      if (messagePacket.type === MessagePacketType.CITADEL_USER_MESSAGE_HERO_KILLED) {
        const data = messagePacket.data as KillMsg;
        const killerIdx =
          data.entindexScorer != null && data.entindexScorer !== -1
            ? data.entindexScorer
            : data.entindexAttacker;
        const victimIdx = data.entindexVictim;

        const killerCtrl =
          killerIdx != null && killerIdx !== -1
            ? resolveControllerFromPawn(demo, killerIdx)
            : null;
        const victimCtrl =
          victimIdx != null && victimIdx !== -1
            ? resolveControllerFromPawn(demo, victimIdx)
            : null;

        const killerName = killerCtrl
          ? String(tryField(killerCtrl, 'm_iszPlayerName') ?? 'Unknown')
          : 'Unknown';
        const victimName = victimCtrl
          ? String(tryField(victimCtrl, 'm_iszPlayerName') ?? 'Unknown')
          : 'Unknown';

        const killerSteam = steamByName.get(killerName);
        const victimSteam = steamByName.get(victimName);
        const killerKey = killerSteam ? `steam:${killerSteam}` : `name:${killerName}`;
        const victimKey = victimSteam ? `steam:${victimSteam}` : `name:${victimName}`;

        const killer = ensurePlayer(killerKey, {
          name: killerName,
          steamId: killerSteam ?? killerKey,
          team: Number(tryField(killerCtrl ?? { getField: () => 0 }, 'm_iTeamNum') ?? 0),
        });
        const victim = ensurePlayer(victimKey, {
          name: victimName,
          steamId: victimSteam ?? victimKey,
          team: Number(tryField(victimCtrl ?? { getField: () => 0 }, 'm_iTeamNum') ?? 0),
        });

        killer.kills += 1;
        victim.deaths += 1;

        events.push({
          timestamp: ts,
          type: 'kill',
          actorId: killer.steamId,
          targetId: victim.steamId,
        });
        events.push({
          timestamp: ts,
          type: 'death',
          actorId: killer.steamId,
          targetId: victim.steamId,
        });

        for (const assistIdx of data.entindexAssisters ?? []) {
          const assistCtrl = resolveControllerFromPawn(demo, assistIdx);
          if (!assistCtrl) continue;
          const assistName = String(tryField(assistCtrl, 'm_iszPlayerName') ?? 'Unknown');
          const assistSteam = steamByName.get(assistName);
          const assistKey = assistSteam ? `steam:${assistSteam}` : `name:${assistName}`;
          const assister = ensurePlayer(assistKey, {
            name: assistName,
            steamId: assistSteam ?? assistKey,
          });
          assister.assists += 1;
          events.push({
            timestamp: ts,
            type: 'assist',
            actorId: assister.steamId,
            targetId: victim.steamId,
          });
        }
        return;
      }

      if (messagePacket.type === MessagePacketType.CITADEL_USER_MESSAGE_IMPORTANT_ABILITY_USED) {
        const abilityName = String(messagePacket.data.abilityName ?? 'ability');
        const casterHandle = messagePacket.data.caster;
        let actorId: string | undefined;
        if (casterHandle != null) {
          const pawn = demo.getEntityByHandle(casterHandle);
          if (pawn) {
            const ctrl = resolveControllerFromPawn(demo, pawn.index);
            const name = ctrl ? String(tryField(ctrl, 'm_iszPlayerName') ?? '') : '';
            const steam = name ? steamByName.get(name) : undefined;
            actorId = steam ?? (name ? `name:${name}` : undefined);
          }
        }
        events.push({
          timestamp: ts,
          type: 'ability_cast',
          actorId,
          ability: abilityName,
        });
        abilityUpgrades.push({
          timestamp: ts,
          ability: abilityName,
          level: 1,
        });
        return;
      }

      if (messagePacket.type === MessagePacketType.CITADEL_USER_MESSAGE_ITEM_PURCHASE_NOTIFICATION) {
        const item = String(
          messagePacket.data.itemName ?? messagePacket.data.item ?? 'item'
        );
        itemPurchases.push({ timestamp: ts, item, cost: 0 });
        events.push({
          timestamp: ts,
          type: 'item_purchase',
          item,
          value: 0,
        });
        return;
      }

      if (messagePacket.type === MessagePacketType.CITADEL_USER_MESSAGE_BOSS_KILLED) {
        events.push({
          timestamp: ts,
          type: 'objective',
          value: Number(messagePacket.data.objectiveTeam ?? 0),
        });
        return;
      }

      if (messagePacket.type === MessagePacketType.CITADEL_USER_MESSAGE_MID_BOSS_SPAWNED) {
        events.push({
          timestamp: ts,
          type: 'objective',
          ability: 'mid_boss_spawn',
        });
      }
    }
  );

  const readable = Readable.from(buffer);
  await parser.parse(readable);
  await parser.dispose();

  if (playersByKey.size === 0) {
    throw new Error('deadem parse produced no players');
  }

  if (events.filter((e) => e.type === 'kill').length === 0) {
    parserNotes.push('No kill events extracted — combat timeline may be incomplete');
  }
  if (positions.length === 0) {
    parserNotes.push('Position samples unavailable from this demo');
  }
  if (steamByName.size === 0) {
    parserNotes.push('Steam IDs were not available in USER_INFO; using name-based IDs');
  }

  const players: ReplayPlayer[] = [...playersByKey.values()].map((p) => ({
    steamId: p.steamId,
    name: p.name,
    hero: p.hero,
    team: teamLabel(p.team),
    kills: p.kills,
    deaths: p.deaths,
    assists: p.assists,
    isSubject: false,
  }));

  const subject =
    (subjectId
      ? players.find(
          (p) =>
            p.steamId === subjectId ||
            p.steamId === `steam:${subjectId}` ||
            p.name.toLowerCase() === subjectId.toLowerCase()
        )
      : undefined) ?? players[0];

  if (subjectId && subject.steamId !== subjectId && subject.name.toLowerCase() !== subjectId.toLowerCase()) {
    parserNotes.push(
      `Subject "${subjectId}" not found — defaulting to ${subject.name} (${subject.steamId})`
    );
  } else if (!subjectId) {
    parserNotes.push(
      `No subjectSteamId provided — coaching subject set to ${subject.name} (${subject.steamId})`
    );
  }

  for (const p of players) {
    p.isSubject = p.steamId === subject.steamId;
  }

  const teamFights = detectTeamFights(events);
  const killCount = events.filter((e) => e.type === 'kill').length;
  const hasRoster = players.length >= 2;
  const extractionConfidence: ParsedReplay['extractionConfidence'] =
    hasRoster && killCount > 0
      ? positions.length > 0
        ? 'full'
        : 'partial'
      : hasRoster
        ? 'partial'
        : 'minimal';

  if (extractionConfidence !== 'full') {
    parserNotes.push(`Extraction confidence: ${extractionConfidence}`);
  }

  return {
    metadata: {
      map: mapName || 'unknown_map',
      date: new Date().toISOString(),
      durationSeconds: Math.max(60, Math.round(durationSeconds)),
      gameMode: 'standard',
      version: 'deadem',
      players,
    },
    subjectPlayerId: subject.steamId,
    positions,
    events,
    teamFights,
    economy: [],
    abilityUpgrades,
    itemPurchases,
    extractionConfidence,
    parserNotes,
  };
}

function detectTeamFights(events: CombatEvent[]): TeamFight[] {
  const fights: TeamFight[] = [];
  const killEvents = events.filter((e) => e.type === 'kill');
  if (killEvents.length < 2) return fights;

  let clusterStart = killEvents[0].timestamp;
  let clusterKills = 1;
  const participants = new Set<string>();
  if (killEvents[0].actorId) participants.add(killEvents[0].actorId);
  if (killEvents[0].targetId) participants.add(killEvents[0].targetId);

  const flush = (endTime: number) => {
    if (clusterKills >= 2) {
      fights.push({
        id: `fight-${fights.length}`,
        startTime: clusterStart,
        endTime,
        participants: [...participants],
        kills: clusterKills,
        outcome: 'draw',
      });
    }
  };

  for (let i = 1; i < killEvents.length; i++) {
    const gap = killEvents[i].timestamp - killEvents[i - 1].timestamp;
    if (gap <= 15) {
      clusterKills++;
      if (killEvents[i].actorId) participants.add(killEvents[i].actorId!);
      if (killEvents[i].targetId) participants.add(killEvents[i].targetId!);
    } else {
      flush(killEvents[i - 1].timestamp);
      clusterStart = killEvents[i].timestamp;
      clusterKills = 1;
      participants.clear();
      if (killEvents[i].actorId) participants.add(killEvents[i].actorId!);
      if (killEvents[i].targetId) participants.add(killEvents[i].targetId!);
    }
  }
  flush(killEvents[killEvents.length - 1].timestamp);
  return fights;
}
