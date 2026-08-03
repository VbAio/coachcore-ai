import { NextResponse } from 'next/server';
import { fetchPlayerProfile } from '@/server/leaderboard';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ steamId: string }> }
) {
  try {
    const { steamId } = await params;
    const profile = await fetchPlayerProfile(steamId);
    if (!profile) {
      return NextResponse.json({ success: false, error: 'Player not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: profile });
  } catch (error) {
    console.error('[next/player] error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch player profile' },
      { status: 500 }
    );
  }
}
