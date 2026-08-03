import express from 'express';
import cors from 'cors';
import http from 'http';
import dotenv from 'dotenv';
import { replayRouter } from './routes/replays.js';
import { coachRouter } from './routes/coach.js';
import { leaderboardsRouter } from './routes/leaderboards.js';
import { setupWebSocket } from './ws/replay-ws.js';
import { startReplayWorker } from './jobs/replay-worker.js';

dotenv.config({ path: '../../.env' });
dotenv.config();

const app = express();
const port = Number(process.env.API_PORT) || 4000;

app.use(cors({ origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000' }));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'coachcore-api' });
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

startReplayWorker();

server.listen(port, () => {
  console.log(`CoachCore API running on http://localhost:${port}`);
});
