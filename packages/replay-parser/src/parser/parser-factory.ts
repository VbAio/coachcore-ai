import type { ReplayParser } from './replay-parser.interface.js';
import { DeadlockReplayParser } from './deadlock-parser.js';

const parsers: ReplayParser[] = [new DeadlockReplayParser()];

export function getParserForFile(buffer: Buffer): ReplayParser | null {
  return parsers.find((p) => p.canParse(buffer)) ?? null;
}

export function registerParser(parser: ReplayParser): void {
  parsers.unshift(parser);
}

export function listParsers(): ReplayParser[] {
  return [...parsers];
}
