import { prisma } from '../lib/prisma.js';
import { getParserForFile } from '@coachcore/replay-parser';
import { runCoachingPipeline } from '@coachcore/ai-coach';
import { broadcastReplayStatus } from '../ws/replay-ws.js';
import fs from 'fs/promises';

export interface ReplayJobData {
  replayId: string;
  filePath: string;
  userId: string;
}

export function isLocalDevMode(): boolean {
  return process.env.LOCAL_DEV === 'true';
}

async function updateStatus(
  replayId: string,
  stage: string,
  progress: number,
  message: string,
  status?: string
) {
  await prisma.replay.update({
    where: { id: replayId },
    data: {
      stage,
      progress,
      status: status ?? 'processing',
    },
  });

  broadcastReplayStatus(replayId, {
    replayId,
    stage: stage as never,
    progress,
    message,
  });
}

/** Process a replay without Redis/BullMQ — used in LOCAL_DEV mode */
export async function processReplayInline(replayId: string, filePath: string) {
  try {
    await updateStatus(replayId, 'parsing', 5, 'Reading replay file...');

    const buffer = await fs.readFile(filePath);
    const parser = getParserForFile(buffer);

    if (!parser) {
      throw new Error('No parser available for this file format');
    }

    const validation = await parser.validate(buffer);
    if (!validation.valid) {
      throw new Error(validation.errors.join(', '));
    }

    await updateStatus(replayId, 'parsing', 20, `Parsing with ${parser.name}...`);
    const parsed = await parser.parse(buffer);

    await prisma.replay.update({
      where: { id: replayId },
      data: {
        hero: parsed.metadata.players.find((p) => p.isSubject)?.hero,
        map: parsed.metadata.map,
        durationSeconds: parsed.metadata.durationSeconds,
        gameMode: parsed.metadata.gameMode,
        version: parsed.metadata.version,
        metadata: parsed.metadata as object,
        parserNotes: parsed.parserNotes,
      },
    });

    const report = await runCoachingPipeline(replayId, parsed, (stage, progress, message) => {
      void updateStatus(replayId, stage, progress, message);
    });

    await prisma.coachingReport.create({
      data: {
        replayId,
        grade: report.overallGrade,
        score: report.overallScore,
        report: report as object,
      },
    });

    await updateStatus(replayId, 'complete', 100, 'Analysis complete!', 'complete');
    return { replayId, grade: report.overallGrade };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    await prisma.replay.update({
      where: { id: replayId },
      data: { status: 'failed', errorMessage: message, stage: 'failed' },
    });
    broadcastReplayStatus(replayId, {
      replayId,
      stage: 'failed',
      progress: 0,
      message,
      error: message,
    });
    throw error;
  }
}

export async function enqueueReplayProcessing(data: ReplayJobData): Promise<void> {
  if (isLocalDevMode()) {
    // Fire-and-forget inline processing — no Redis required
    void processReplayInline(data.replayId, data.filePath);
    return;
  }

  const { replayQueue } = await import('./replay-queue.js');
  await replayQueue.add('process-replay', data);
}

export function startReplayWorker(): void {
  if (isLocalDevMode()) {
    console.log('LOCAL_DEV mode — using inline replay processing (no Redis)');
    return;
  }

  void import('./replay-queue.js').then(({ startBullWorker }) => {
    startBullWorker();
    console.log('Replay worker started');
  });
}
