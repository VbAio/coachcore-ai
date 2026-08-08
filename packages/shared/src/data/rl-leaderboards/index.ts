import type { RlLeaderboardPlaylist, RlLeaderboardPlayer } from '../../types/rl-leaderboard.js';
import { rlLeaderboard1v1 } from './1v1.js';
import { rlLeaderboard2v2 } from './2v2.js';
import { rlLeaderboard3v3 } from './3v3.js';

export interface RlLeaderboardSnapshot {
  playlist: RlLeaderboardPlaylist;
  playlistId: number;
  sourceUrl: string;
  fetchedAt: string;
  players: RlLeaderboardPlayer[];
  source?: string;
}

const SNAPSHOTS: Record<RlLeaderboardPlaylist, RlLeaderboardSnapshot> = {
  '1v1': {
    playlist: rlLeaderboard1v1.playlist,
    playlistId: rlLeaderboard1v1.playlistId,
    sourceUrl: rlLeaderboard1v1.sourceUrl,
    fetchedAt: rlLeaderboard1v1.fetchedAt,
    players: [...rlLeaderboard1v1.players],
    source: rlLeaderboard1v1.source,
  },
  '2v2': {
    playlist: rlLeaderboard2v2.playlist,
    playlistId: rlLeaderboard2v2.playlistId,
    sourceUrl: rlLeaderboard2v2.sourceUrl,
    fetchedAt: rlLeaderboard2v2.fetchedAt,
    players: [...rlLeaderboard2v2.players],
    source: rlLeaderboard2v2.source,
  },
  '3v3': {
    playlist: rlLeaderboard3v3.playlist,
    playlistId: rlLeaderboard3v3.playlistId,
    sourceUrl: rlLeaderboard3v3.sourceUrl,
    fetchedAt: rlLeaderboard3v3.fetchedAt,
    players: [...rlLeaderboard3v3.players],
    source: rlLeaderboard3v3.source,
  },
};

export function getRlLeaderboardSnapshot(playlist: RlLeaderboardPlaylist): RlLeaderboardSnapshot {
  return SNAPSHOTS[playlist];
}
