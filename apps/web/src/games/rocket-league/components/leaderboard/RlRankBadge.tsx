'use client';

import type { RlLeaderboardPlaylist } from '@coachcore/shared';
import { rankFromRating } from '../../lib/rl-ranks';

export function RlRankBadge({
  rating,
  playlist,
  size = 28,
}: {
  rating: number;
  playlist: RlLeaderboardPlaylist;
  size?: number;
}) {
  const rank = rankFromRating(rating, playlist);

  return (
    <span
      className="inline-flex shrink-0 items-center"
      title={`${rank.name} (est. from rating)`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={rank.iconSrc}
        alt={rank.name}
        width={size}
        height={size}
        className="h-7 w-7 object-contain drop-shadow-[0_1px_2px_rgba(0,0,0,0.55)]"
        loading="lazy"
      />
    </span>
  );
}
