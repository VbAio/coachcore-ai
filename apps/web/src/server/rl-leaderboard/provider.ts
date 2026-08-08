import {
  RL_LEADERBOARD_PLAYLISTS,
  getRlLeaderboardSnapshot,
  type RlLeaderboardBoard,
  type RlLeaderboardPlayer,
  type RlLeaderboardPlaylist,
  type RlLeaderboardResponse,
} from '@coachcore/shared';

const cache = new Map<RlLeaderboardPlaylist, { expires: number; board: RlLeaderboardBoard }>();
const CACHE_MS = 5 * 60 * 1000;

function cleanName(raw: string): string {
  return raw.replace(/https?:\/\/\S+/g, '').replace(/\s+/g, ' ').trim();
}

function parseRating(raw: string): number {
  return Number(String(raw).replace(/[^\d]/g, '')) || 0;
}

function parseMatches(raw: string): number | null {
  const n = Number(String(raw).replace(/[^\d]/g, ''));
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Best-effort HTML table parse from Tracker Network playlist pages. */
export function parseTrackerLeaderboardHtml(html: string): RlLeaderboardPlayer[] {
  if (!html || html.includes('Just a moment') || html.includes("You've Been Blocked")) {
    throw new Error('Tracker Network challenge page');
  }

  const players: RlLeaderboardPlayer[] = [];
  const rowRe =
    /<tr[^>]*>\s*<td[^>]*>\s*(\d+)\s*<\/td>\s*<td[^>]*>[\s\S]*?<span[^>]*class="[^"]*trn-ign__username[^"]*"[^>]*>([^<]+)<\/span>[\s\S]*?<\/td>\s*<td[^>]*>\s*([\d,]+)\s*<\/td>\s*<td[^>]*>\s*([\d,]*)\s*<\/td>/gi;

  let match: RegExpExecArray | null;
  while ((match = rowRe.exec(html))) {
    players.push({
      rank: Number(match[1]),
      playerName: cleanName(match[2]),
      rating: parseRating(match[3]),
      matchesPlayed: parseMatches(match[4]),
    });
  }

  if (players.length) return players;

  // Fallback: markdown-ish / plain table rows from some proxies
  const plain =
    /^\|\s*(\d+)\s*\|\s*([^|]+?)\s*\|\s*([\d,]+)\s*\|\s*([\d,]*)\s*\|/gm;
  while ((match = plain.exec(html))) {
    players.push({
      rank: Number(match[1]),
      playerName: cleanName(match[2]),
      rating: parseRating(match[3]),
      matchesPlayed: parseMatches(match[4]),
    });
  }

  if (!players.length) throw new Error('No leaderboard rows parsed');
  return players;
}

async function fetchLiveBoard(playlist: RlLeaderboardPlaylist): Promise<RlLeaderboardBoard> {
  const meta = RL_LEADERBOARD_PLAYLISTS.find((p) => p.playlist === playlist)!;
  const res = await fetch(meta.sourceUrl, {
    headers: {
      Accept: 'text/html,application/xhtml+xml',
      'User-Agent':
        'Mozilla/5.0 (compatible; CoachCoreBot/1.0; +https://coachcore-ai-web.vercel.app)',
      'Accept-Language': 'en-US,en;q=0.9',
    },
    cache: 'no-store',
  });

  if (!res.ok) throw new Error(`Tracker Network HTTP ${res.status}`);
  const html = await res.text();
  const players = parseTrackerLeaderboardHtml(html).slice(0, 100).map((p) => ({
    ...p,
    profileUrl: `https://rocketleague.tracker.network/rocket-league/profile/search?term=${encodeURIComponent(p.playerName)}`,
  }));

  return {
    playlist: meta.playlist,
    playlistId: meta.playlistId,
    label: meta.label,
    sourceUrl: meta.sourceUrl,
    fetchedAt: new Date().toISOString(),
    players,
    source: 'tracker-network',
    isLive: true,
  };
}

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

export async function fetchRlLeaderboardBoard(
  playlist: RlLeaderboardPlaylist
): Promise<RlLeaderboardBoard> {
  const cached = cache.get(playlist);
  if (cached && cached.expires > Date.now()) return cached.board;

  try {
    const live = await fetchLiveBoard(playlist);
    cache.set(playlist, { expires: Date.now() + CACHE_MS, board: live });
    return live;
  } catch {
    const snap = boardFromSnapshot(playlist);
    cache.set(playlist, { expires: Date.now() + CACHE_MS, board: snap });
    return snap;
  }
}

export async function fetchRlLeaderboard(
  playlist: RlLeaderboardPlaylist = '2v2'
): Promise<RlLeaderboardResponse> {
  const boards = await Promise.all(
    RL_LEADERBOARD_PLAYLISTS.map((p) => fetchRlLeaderboardBoard(p.playlist))
  );
  const active = boards.find((b) => b.playlist === playlist) ?? boards[1] ?? boards[0];
  return {
    boards,
    activePlaylist: active.playlist,
    lastFetchedAt: active.fetchedAt,
    source: 'Rocket League Tracker Network',
  };
}
