import type {
  RlBoostAnalysis,
  RlCoachInsight,
  RlDefenseBreakdown,
  RlHeatmapData,
  RlParsedReplay,
  RlRotationAnalysis,
  RlShotBreakdown,
} from '@coachcore/shared';

export function analyzeRlBoost(replay: RlParsedReplay, insights: RlCoachInsight[]): RlBoostAnalysis {
  const subject = replay.subjectPlayerId;
  const pickups = replay.boostPickups.filter((p) => p.playerId === subject);
  const big = pickups.filter((p) => p.isBigPad);
  const small = pickups.filter((p) => !p.isBigPad);
  const starve = insights.filter((i) => i.eventType === 'missed_boost').length;
  const tracks = replay.playerTracks.filter((t) => t.playerId === subject);
  const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

  return {
    boostWasted: Math.round(starve * 28 + Math.max(0, big.length - small.length) * 8),
    bigPadPickups: big.length,
    smallPadPickups: small.length,
    bigPadDependency: pickups.length ? Math.round((big.length / pickups.length) * 100) : 50,
    starvationEvents: starve,
    avgBoostOnAerial: Math.round(avg(tracks.filter((t) => !t.onGround).map((t) => t.boost))),
    avgBoostOnRecovery: Math.round(avg(tracks.filter((t) => t.boost < 20).map((t) => t.boost))),
    avgBoostOnRotation: Math.round(avg(tracks.map((t) => t.boost))),
    pathNotes: [
      small.length < big.length
        ? 'You lean on corner 100s — add back-wall small-pad loops when the big pad is dark.'
        : 'Small-pad usage looks healthy; keep chaining pads on defense rotates.',
      starve
        ? `${starve} starvation moment(s) detected — pre-check pad availability before committing to a corner path.`
        : 'No major starvation events tagged.',
    ],
    isEstimate: replay.source !== 'ballchasing',
  };
}

export function analyzeRlRotation(
  replay: RlParsedReplay,
  insights: RlCoachInsight[]
): RlRotationAnalysis {
  const m = insights.filter((i) => i.polarity === 'mistake');
  return {
    doubleCommits: m.filter((i) => i.eventType === 'double_commit').length,
    ballChases: m.filter((i) => i.category === 'rotation' && i.title.toLowerCase().includes('chase')).length,
    cutRotations: m.filter((i) => i.eventType === 'bad_rotation').length,
    slowRotations: 0,
    backPostMistakes: m.filter((i) => i.eventType === 'overcommit').length,
    overcommits: m.filter((i) => i.eventType === 'overcommit').length,
    undercommits: 0,
    spacingIssues: m.filter((i) => i.eventType === 'double_commit').length,
    notes: [
      'Back-post shadow is the default when teammate is first man.',
      'If you see two boost trails into the ball, you are already late — peel.',
    ],
    isEstimate: true,
  };
}

export function analyzeRlShots(replay: RlParsedReplay): RlShotBreakdown[] {
  return replay.events
    .filter((e) => e.type === 'shot' || e.type === 'missed_open_net' || (e.type === 'goal' && e.actorId === replay.subjectPlayerId))
    .map((e) => ({
      eventId: e.id,
      timestamp: e.t,
      difficulty: e.type === 'missed_open_net' ? 2 : 6,
      placement: e.type === 'missed_open_net' ? 'wide/over' : 'on-frame',
      power: Math.min(100, Math.round((e.speed ?? 1200) / 25)),
      angle: 'central',
      shotQuality: e.type === 'goal' ? 85 : e.type === 'missed_open_net' ? 15 : 55,
      scoringProbability: e.type === 'goal' ? 0.72 : e.type === 'missed_open_net' ? 0.81 : 0.34,
      alternativeShot:
        e.type === 'missed_open_net'
          ? 'Soft ground push, no jump, far post'
          : 'Far-post power if keeper recovering from near post',
      passOpportunity: e.type === 'shot' ? 'Could dump to teammate back-post' : undefined,
      boostUsed: e.boost ?? 0,
      mechanicsUsed: e.type === 'goal' ? ['power shot'] : ['ground touch'],
      xg: e.type === 'goal' ? 0.72 : e.type === 'missed_open_net' ? 0.81 : 0.34,
      isEstimate: true,
    }));
}

export function analyzeRlDefense(
  replay: RlParsedReplay,
  insights: RlCoachInsight[]
): RlDefenseBreakdown {
  const saves = insights.filter((i) => i.eventType === 'save').length;
  const excellents = insights.filter((i) => i.polarity === 'excellent' && i.category === 'defense').length;
  return {
    goalLineSaves: saves,
    shadowDefenseScore: 60 + excellents * 12,
    backboardDefenseScore: saves ? 75 : 55,
    challengeTimingScore: Math.max(30, 70 - insights.filter((i) => i.eventType === 'overcommit').length * 15),
    saveQuality: saves ? 78 : 50,
    recoveryAfterSave: 62,
    clearQuality: 58,
    notes: [
      'Prefer backboard saves when the ball is high — doorstep clears invite double taps.',
      'Shadow until the attacker’s touch leaves their hood.',
    ],
    isEstimate: true,
  };
}

export function generateRlHeatmaps(replay: RlParsedReplay): RlHeatmapData[] {
  const subject = replay.subjectPlayerId;
  const tracks = replay.playerTracks.filter((t) => t.playerId === subject);
  const movement = tracks
    .filter((_, i) => i % 4 === 0)
    .map((t) => ({ x: t.x, y: t.y, weight: 1, t: t.t }));

  const boost = replay.boostPickups
    .filter((p) => p.playerId === subject)
    .map((p) => ({ x: p.x, y: p.y, weight: p.isBigPad ? 3 : 1, t: p.t, label: p.isBigPad ? '100' : 'small' }));

  const byType = (types: string[]): RlHeatmapData['points'] =>
    replay.events
      .filter((e) => types.includes(e.type) && (!e.actorId || e.actorId === subject))
      .map((e) => ({
        x: e.position?.x ?? 0,
        y: e.position?.y ?? 0,
        weight: 2,
        t: e.t,
        label: e.label,
      }));

  return [
    { type: 'movement', points: movement, filter: 'all' },
    { type: 'boost', points: boost, filter: 'all' },
    { type: 'ball_touches', points: movement.filter((_, i) => i % 6 === 0), filter: 'all' },
    { type: 'shots', points: byType(['shot', 'missed_open_net', 'goal']), filter: 'all' },
    { type: 'goals', points: byType(['goal']), filter: 'all' },
    { type: 'defense', points: byType(['save', 'excellent_play']), filter: 'all' },
    { type: 'challenges', points: byType(['overcommit', 'poor_challenge', 'double_commit']), filter: 'all' },
    { type: 'demos', points: byType(['demo']), filter: 'all' },
    { type: 'whiffs', points: byType(['whiff']), filter: 'all' },
    { type: 'offense', points: byType(['shot', 'assist', 'goal', 'aerial']), filter: 'all' },
    { type: 'possession', points: movement.filter((_, i) => i % 8 === 0), filter: 'all' },
  ];
}
