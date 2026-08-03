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
}

export interface CombatEvent {
  timestamp: number;
  type: 'kill' | 'death' | 'assist' | 'damage' | 'heal' | 'ability_cast' | 'item_purchase' | 'item_activate' | 'objective';
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
