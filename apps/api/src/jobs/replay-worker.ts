import { prisma } from '../lib/prisma.js';
import {
  getParserForFile,
  isRocketLeagueFileName,
  RocketLeagueReplayParser,
} from '@clutchcore/replay-parser';
import { runCoachingPipeline, runRlCoachingPipeline } from '@clutchcore/ai-coach';
import { buildMatchTimeline, buildRlMatchTimeline } from '@clutchcore/shared';
import { broadcastReplayStatus } from '../ws/replay-ws.js';
import { getReplayBuffer } from '../lib/storage.js';

export interface ReplayJobData {
  replayId: string;
  /** Storage key (or legacy absolute filesystem path) */
  filePath: string;
  userId: string;
  subjectSteamId?: string;
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

function metadataGame(metadata: unknown): string | undefined {
  if (!metadata || typeof metadata !== 'object') return undefined;
  const game = (metadata as { game?: unknown }).game;
  return typeof game === 'string' ? game : undefined;
}

/** Process a replay — works with local disk keys or S3 keys in filePath */
export async function processReplayInline(
  replayId: string,
  filePath: string,
  subjectSteamId?: string
) {
  try {
    await updateStatus(replayId, 'parsing', 5, 'Reading replay file...');

    const replayRow = await prisma.replay.findUnique({
      where: { id: replayId },
      select: { fileName: true, metadata: true },
    });
    const fileName = replayRow?.fileName ?? '';
    const taggedGame = metadataGame(replayRow?.metadata);

    const buffer = await getReplayBuffer(filePath);
    const parser = getParserForFile(buffer, fileName);

    if (!parser) {
      throw new Error('No parser available for this file format');
    }

    const validation = await parser.validate(buffer);
    if (!validation.valid) {
      throw new Error(validation.errors.join(', '));
    }

    const isRocketLeague =
      taggedGame === 'rocket-league' ||
      parser.name === 'rocket-league' ||
      isRocketLeagueFileName(fileName);

    if (isRocketLeague) {
      const rlParser =
        parser instanceof RocketLeagueReplayParser
          ? parser
          : new RocketLeagueReplayParser();

      await updateStatus(replayId, 'parsing', 20, 'Parsing Rocket League replay...');
      const parsed = await rlParser.parseRl(buffer, subjectSteamId);
      const matchTimeline = buildRlMatchTimeline(parsed, replayId);
      const subject = parsed.metadata.players.find((p) => p.isSubject);

      await prisma.replay.update({
        where: { id: replayId },
        data: {
          hero: subject?.name ?? 'Rocket League',
          map: parsed.metadata.map,
          durationSeconds: parsed.metadata.durationSeconds,
          gameMode: parsed.metadata.playlist,
          version: parsed.metadata.version ?? 'rl',
          metadata: {
            ...parsed.metadata,
            game: 'rocket-league',
          } as object,
          parserNotes: parsed.parserNotes,
          timeline: matchTimeline as object,
        },
      });

      const report = await runRlCoachingPipeline(replayId, parsed, (stage, progress, message) => {
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

      const owner = await prisma.replay.findUnique({
        where: { id: replayId },
        select: { userId: true },
      });
      if (owner?.userId) {
        const { recomputeUserStats } = await import('../services/user-stats.js');
        await recomputeUserStats(owner.userId);
      }

      await updateStatus(replayId, 'complete', 100, 'Analysis complete!', 'complete');
      return { replayId, grade: report.overallGrade };
    }

    await updateStatus(replayId, 'parsing', 20, `Parsing with ${parser.name}...`);
    const parsed = await parser.parse(buffer, subjectSteamId);

    const matchTimeline = buildMatchTimeline(parsed, replayId);

    await prisma.replay.update({
      where: { id: replayId },
      data: {
        hero: parsed.metadata.players.find((p) => p.isSubject)?.hero,
        map: parsed.metadata.map,
        durationSeconds: parsed.metadata.durationSeconds,
        gameMode: parsed.metadata.gameMode,
        version: parsed.metadata.version,
        metadata: {
          ...(parsed.metadata as object),
          game: 'deadlock',
        },
        parserNotes: parsed.parserNotes,
        timeline: matchTimeline as object,
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

    const replayOwner = await prisma.replay.findUnique({
      where: { id: replayId },
      select: { userId: true },
    });
    if (replayOwner?.userId) {
      const { recomputeUserStats } = await import('../services/user-stats.js');
      await recomputeUserStats(replayOwner.userId);
    }

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
    void processReplayInline(data.replayId, data.filePath, data.subjectSteamId);
    return;
  }

  try {
    const { getReplayQueue } = await import('./replay-queue.js');
    await getReplayQueue().add('process-replay', data);
  } catch (err) {
    console.error(
      '[replay] Queue enqueue failed — falling back to inline processing:',
      err instanceof Error ? err.message : err
    );
    void processReplayInline(data.replayId, data.filePath, data.subjectSteamId);
  }
}

export function startReplayWorker(): void {
  if (isLocalDevMode()) {
    console.log('LOCAL_DEV mode — using inline replay processing (no Redis)');
    return;
  }

  if (!process.env.REDIS_URL) {
    // Do not crash the HTTP server — healthchecks must still pass.
    console.error(
      'REDIS_URL is missing while LOCAL_DEV!=true. Replay queue disabled until REDIS_URL is set.'
    );
    return;
  }

  void import('./replay-queue.js')
    .then(({ startBullWorker }) => {
      startBullWorker();
      console.log('Replay worker started (BullMQ)');
    })
    .catch((err) => {
      console.error('Failed to start replay worker:', err);
    });
}
