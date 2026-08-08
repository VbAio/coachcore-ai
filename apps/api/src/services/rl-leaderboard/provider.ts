import {
  RL_LEADERBOARD_PLAYLISTS,
  getRlLeaderboardSnapshot,
  type RlLeaderboardBoard,
  type RlLeaderboardPlaylist,
  type RlLeaderboardResponse,
} from '@coachcore/shared';

const cache = new Map<RlLeaderboardPlaylist, { expires: number; board: RlLeaderboardBoard }>();
const CACHE_MS = 5 * 60 * 1000;

function boardFromSnapshot(playlist: RlLeaderboardPlaylist): RlLeaderboardBoard {
  const snap = getRlLeaderboardSnapshot(playlist);
  const meta = RL_LEADERBOARD_PLAYLISTS.find((p) => p.playlist === playlist)!;
  return {
    playlist: meta.playlist,
    playlistId: meta.playlistId,
    label: meta.label,
    sourceUrl: meta.sourceUrl,
    fetchedAt: snap.fetchedAt,
    players: snap.players.map((p) => ({
      ...p,
      profileUrl: `https://rocketleague.tracker.network/rocket-league/profile/search?term=${encodeURIComponent(p.playerName)}`,
    })),
    source: 'tracker-network-cache',
    isLive: false,
  };
}

async function tryLive(playlist: RlLeaderboardPlaylist): Promise<RlLeaderboardBoard> {
  const meta = RL_LEADERBOARD_PLAYLISTS.find((p) => p.playlist === playlist)!;
  const res = await fetch(meta.sourceUrl, {
    headers: {
      Accept: 'text/html,application/xhtml+xml',
      'User-Agent':
        'Mozilla/5.0 (compatible; CoachCoreBot/1.0; +https://coachcore-ai-web.vercel.app)',
      'Accept-Language': 'en-US,en;q=0.9',
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();
  if (html.includes('Just a moment') || html.includes("You've Been Blocked")) {
    throw new Error('Cloudflare challenge');
  }

  const players = [] as RlLeaderboardBoard['players'];
  const rowRe =
    /<tr[^>]*>\s*<td[^>]*>\s*(\d+)\s*<\/td>\s*<td[^>]*>[\s\S]*?<span[^>]*class="[^"]*trn-ign__username[^"]*"[^>]*>([^<]+)<\/span>[\s\S]*?<\/td>\s*<td[^>]*>\s*([\d,]+)\s*<\/td>\s*<td[^>]*>\s*([\d,]*)\s*<\/td>/gi;
  let match: RegExpExecArray | null;
  while ((match = rowRe.exec(html))) {
    const playerName = match[2].replace(/https?:\/\/\S+/g, '').trim();
    players.push({
      rank: Number(match[1]),
      playerName,
      rating: Number(match[3].replace(/[^\d]/g, '')) || 0,
      matchesPlayed: Number(match[4].replace(/[^\d]/g, '')) || null,
      profileUrl: `https://rocketleague.tracker.network/rocket-league/profile/search?term=${encodeURIComponent(playerName)}`,
    });
  }
  if (!players.length) throw new Error('No rows');

  return {
    playlist: meta.playlist,
    playlistId: meta.playlistId,
    label: meta.label,
    sourceUrl: meta.sourceUrl,
    fetchedAt: new Date().toISOString(),
    players: players.slice(0, 100),
    source: 'tracker-network',
    isLive: true,
  };
}

export async function fetchRlLeaderboard(
  playlist: RlLeaderboardPlaylist = '2v2'
): Promise<RlLeaderboardResponse> {
  const boards = await Promise.all(
    RL_LEADERBOARD_PLAYLISTS.map(async (meta) => {
      const cached = cache.get(meta.playlist);
      if (cached && cached.expires > Date.now()) return cached.board;
      try {
        const live = await tryLive(meta.playlist);
        cache.set(meta.playlist, { expires: Date.now() + CACHE_MS, board: live });
        return live;
      } catch {
        const snap = boardFromSnapshot(meta.playlist);
        cache.set(meta.playlist, { expires: Date.now() + CACHE_MS, board: snap });
        return snap;
      }
    })
  );

  const active = boards.find((b) => b.playlist === playlist) ?? boards[1] ?? boards[0];
  return {
    boards,
    activePlaylist: active.playlist,
    lastFetchedAt: active.fetchedAt,
    source: 'Rocket League Tracker Network',
  };
}
