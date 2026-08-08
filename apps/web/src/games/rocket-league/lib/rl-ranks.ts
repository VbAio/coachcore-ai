import type { RlLeaderboardPlaylist } from '@coachcore/shared';

export type RlRankSlug =
  | 'bronze-1'
  | 'bronze-2'
  | 'bronze-3'
  | 'silver-1'
  | 'silver-2'
  | 'silver-3'
  | 'gold-1'
  | 'gold-2'
  | 'gold-3'
  | 'platinum-1'
  | 'platinum-2'
  | 'platinum-3'
  | 'diamond-1'
  | 'diamond-2'
  | 'diamond-3'
  | 'champion-1'
  | 'champion-2'
  | 'champion-3'
  | 'grand-champion-1'
  | 'grand-champion-2'
  | 'grand-champion-3'
  | 'supersonic-legend';

export interface RlRankInfo {
  slug: RlRankSlug;
  name: string;
  shortName: string;
  iconSrc: string;
}

/** Approximate seasonal rating floors (playlist-aware). Leaderboard tops are SSL. */
const THRESHOLDS: Record<RlLeaderboardPlaylist, Array<[number, RlRankSlug, string, string]>> = {
  // highest floor first
  '1v1': [
    [1515, 'supersonic-legend', 'Supersonic Legend', 'SSL'],
    [1430, 'grand-champion-3', 'Grand Champion III', 'GC3'],
    [1345, 'grand-champion-2', 'Grand Champion II', 'GC2'],
    [1260, 'grand-champion-1', 'Grand Champion I', 'GC1'],
    [1175, 'champion-3', 'Champion III', 'C3'],
    [1090, 'champion-2', 'Champion II', 'C2'],
    [1005, 'champion-1', 'Champion I', 'C1'],
    [920, 'diamond-3', 'Diamond III', 'D3'],
    [835, 'diamond-2', 'Diamond II', 'D2'],
    [750, 'diamond-1', 'Diamond I', 'D1'],
    [665, 'platinum-3', 'Platinum III', 'P3'],
    [580, 'platinum-2', 'Platinum II', 'P2'],
    [495, 'platinum-1', 'Platinum I', 'P1'],
    [410, 'gold-3', 'Gold III', 'G3'],
    [340, 'gold-2', 'Gold II', 'G2'],
    [270, 'gold-1', 'Gold I', 'G1'],
    [210, 'silver-3', 'Silver III', 'S3'],
    [160, 'silver-2', 'Silver II', 'S2'],
    [110, 'silver-1', 'Silver I', 'S1'],
    [70, 'bronze-3', 'Bronze III', 'B3'],
    [35, 'bronze-2', 'Bronze II', 'B2'],
    [0, 'bronze-1', 'Bronze I', 'B1'],
  ],
  '2v2': [
    [1860, 'supersonic-legend', 'Supersonic Legend', 'SSL'],
    [1715, 'grand-champion-3', 'Grand Champion III', 'GC3'],
    [1575, 'grand-champion-2', 'Grand Champion II', 'GC2'],
    [1435, 'grand-champion-1', 'Grand Champion I', 'GC1'],
    [1315, 'champion-3', 'Champion III', 'C3'],
    [1195, 'champion-2', 'Champion II', 'C2'],
    [1075, 'champion-1', 'Champion I', 'C1'],
    [995, 'diamond-3', 'Diamond III', 'D3'],
    [915, 'diamond-2', 'Diamond II', 'D2'],
    [835, 'diamond-1', 'Diamond I', 'D1'],
    [775, 'platinum-3', 'Platinum III', 'P3'],
    [715, 'platinum-2', 'Platinum II', 'P2'],
    [655, 'platinum-1', 'Platinum I', 'P1'],
    [595, 'gold-3', 'Gold III', 'G3'],
    [535, 'gold-2', 'Gold II', 'G2'],
    [475, 'gold-1', 'Gold I', 'G1'],
    [415, 'silver-3', 'Silver III', 'S3'],
    [355, 'silver-2', 'Silver II', 'S2'],
    [295, 'silver-1', 'Silver I', 'S1'],
    [229, 'bronze-3', 'Bronze III', 'B3'],
    [175, 'bronze-2', 'Bronze II', 'B2'],
    [0, 'bronze-1', 'Bronze I', 'B1'],
  ],
  '3v3': [
    [1860, 'supersonic-legend', 'Supersonic Legend', 'SSL'],
    [1715, 'grand-champion-3', 'Grand Champion III', 'GC3'],
    [1575, 'grand-champion-2', 'Grand Champion II', 'GC2'],
    [1435, 'grand-champion-1', 'Grand Champion I', 'GC1'],
    [1315, 'champion-3', 'Champion III', 'C3'],
    [1195, 'champion-2', 'Champion II', 'C2'],
    [1075, 'champion-1', 'Champion I', 'C1'],
    [995, 'diamond-3', 'Diamond III', 'D3'],
    [915, 'diamond-2', 'Diamond II', 'D2'],
    [835, 'diamond-1', 'Diamond I', 'D1'],
    [775, 'platinum-3', 'Platinum III', 'P3'],
    [715, 'platinum-2', 'Platinum II', 'P2'],
    [655, 'platinum-1', 'Platinum I', 'P1'],
    [595, 'gold-3', 'Gold III', 'G3'],
    [535, 'gold-2', 'Gold II', 'G2'],
    [475, 'gold-1', 'Gold I', 'G1'],
    [415, 'silver-3', 'Silver III', 'S3'],
    [355, 'silver-2', 'Silver II', 'S2'],
    [295, 'silver-1', 'Silver I', 'S1'],
    [229, 'bronze-3', 'Bronze III', 'B3'],
    [175, 'bronze-2', 'Bronze II', 'B2'],
    [0, 'bronze-1', 'Bronze I', 'B1'],
  ],
};

export function rankFromRating(
  rating: number,
  playlist: RlLeaderboardPlaylist
): RlRankInfo {
  const table = THRESHOLDS[playlist];
  for (const [floor, slug, name, shortName] of table) {
    if (rating >= floor) {
      return {
        slug,
        name,
        shortName,
        iconSrc: `/ranks/rl/${slug}.png`,
      };
    }
  }
  return {
    slug: 'bronze-1',
    name: 'Bronze I',
    shortName: 'B1',
    iconSrc: '/ranks/rl/bronze-1.png',
  };
}
