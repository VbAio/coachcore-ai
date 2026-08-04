import { resolveItemDef, type DeadlockItemDef } from '../data/deadlock-items.js';

export interface ReplayMetadata {
  map: string;
  date: string;
  durationSeconds: number;
  players: ReplayPlayer[];
  gameMode: string;
  version: string;
  matchId?: string;
}

export interface ReplayPlayer {
  steamId: string;
  name: string;
  hero: string;
  team: 'radiant' | 'dire' | 'team_a' | 'team_b';
  mmr?: number;
  kills: number;
  deaths: number;
  assists: number;
  isSubject: boolean;
}

export interface PositionSample {
  timestamp: number;
  x: number;
  y: number;
  z: number;
  /** Player steamId / name-key when known */
  playerId?: string;
}

export interface CombatEvent {
  /** Stable id for coaching cross-references */
  eventId?: string;
  timestamp: number;
  type:
    | 'kill'
    | 'death'
    | 'assist'
    | 'damage'
    | 'heal'
    | 'ability_cast'
    | 'item_purchase'
    | 'item_activate'
    | 'objective';
  actorId?: string;
  targetId?: string;
  ability?: string;
  item?: string;
  value?: number;
  position?: { x: number; y: number; z: number };
}

export interface TeamFight {
  id: string;
  startTime: number;
  endTime: number;
  participants: string[];
  kills: number;
  outcome: 'won' | 'lost' | 'draw';
}

export interface ParsedReplay {
  metadata: ReplayMetadata;
  subjectPlayerId: string;
  positions: PositionSample[];
  events: CombatEvent[];
  teamFights: TeamFight[];
  economy: EconomySnapshot[];
  abilityUpgrades: AbilityUpgrade[];
  itemPurchases: ItemPurchase[];
  /** Fields extracted directly from demo file */
  extractionConfidence: 'full' | 'partial' | 'minimal';
  /** Raw parser notes about unavailable data */
  parserNotes: string[];
}

export interface EconomySnapshot {
  timestamp: number;
  gold: number;
  netWorth: number;
  lastHits: number;
  denies: number;
}

export interface AbilityUpgrade {
  timestamp: number;
  ability: string;
  level: number;
}

export interface ItemPurchase {
  timestamp: number;
  item: string;
  cost: number;
  actorId?: string;
  /** Catalog id when resolved */
  itemId?: string;
  category?: 'Weapon' | 'Vitality' | 'Spirit';
  /** Inventory slot index after purchase (0-based, category-aware) */
  slotIndex?: number;
  eventId?: string;
}

export type ReplayProcessingStage =
  | 'queued'
  | 'uploading'
  | 'parsing'
  | 'feature_extraction'
  | 'mistake_detection'
  | 'coaching'
  | 'report_generation'
  | 'complete'
  | 'failed';

export interface ReplayProcessingStatus {
  replayId: string;
  stage: ReplayProcessingStage;
  progress: number;
  estimatedSecondsRemaining?: number;
  message: string;
  error?: string;
}

/** Compact seekable payload stored on Replay.timeline for the VOD UI */
export interface MatchTimelinePlayer {
  steamId: string;
  name: string;
  hero: string;
  team: ReplayPlayer['team'];
  kills: number;
  deaths: number;
  assists: number;
  isSubject: boolean;
}

export interface MatchTimelineTrack {
  playerId: string;
  samples: Array<{ t: number; x: number; y: number; z: number }>;
}

export interface MatchTimelineEvent {
  eventId: string;
  timestamp: number;
  type: CombatEvent['type'];
  actorId?: string;
  targetId?: string;
  ability?: string;
  item?: string;
  value?: number;
  position?: { x: number; y: number };
  label: string;
}

export interface MatchTimelineFight {
  id: string;
  startTime: number;
  endTime: number;
  participants: string[];
  kills: number;
  outcome: TeamFight['outcome'];
}

export interface MatchTimelinePurchase {
  eventId: string;
  timestamp: number;
  item: string;
  itemId: string;
  cost: number;
  category: 'Weapon' | 'Vitality' | 'Spirit';
  slotIndex: number;
  actorId?: string;
  /** Running total souls spent after this buy (catalog costs) */
  totalSoulsSpent: number;
}

export interface MatchTimeline {
  version: 1;
  replayId?: string;
  map: string;
  durationSeconds: number;
  subjectPlayerId: string;
  extractionConfidence: ParsedReplay['extractionConfidence'];
  parserNotes: string[];
  players: MatchTimelinePlayer[];
  events: MatchTimelineEvent[];
  tracks: MatchTimelineTrack[];
  teamFights: MatchTimelineFight[];
  itemPurchases: ItemPurchase[];
  /** Subject purchases enriched for the Items panel */
  enrichedPurchases?: MatchTimelinePurchase[];
}

/** Build a compact client timeline from a full parse result. */
export function buildMatchTimeline(
  replay: ParsedReplay,
  replayId?: string
): MatchTimeline {
  const playerName = (id?: string) => {
    if (!id) return 'Unknown';
    const p = replay.metadata.players.find((x) => x.steamId === id);
    return p?.name ?? id.replace(/^name:/, '').replace(/^steam:/, '');
  };

  // Drop ability_cast from the client timeline — Items replace Abilities in VOD UI
  const sourceEvents = replay.events.filter((e) => e.type !== 'ability_cast');

  const events: MatchTimelineEvent[] = sourceEvents.map((e, i) => {
    const eventId = e.eventId ?? `evt-${i}-${e.type}-${e.timestamp}`;
    let label: string = e.type;
    if (e.type === 'kill') {
      label = `${playerName(e.actorId)} killed ${playerName(e.targetId)}`;
    } else if (e.type === 'death') {
      label = `${playerName(e.targetId)} died`;
    } else if (e.type === 'assist') {
      label = `${playerName(e.actorId)} assisted`;
    } else if (e.type === 'item_purchase') {
      label = `Purchased ${e.item ?? 'item'}`;
    } else if (e.type === 'objective') {
      label = e.ability === 'mid_boss_spawn' ? 'Mid boss spawned' : 'Objective event';
    }
    return {
      eventId,
      timestamp: e.timestamp,
      type: e.type,
      actorId: e.actorId,
      targetId: e.targetId,
      ability: e.ability,
      item: e.item,
      value: e.value,
      position: e.position
        ? { x: e.position.x, y: e.position.y }
        : undefined,
      label,
    };
  });

  const byPlayer = new Map<string, MatchTimelineTrack['samples']>();
  for (const sample of replay.positions) {
    const pid = sample.playerId ?? replay.subjectPlayerId;
    if (!byPlayer.has(pid)) byPlayer.set(pid, []);
    byPlayer.get(pid)!.push({
      t: sample.timestamp,
      x: sample.x,
      y: sample.y,
      z: sample.z,
    });
  }

  const tracks: MatchTimelineTrack[] = [...byPlayer.entries()].map(
    ([playerId, samples]) => ({
      playerId,
      samples: samples.sort((a, b) => a.t - b.t),
    })
  );

  const categorySlots: Record<'Weapon' | 'Vitality' | 'Spirit', number> = {
    Weapon: 0,
    Vitality: 0,
    Spirit: 0,
  };
  let totalSoulsSpent = 0;
  const purchaseEvents = sourceEvents
    .filter((e) => e.type === 'item_purchase')
    .filter((e) => !e.actorId || e.actorId === replay.subjectPlayerId)
    .sort((a, b) => a.timestamp - b.timestamp);

  const enrichedPurchases: MatchTimelinePurchase[] = purchaseEvents.map((e, idx) => {
    const def = resolveItemDef(e.item ?? 'Unknown Item');
    const cost = e.value && e.value > 0 ? e.value : def.cost;
    totalSoulsSpent += cost;
    const localSlot = categorySlots[def.category] % 4;
    categorySlots[def.category] += 1;
    const slotIndex =
      (def.category === 'Weapon' ? 0 : def.category === 'Vitality' ? 4 : 8) + localSlot;
    return {
      eventId: e.eventId ?? `purchase-${idx}-${e.timestamp}`,
      timestamp: e.timestamp,
      item: def.name,
      itemId: def.id,
      cost,
      category: def.category,
      slotIndex,
      actorId: e.actorId ?? replay.subjectPlayerId,
      totalSoulsSpent,
    };
  });

  // Prefer itemPurchases array if events were empty
  const fallbackPurchases =
    enrichedPurchases.length > 0
      ? enrichedPurchases
      : enrichPurchasesFromList(replay.itemPurchases, replay.subjectPlayerId, resolveItemDef);

  return {
    version: 1,
    replayId,
    map: replay.metadata.map,
    durationSeconds: replay.metadata.durationSeconds,
    subjectPlayerId: replay.subjectPlayerId,
    extractionConfidence: replay.extractionConfidence,
    parserNotes: replay.parserNotes,
    players: replay.metadata.players.map((p) => ({
      steamId: p.steamId,
      name: p.name,
      hero: p.hero,
      team: p.team,
      kills: p.kills,
      deaths: p.deaths,
      assists: p.assists,
      isSubject: p.isSubject,
    })),
    events: events.sort((a, b) => a.timestamp - b.timestamp),
    tracks,
    teamFights: replay.teamFights.map((f) => ({
      id: f.id,
      startTime: f.startTime,
      endTime: f.endTime,
      participants: f.participants,
      kills: f.kills,
      outcome: f.outcome,
    })),
    itemPurchases: replay.itemPurchases,
    enrichedPurchases: fallbackPurchases,
  };
}

function enrichPurchasesFromList(
  purchases: ItemPurchase[],
  subjectId: string,
  resolve: (name: string) => DeadlockItemDef
): MatchTimelinePurchase[] {
  const categorySlots: Record<'Weapon' | 'Vitality' | 'Spirit', number> = {
    Weapon: 0,
    Vitality: 0,
    Spirit: 0,
  };
  let totalSoulsSpent = 0;
  return [...purchases]
    .filter((p) => !p.actorId || p.actorId === subjectId)
    .sort((a, b) => a.timestamp - b.timestamp)
    .map((p, idx) => {
      const def = resolve(p.item);
      const cost = p.cost > 0 ? p.cost : def.cost;
      totalSoulsSpent += cost;
      const localSlot = categorySlots[def.category] % 4;
      categorySlots[def.category] += 1;
      const slotIndex =
        (def.category === 'Weapon' ? 0 : def.category === 'Vitality' ? 4 : 8) + localSlot;
      return {
        eventId: p.eventId ?? `purchase-${idx}-${p.timestamp}`,
        timestamp: p.timestamp,
        item: def.name,
        itemId: def.id,
        cost,
        category: def.category,
        slotIndex,
        actorId: p.actorId ?? subjectId,
        totalSoulsSpent,
      };
    });
}
