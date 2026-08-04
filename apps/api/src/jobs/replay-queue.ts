import { Queue, Worker, Job, type ConnectionOptions } from 'bullmq';
import IORedis from 'ioredis';
import { processReplayInline, type ReplayJobData } from './replay-worker.js';

let connection: IORedis | null = null;
let replayQueue: Queue<ReplayJobData> | null = null;

function getRedisConnection(): IORedis {
  if (connection) return connection;

  const url = process.env.REDIS_URL;
  if (!url) {
    throw new Error('REDIS_URL is not set');
  }

  connection = new IORedis(url, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });

  connection.on('error', (err) => {
    console.error('[redis] connection error:', err.message);
  });

  return connection;
}

export function getReplayQueue(): Queue<ReplayJobData> {
  if (replayQueue) return replayQueue;
  replayQueue = new Queue<ReplayJobData>('replay-processing', {
    connection: getRedisConnection() as ConnectionOptions,
  });
  return replayQueue;
}

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
    {
      connection: getRedisConnection() as ConnectionOptions,
      concurrency: 2,
    }
  );

  worker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} failed:`, err.message);
  });

  return worker;
}
