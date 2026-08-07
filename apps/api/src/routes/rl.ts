import { Router } from 'express';
import { buildRlDemoFixture } from '@coachcore/replay-parser';
import { runRlCoachingPipeline } from '@coachcore/ai-coach';
import { buildRlMatchTimeline } from '@coachcore/shared';

export const rlRouter = Router();

/** Fixture-only showcase — no auth, no DB write */
rlRouter.get('/demo-report', async (_req, res) => {
  try {
    const replayId = 'rl-demo';
    const parsed = buildRlDemoFixture('You');
    const report = await runRlCoachingPipeline(replayId, parsed);
    const timeline = buildRlMatchTimeline(parsed, replayId);
    res.json({
      success: true,
      data: {
        report,
        timeline,
        game: 'rocket-league' as const,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Demo report failed',
    });
  }
});
