export type RlLeaderboardPlaylist = '1v1' | '2v2' | '3v3';

export interface RlLeaderboardPlayer {
  rank: number;
  playerName: string;
  rating: number;
  matchesPlayed: number | null;
  profileUrl?: string;
}

export interface RlLeaderboardBoard {
  playlist: RlLeaderboardPlaylist;
  playlistId: number;
  label: string;
  sourceUrl: string;
  fetchedAt: string;
  players: RlLeaderboardPlayer[];
  source: 'tracker-network' | 'tracker-network-cache';
  isLive: boolean;
}

export interface RlLeaderboardResponse {
  boards: RlLeaderboardBoard[];
  activePlaylist: RlLeaderboardPlaylist;
  lastFetchedAt: string;
  source: string;
}

export const RL_LEADERBOARD_PLAYLISTS: Array<{
  playlist: RlLeaderboardPlaylist;
  playlistId: number;
  label: string;
  platform: 'epic' | 'all';
  sourceUrl: string;
}> = [
  {
    playlist: '1v1',
    playlistId: 10,
    label: 'Ranked 1v1',
    platform: 'epic',
    sourceUrl:
      'https://rocketleague.tracker.network/rocket-league/leaderboards/playlist/epic/default?page=1&playlist=10',
  },
  {
    playlist: '2v2',
    playlistId: 11,
    label: 'Ranked 2v2',
    platform: 'all',
    sourceUrl:
      'https://rocketleague.tracker.network/rocket-league/leaderboards/playlist/all/default?page=1&playlist=11',
  },
  {
    playlist: '3v3',
    playlistId: 13,
    label: 'Ranked 3v3',
    platform: 'all',
    sourceUrl:
      'https://rocketleague.tracker.network/rocket-league/leaderboards/playlist/all/default?page=1&playlist=13',
  },
];
