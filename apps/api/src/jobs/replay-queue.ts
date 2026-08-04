import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { processReplayInline, type ReplayJobData } from './replay-worker.js';

const connection = new IORedis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

export const replayQueue = new Queue('replay-processing', { connection });

export function startBullWorker() {
  const worker = new Worker<ReplayJobData>(
    'replay-processing',
    async (job: Job<ReplayJobData>) => {
      return processReplayInline(
        job.data.replayId,
        job.data.filePath,
        job.data.subjectSteamId
      );
    },
    { connection, concurrency: 2 }
  );

  worker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} failed:`, err.message);
  });

  return worker;
}
