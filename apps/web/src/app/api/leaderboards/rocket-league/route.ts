import { NextRequest, NextResponse } from 'next/server';
import type { RlLeaderboardPlaylist } from '@coachcore/shared';
import { fetchRlLeaderboard } from '@/server/rl-leaderboard/provider';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function parsePlaylist(raw: string | null): RlLeaderboardPlaylist {
  if (raw === '1v1' || raw === '2v2' || raw === '3v3') return raw;
  return '2v2';
}

export async function GET(request: NextRequest) {
  try {
    const playlist = parsePlaylist(request.nextUrl.searchParams.get('playlist'));
    const data = await fetchRlLeaderboard(playlist);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('[next/rl-leaderboard] error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch Rocket League leaderboard' },
      { status: 500 }
    );
  }
}
