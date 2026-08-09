import { Router } from 'express';
import {
  fetchLeaderboard,
  fetchPlayerProfile,
  fetchHeroAssetsList,
  type LeaderboardQuery,
  type LeaderboardRegion,
  type LeaderboardSortField,
} from '../services/leaderboard/index.js';

export const leaderboardsRouter = Router();

leaderboardsRouter.get('/deadlock', async (req, res) => {
  try {
    const query: LeaderboardQuery = {
      region: (req.query.region as LeaderboardRegion) ?? 'NAmerica',
      heroId: req.query.heroId ? Number(req.query.heroId) : undefined,
      minRating: req.query.minRating ? Number(req.query.minRating) : undefined,
      maxRating: req.query.maxRating ? Number(req.query.maxRating) : undefined,
      minWinRate: req.query.minWinRate ? Number(req.query.minWinRate) : undefined,
      minGames: req.query.minGames ? Number(req.query.minGames) : undefined,
      search: req.query.search as string | undefined,
      sortBy: (req.query.sortBy as LeaderboardSortField) ?? 'rank',
      sortDir: (req.query.sortDir as 'asc' | 'desc') ?? 'asc',
      limit: req.query.limit ? Number(req.query.limit) : 100,
      offset: req.query.offset ? Number(req.query.offset) : 0,
    };

    const data = await fetchLeaderboard(query);
    res.json({ success: true, data });
  } catch (error) {
    console.error('[leaderboards] GET /deadlock error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch leaderboard data',
    });
  }
});

leaderboardsRouter.get('/deadlock/player/:steamId', async (req, res) => {
  try {
    const profile = await fetchPlayerProfile(req.params.steamId);
    if (!profile) {
      res.status(404).json({ success: false, error: 'Player not found' });
      return;
    }
    res.json({ success: true, data: profile });
  } catch (error) {
    console.error('[leaderboards] GET player error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch player profile',
    });
  }
});

leaderboardsRouter.get('/deadlock/heroes', async (_req, res) => {
  try {
    const heroes = await fetchHeroAssetsList();
    res.json({ success: true, data: heroes });
  } catch (error) {
    console.error('[leaderboards] GET heroes error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch hero assets',
    });
  }
});
