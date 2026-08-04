import express from 'express';
import cors from 'cors';
import http from 'http';
import dotenv from 'dotenv';
import { getMaxReplaySizeMb, replayRouter } from './routes/replays.js';
import { coachRouter } from './routes/coach.js';
import { leaderboardsRouter } from './routes/leaderboards.js';
import { setupWebSocket } from './ws/replay-ws.js';
import { startReplayWorker } from './jobs/replay-worker.js';
import { getStorageProvider, getStorageWarning, getTempUploadDir } from './lib/storage.js';
import fs from 'node:fs/promises';

dotenv.config({ path: '../../.env' });
dotenv.config();

const app = express();
/** Railway injects PORT; fall back to API_PORT / 4000 for local. */
const port = Number(process.env.PORT || process.env.API_PORT) || 4000;

void fs.mkdir(getTempUploadDir(), { recursive: true }).catch((err) => {
  console.error('Failed to create upload temp dir:', err);
});

const storageWarning = getStorageWarning();
if (storageWarning) {
  console.error(`[storage] ${storageWarning}`);
}

function parseCorsOrigins(): string | string[] | boolean {
  const raw = process.env.CORS_ORIGIN ?? 'http://localhost:3000';
  const origins = raw
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  if (origins.length === 0) return true;
  if (origins.length === 1) return origins[0];
  return origins;
}

app.use(
  cors({
    origin: parseCorsOrigins(),
    credentials: true,
  })
);
app.use(express.json({ limit: '2mb' }));

app.get('/health', (_req, res) => {
  const warning = getStorageWarning();
  res.json({
    status: 'ok',
    service: 'coachcore-api',
    storage: getStorageProvider(),
    localDev: process.env.LOCAL_DEV === 'true',
    maxReplaySizeMb: getMaxReplaySizeMb(),
    ...(warning ? { storageWarning: warning } : {}),
  });
});

app.get('/api/docs', (_req, res) => {
  res.json({
    name: 'CoachCore AI API',
    version: '1.0.0',
    endpoints: {
      'GET /health': 'Health check',
      'POST /api/replays/upload': 'Upload .dem replay (multipart/form-data, field: replay)',
      'GET /api/replays': 'List user replays',
      'GET /api/replays/:id': 'Get replay details',
      'GET /api/replays/:id/status': 'Get processing status',
      'GET /api/replays/:id/report': 'Get coaching report',
      'POST /api/coach/:replayId/chat': 'Chat with AI coach',
      'GET /api/coach/dashboard': 'Dashboard stats',
      'GET /api/leaderboards/deadlock': 'Deadlock live leaderboard',
      'GET /api/leaderboards/deadlock/player/:steamId': 'Player profile',
      'GET /api/leaderboards/deadlock/heroes': 'Hero assets for filters',
      'WS /ws?replayId=:id': 'Live processing updates',
    },
  });
});

app.use('/api/replays', replayRouter);
app.use('/api/coach', coachRouter);
app.use('/api/leaderboards', leaderboardsRouter);

const server = http.createServer(app);
setupWebSocket(server);

// Listen first so Railway healthchecks succeed even if the worker is misconfigured.
server.listen(port, '0.0.0.0', () => {
  console.log(`CoachCore API running on http://0.0.0.0:${port}`);
  console.log(`Storage provider: ${getStorageProvider()}`);
  console.log(`LOCAL_DEV: ${process.env.LOCAL_DEV === 'true'}`);
  try {
    startReplayWorker();
  } catch (err) {
    console.error('Replay worker failed to start:', err);
  }
});
