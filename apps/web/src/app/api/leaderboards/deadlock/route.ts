import { NextRequest, NextResponse } from 'next/server';
import { fetchLeaderboard } from '@/server/leaderboard';
import type { LeaderboardQuery, LeaderboardRegion, LeaderboardSortField } from '@/server/leaderboard/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const query: LeaderboardQuery = {
      region: (sp.get('region') as LeaderboardRegion) ?? 'NAmerica',
      heroId: sp.get('heroId') ? Number(sp.get('heroId')) : undefined,
      minRating: sp.get('minRating') ? Number(sp.get('minRating')) : undefined,
      maxRating: sp.get('maxRating') ? Number(sp.get('maxRating')) : undefined,
      minWinRate: sp.get('minWinRate') ? Number(sp.get('minWinRate')) : undefined,
      minGames: sp.get('minGames') ? Number(sp.get('minGames')) : undefined,
      search: sp.get('search') ?? undefined,
      sortBy: (sp.get('sortBy') as LeaderboardSortField) ?? 'rank',
      sortDir: (sp.get('sortDir') as 'asc' | 'desc') ?? 'asc',
      limit: sp.get('limit') ? Number(sp.get('limit')) : 100,
      offset: sp.get('offset') ? Number(sp.get('offset')) : 0,
    };

    const data = await fetchLeaderboard(query);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('[next/leaderboard] error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch leaderboard data' },
      { status: 500 }
    );
  }
}
