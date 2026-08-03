import { NextResponse } from 'next/server';
import { fetchHeroAssetsList } from '@/server/leaderboard';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const heroes = await fetchHeroAssetsList();
    return NextResponse.json({ success: true, data: heroes });
  } catch (error) {
    console.error('[next/leaderboard/heroes] error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch hero assets' },
      { status: 500 }
    );
  }
}
