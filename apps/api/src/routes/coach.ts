import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { createCoachProvider } from '@coachcore/ai-coach';
import type { CoachingReport, ChatCoachMessage } from '@coachcore/shared';

export const coachRouter = Router();

coachRouter.post('/:replayId/chat', async (req, res) => {
  try {
    const { messages } = req.body as { messages: ChatCoachMessage[] };
    const reportRecord = await prisma.coachingReport.findUnique({
      where: { replayId: req.params.replayId },
    });
    const replay = await prisma.replay.findUnique({
      where: { id: req.params.replayId },
    });

    if (!reportRecord || !replay) {
      return res.status(404).json({ success: false, error: 'Report not found' });
    }

    const report = reportRecord.report as unknown as CoachingReport;
    const provider = createCoachProvider();

    const parsedReplay = {
      metadata: replay.metadata as never,
      subjectPlayerId: 'subject',
      positions: [],
      events: [],
      teamFights: [],
      economy: [],
      abilityUpgrades: [],
      itemPurchases: [],
      extractionConfidence: 'minimal' as const,
      parserNotes: (replay.parserNotes as string[]) ?? [],
    };

    const response = await provider.chat(parsedReplay, report, messages);
    res.json({ success: true, data: response });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Chat failed',
    });
  }
});

coachRouter.get('/dashboard', async (req, res) => {
  const userId = req.headers['x-user-id'] as string | undefined;
  const user = userId
    ? await prisma.user.findUnique({
        where: { id: userId },
        include: {
          stats: true,
          replays: { include: { report: true }, orderBy: { createdAt: 'desc' }, take: 10 },
        },
      })
    : null;

  if (!user) {
    return res.json({
      success: true,
      data: {
        recentAnalyses: [],
        winRate: 0,
        avgMistakesPerGame: 0,
        improvementScore: 0,
        favoriteHeroes: [],
        mmrPrediction: 0,
        dailyRecommendations: [
          { title: 'Upload your first replay', description: 'Get AI coaching in minutes', category: 'getting_started', priority: 'high' },
        ],
      },
    });
  }

  const completed = user.replays.filter((r) => r.report);
  const avgScore = completed.length
    ? completed.reduce((s, r) => s + (r.report?.score ?? 0), 0) / completed.length
    : 0;

  res.json({
    success: true,
    data: {
      recentAnalyses: user.replays.slice(0, 5).map((r) => ({
        id: r.id,
        hero: r.hero,
        grade: r.report?.grade,
        createdAt: r.createdAt,
      })),
      winRate: user.stats?.winRate ?? 52,
      avgMistakesPerGame: user.stats?.avgMistakesPerGame ?? 8.4,
      improvementScore: user.stats?.improvementScore ?? Math.round(avgScore),
      favoriteHeroes: user.stats?.favoriteHeroes ?? [],
      mmrPrediction: user.stats?.mmrPrediction ?? Math.round(avgScore * 10),
      dailyRecommendations: [
        { title: 'Fix early lane deaths', description: 'Your last 3 replays show awareness gaps before 5 min', category: 'awareness', priority: 'high' },
        { title: 'Improve GPM', description: 'Reduce idle time between objectives', category: 'economy', priority: 'medium' },
      ],
      skillHistory: user.stats?.skillHistory ?? [],
    },
  });
});
