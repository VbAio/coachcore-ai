import { Readable } from 'node:stream';
import type {
  AbilityUpgrade,
  CombatEvent,
  EconomySnapshot,
  ItemPurchase,
  ParsedReplay,
  PositionSample,
  ReplayPlayer,
  TeamFight,
} from '@coachcore/shared';
import { resolveItemDef } from '@coachcore/shared';
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

function asFiniteNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  // Some parsers wrap primitives
  if (value && typeof value === 'object') {
    const o = value as { value?: unknown; x?: unknown };
    if (typeof o.value === 'number') return o.value;
  }
  return undefined;
}

/**
 * Deadlock pawn origins live on CBodyComponent.m_skeletonInstance.m_vecOrigin.*
 * (not m_vecAbsOrigin). Fall back to older/alternate field layouts.
 */
function readPawnOrigin(pawn: {
  getField: (k: string) => unknown;
}): { x: number; y: number; z: number } | null {
  const pathSets: Array<[string, string, string]> = [
    [
      'CBodyComponent.m_skeletonInstance.m_vecOrigin.m_vecX',
      'CBodyComponent.m_skeletonInstance.m_vecOrigin.m_vecY',
      'CBodyComponent.m_skeletonInstance.m_vecOrigin.m_vecZ',
    ],
    [
      'm_CBodyComponent.m_skeletonInstance.m_vecOrigin.m_vecX',
      'm_CBodyComponent.m_skeletonInstance.m_vecOrigin.m_vecY',
      'm_CBodyComponent.m_skeletonInstance.m_vecOrigin.m_vecZ',
    ],
    [
      'CBodyComponent.m_sceneNode.m_vecOrigin.m_vecX',
      'CBodyComponent.m_sceneNode.m_vecOrigin.m_vecY',
      'CBodyComponent.m_sceneNode.m_vecOrigin.m_vecZ',
    ],
  ];

  for (const [xk, yk, zk] of pathSets) {
    const x = asFiniteNumber(tryField(pawn, xk));
    const y = asFiniteNumber(tryField(pawn, yk));
    const z = asFiniteNumber(tryField(pawn, zk)) ?? 0;
    if (x != null && y != null) return { x, y, z };
  }

  const packed = tryField(
    pawn,
    'm_vecAbsOrigin',
    'm_vOrigin',
    'CBodyComponent.m_vecOrigin',
    'CBodyComponent.m_skeletonInstance.m_vecOrigin'
  );
  if (packed && typeof packed === 'object') {
    const o = packed as { x?: unknown; y?: unknown; z?: unknown; m_vecX?: unknown; m_vecY?: unknown; m_vecZ?: unknown };
    const x = asFiniteNumber(o.x ?? o.m_vecX);
    const y = asFiniteNumber(o.y ?? o.m_vecY);
    const z = asFiniteNumber(o.z ?? o.m_vecZ) ?? 0;
    if (x != null && y != null) return { x, y, z };
  }

  // Cell + local offset (Source 2 style)
  const cellX = asFiniteNumber(tryField(pawn, 'CBodyComponent.m_cellX', 'm_CBodyComponent.m_cellX'));
  const cellY = asFiniteNumber(tryField(pawn, 'CBodyComponent.m_cellY', 'm_CBodyComponent.m_cellY'));
  const cellZ = asFiniteNumber(tryField(pawn, 'CBodyComponent.m_cellZ', 'm_CBodyComponent.m_cellZ'));
  const vecX = asFiniteNumber(
    tryField(pawn, 'CBodyComponent.m_vecX', 'm_CBodyComponent.m_vecX', 'CBodyComponent.m_vecOrigin.m_vecX')
  );
  const vecY = asFiniteNumber(
    tryField(pawn, 'CBodyComponent.m_vecY', 'm_CBodyComponent.m_vecY', 'CBodyComponent.m_vecOrigin.m_vecY')
  );
  const vecZ = asFiniteNumber(
    tryField(pawn, 'CBodyComponent.m_vecZ', 'm_CBodyComponent.m_vecZ', 'CBodyComponent.m_vecOrigin.m_vecZ')
  );
  if (cellX != null && cellY != null && vecX != null && vecY != null) {
    const CELL = 128; // Source 2 cell size used by many Citadel builds
    return {
      x: cellX * CELL + vecX,
      y: cellY * CELL + vecY,
      z: (cellZ ?? 0) * CELL + (vecZ ?? 0),
    };
  }

  return null;
}

function readPawnSouls(pawn: { getField: (k: string) => unknown }): number | undefined {
  return (
    asFiniteNumber(
      tryField(
        pawn,
        'm_nCurrencies.m_nCurrencies',
        'm_nCurrencies',
        'm_iGold',
        'm_nGold'
      )
    ) ?? undefined
  );
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

/** Common Deadlock hero IDs → display names (fallback: hero_{id}) */
const HERO_DISPLAY: Record<string, string> = {
  '1': 'Infernus',
  '2': 'Seven',
  '3': 'Vindicta',
  '4': 'Lady Geist',
  '6': 'Abrams',
  '7': 'Wraith',
  '8': 'McGinnis',
  '10': 'Paradox',
  '11': 'Dynamo',
  '12': 'Kelvin',
  '13': 'Haze',
  '14': 'Holliday',
  '15': 'Bebop',
  '16': 'Calico',
  '17': 'Grey Talon',
  '18': 'Mo & Krill',
  '19': 'Shiv',
  '20': 'Ivy',
  '25': 'Warden',
  '27': 'Yamato',
  '31': 'Lash',
  '35': 'Viscous',
  '48': 'Pocket',
  '50': 'Mirage',
  '52': 'Dummy',
  '58': 'Vyper',
  '60': 'Sinclair',
};

function resolveHeroLabel(heroId: unknown): string {
  if (heroId == null || heroId === 0 || heroId === '0') return 'unknown_hero';
  const id = String(heroId);
  return HERO_DISPLAY[id] ?? `hero_${id}`;
}

function nearestPosition(
  samples: PositionSample[],
  playerId: string | undefined,
  timestamp: number
): { x: number; y: number; z: number } | undefined {
  const pool = playerId
    ? samples.filter((s) => s.playerId === playerId)
    : samples;
  if (pool.length === 0) return undefined;
  let best = pool[0];
  let bestDist = Math.abs(best.timestamp - timestamp);
  for (let i = 1; i < pool.length; i++) {
    const d = Math.abs(pool[i].timestamp - timestamp);
    if (d < bestDist) {
      best = pool[i];
      bestDist = d;
    }
  }
  if (bestDist > 30) return undefined;
  return { x: best.x, y: best.y, z: best.z };
}

let eventSeq = 0;
function nextEventId(type: string, ts: number): string {
  eventSeq += 1;
  return `evt-${eventSeq}-${type}-${ts}`;
}

/**
 * Parse a Deadlock .dem buffer with deadem into CoachCore ParsedReplay.
 */
export async function extractWithDeadem(
  buffer: Buffer,
  subjectId?: string
): Promise<ParsedReplay> {
  eventSeq = 0;
  const parserNotes: string[] = [];
  const events: CombatEvent[] = [];
  const positions: PositionSample[] = [];
  const economy: EconomySnapshot[] = [];
  const abilityUpgrades: AbilityUpgrade[] = [];
  const itemPurchases: ItemPurchase[] = [];
  const playersByKey = new Map<string, PlayerSlot>();
  const steamByName = new Map<string, string>();
  /** pawn entity index → player steamId/key */
  const pawnToPlayer = new Map<number, string>();

  let mapName = 'unknown_map';
  let durationSeconds = 0;
  let gameClock = 0;
  let gameRulesIndex: number | null = null;
  let lastDemoTick = 0;
  let tickInterval = 1 / 64;
  let positionSampleCounter = 0;
  let subjectSteamHint: string | undefined = subjectId;

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
      const hero = resolveHeroLabel(heroId);
      const damage = Number(tryField(controller, 'm_iHeroDamage') ?? 0);
      const steamFromTable = steamByName.get(name);
      const key = steamFromTable ? `steam:${steamFromTable}` : `name:${name}`;
      const player = ensurePlayer(key, {
        name,
        team,
        hero,
        heroDamage: damage,
        steamId: steamFromTable ?? `name:${name}`,
        controllerIndex: controller.index,
      });

      // Map pawn → player for position tagging
      const pawnHandle = tryField(controller, 'm_hPawn', 'm_hPlayerPawn');
      if (pawnHandle != null) {
        const pawn = demo.getEntityByHandle(pawnHandle);
        if (pawn) {
          player.pawnIndex = pawn.index;
          pawnToPlayer.set(pawn.index, player.steamId);
        }
      }
    }

    // Downsample positions ~every 1s of demo packets
    positionSampleCounter++;
    if (positionSampleCounter % 64 === 0) {
      const pawns = demo.getEntitiesByClassName('CCitadelPlayerPawn');
      const ts = formatClockSeconds(gameClock);
      for (const pawn of pawns.slice(0, 12)) {
        const origin = readPawnOrigin(pawn);
        if (!origin) continue;

        let playerId = pawnToPlayer.get(pawn.index);
        if (!playerId) {
          const ctrl = resolveControllerFromPawn(demo, pawn.index);
          const pname = ctrl ? String(tryField(ctrl, 'm_iszPlayerName') ?? '') : '';
          if (pname) {
            const steam = steamByName.get(pname);
            playerId = steam ?? `name:${pname}`;
            pawnToPlayer.set(pawn.index, playerId);
          }
        }

        positions.push({
          timestamp: ts,
          x: origin.x,
          y: origin.y,
          z: origin.z,
          playerId,
        });

        // Sample souls for the subject when the field is present
        const souls = readPawnSouls(pawn);
        if (
          souls != null &&
          playerId &&
          (playerId === subjectSteamHint ||
            playerId === `steam:${subjectSteamHint}` ||
            (!subjectSteamHint && economy.length === 0))
        ) {
          const last = economy[economy.length - 1];
          if (!last || last.timestamp !== ts) {
            economy.push({
              timestamp: ts,
              gold: souls,
              netWorth: souls,
              lastHits: 0,
              denies: 0,
            });
          } else {
            last.gold = souls;
            last.netWorth = souls;
          }
        }
      }
      // Cap memory
      if (positions.length > 6000) positions.splice(0, positions.length - 6000);
      if (economy.length > 2000) economy.splice(0, economy.length - 2000);
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

        const deathPos = nearestPosition(positions, victim.steamId, ts);
        const killPos = deathPos ?? nearestPosition(positions, killer.steamId, ts);

        events.push({
          eventId: nextEventId('kill', ts),
          timestamp: ts,
          type: 'kill',
          actorId: killer.steamId,
          targetId: victim.steamId,
          position: killPos,
        });
        events.push({
          eventId: nextEventId('death', ts),
          timestamp: ts,
          type: 'death',
          actorId: killer.steamId,
          targetId: victim.steamId,
          position: deathPos,
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
            eventId: nextEventId('assist', ts),
            timestamp: ts,
            type: 'assist',
            actorId: assister.steamId,
            targetId: victim.steamId,
            position: deathPos,
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
          eventId: nextEventId('ability_cast', ts),
          timestamp: ts,
          type: 'ability_cast',
          actorId,
          ability: abilityName,
          position: nearestPosition(positions, actorId, ts),
        });
        abilityUpgrades.push({
          timestamp: ts,
          ability: abilityName,
          level: 1,
        });
        return;
      }

      if (messagePacket.type === MessagePacketType.CITADEL_USER_MESSAGE_ITEM_PURCHASE_NOTIFICATION) {
        const rawName = String(
          messagePacket.data.itemName ?? messagePacket.data.item ?? 'item'
        );
        const def = resolveItemDef(rawName);
        const purchaserHandle =
          messagePacket.data.player ??
          messagePacket.data.buyer ??
          messagePacket.data.purchaser ??
          messagePacket.data.entindexPlayer;
        let actorId: string | undefined;
        if (purchaserHandle != null) {
          const ent =
            typeof purchaserHandle === 'number'
              ? demo.getEntity(purchaserHandle)
              : demo.getEntityByHandle(purchaserHandle);
          if (ent) {
            const ctrl = resolveControllerFromPawn(demo, ent.index);
            const pname = ctrl ? String(tryField(ctrl, 'm_iszPlayerName') ?? '') : '';
            const steam = pname ? steamByName.get(pname) : undefined;
            actorId = steam ?? (pname ? `name:${pname}` : undefined);
          }
        }
        const eventId = nextEventId('item_purchase', ts);
        itemPurchases.push({
          timestamp: ts,
          item: def.name,
          cost: def.cost,
          actorId,
          itemId: def.id,
          category: def.category,
          eventId,
        });
        events.push({
          eventId,
          timestamp: ts,
          type: 'item_purchase',
          item: def.name,
          value: def.cost,
          actorId,
        });
        return;
      }

      if (messagePacket.type === MessagePacketType.CITADEL_USER_MESSAGE_BOSS_KILLED) {
        events.push({
          eventId: nextEventId('objective', ts),
          timestamp: ts,
          type: 'objective',
          value: Number(messagePacket.data.objectiveTeam ?? 0),
        });
        return;
      }

      if (messagePacket.type === MessagePacketType.CITADEL_USER_MESSAGE_MID_BOSS_SPAWNED) {
        events.push({
          eventId: nextEventId('objective', ts),
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

  // Prefer denser subject track: keep all subject samples; downsample others ~1/2
  const subjectSteam = subject.steamId;
  const filteredPositions = downsamplePositions(positions, subjectSteam);

  if (filteredPositions.length === 0) {
    parserNotes.push(
      'Map positions unavailable — demo did not expose pawn origin fields (map scrubber limited)'
    );
  }

  // Backfill event positions that were missing at kill time
  for (const e of events) {
    if (e.position) continue;
    const focus =
      e.type === 'death' || e.type === 'assist' ? e.targetId : e.actorId ?? e.targetId;
    e.position = nearestPosition(filteredPositions, focus, e.timestamp);
  }

  const teamFights = detectTeamFights(events, players, subjectSteam);
  const killCount = events.filter((e) => e.type === 'kill').length;
  const hasRoster = players.length >= 2;
  const taggedPositions = filteredPositions.filter((p) => p.playerId).length;
  const extractionConfidence: ParsedReplay['extractionConfidence'] =
    hasRoster && killCount > 0
      ? filteredPositions.length > 0 && taggedPositions > 0
        ? 'full'
        : 'partial'
      : hasRoster
        ? 'partial'
        : 'minimal';

  if (extractionConfidence !== 'full') {
    parserNotes.push(
      `Extraction confidence: ${extractionConfidence} (combat OK${
        filteredPositions.length === 0 ? '; map positions missing' : ''
      }${economy.length === 0 ? '; souls sparse/unavailable' : ''})`
    );
  }
  if (economy.length === 0) {
    parserNotes.push('Souls/net-worth timeline unavailable — farm efficiency coaching omitted');
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
    positions: filteredPositions,
    events,
    teamFights,
    economy,
    abilityUpgrades,
    itemPurchases,
    extractionConfidence,
    parserNotes,
  };
}

function downsamplePositions(
  samples: PositionSample[],
  subjectId: string
): PositionSample[] {
  const subject: PositionSample[] = [];
  const others: PositionSample[] = [];
  for (const s of samples) {
    if (s.playerId === subjectId) subject.push(s);
    else others.push(s);
  }
  const thinnedOthers = others.filter((_, i) => i % 2 === 0);
  return [...subject, ...thinnedOthers]
    .sort((a, b) => a.timestamp - b.timestamp)
    .slice(-6000);
}

function detectTeamFights(
  events: CombatEvent[],
  players: ReplayPlayer[],
  subjectId: string
): TeamFight[] {
  const fights: TeamFight[] = [];
  const killEvents = events.filter((e) => e.type === 'kill');
  if (killEvents.length < 2) return fights;

  const teamOf = (id?: string) => players.find((p) => p.steamId === id)?.team;
  const subjectTeam = teamOf(subjectId);

  let clusterStart = killEvents[0].timestamp;
  let cluster: CombatEvent[] = [killEvents[0]];
  const participants = new Set<string>();
  if (killEvents[0].actorId) participants.add(killEvents[0].actorId);
  if (killEvents[0].targetId) participants.add(killEvents[0].targetId);

  const flush = (endTime: number) => {
    if (cluster.length < 2) return;
    let subjectKills = 0;
    let enemyKills = 0;
    for (const k of cluster) {
      const killerTeam = teamOf(k.actorId);
      if (!subjectTeam || !killerTeam) continue;
      if (killerTeam === subjectTeam) subjectKills++;
      else enemyKills++;
    }
    let outcome: TeamFight['outcome'] = 'draw';
    if (subjectKills > enemyKills) outcome = 'won';
    else if (enemyKills > subjectKills) outcome = 'lost';

    fights.push({
      id: `fight-${fights.length}`,
      startTime: clusterStart,
      endTime,
      participants: [...participants],
      kills: cluster.length,
      outcome,
    });
  };

  for (let i = 1; i < killEvents.length; i++) {
    const gap = killEvents[i].timestamp - killEvents[i - 1].timestamp;
    if (gap <= 15) {
      cluster.push(killEvents[i]);
      if (killEvents[i].actorId) participants.add(killEvents[i].actorId!);
      if (killEvents[i].targetId) participants.add(killEvents[i].targetId!);
    } else {
      flush(killEvents[i - 1].timestamp);
      clusterStart = killEvents[i].timestamp;
      cluster = [killEvents[i]];
      participants.clear();
      if (killEvents[i].actorId) participants.add(killEvents[i].actorId!);
      if (killEvents[i].targetId) participants.add(killEvents[i].targetId!);
    }
  }
  flush(killEvents[killEvents.length - 1].timestamp);
  return fights;
}
