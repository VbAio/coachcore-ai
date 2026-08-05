import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { createCoachProvider } from '@coachcore/ai-coach';
import type { CoachingReport, ChatCoachMessage } from '@coachcore/shared';
import { getDashboardStatsForUser } from '../services/user-stats.js';

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
  try {
    const userId = req.headers['x-user-id'] as string | undefined;
    const data = await getDashboardStatsForUser(userId);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Dashboard failed',
    });
  }
});
