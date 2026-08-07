import type { ReplayParser } from './replay-parser.interface.js';
import { DeadlockReplayParser } from './deadlock-parser.js';
import {
  isRocketLeagueFileName,
  RocketLeagueReplayParser,
} from './rocket-league-parser.js';

const parsers: ReplayParser[] = [
  new RocketLeagueReplayParser(),
  new DeadlockReplayParser(),
];

export function getParserForFile(buffer: Buffer, fileName?: string): ReplayParser | null {
  if (fileName && isRocketLeagueFileName(fileName)) {
    const rl = parsers.find((p) => p.name === 'rocket-league');
    if (rl) return rl;
  }
  return parsers.find((p) => p.canParse(buffer)) ?? null;
}

export function registerParser(parser: ReplayParser): void {
  parsers.unshift(parser);
}

export function listParsers(): ReplayParser[] {
  return [...parsers];
}
