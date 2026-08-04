import { Router, type Request } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuid } from 'uuid';
import { prisma } from '../lib/prisma.js';
import { enqueueReplayProcessing } from '../jobs/replay-worker.js';

const uploadDir = path.join(process.cwd(), 'uploads');
const storage = multer.diskStorage({
  destination: async (_req, _file, cb) => {
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    cb(null, `${uuid()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: (Number(process.env.MAX_REPLAY_SIZE_MB) || 500) * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (path.extname(file.originalname).toLowerCase() === '.dem') {
      cb(null, true);
    } else {
      cb(new Error('Only .dem replay files are allowed'));
    }
  },
});

export const replayRouter = Router();

async function resolveUser(req: Request) {
  const userId = req.headers['x-user-id'] as string | undefined;
  if (!userId) return null;
  return prisma.user.findUnique({ where: { id: userId } });
}

replayRouter.post('/upload', upload.single('replay'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const user = await resolveUser(req);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Sign in to upload replays' });
    }

    const subjectSteamId =
      typeof req.body?.subjectSteamId === 'string' && req.body.subjectSteamId.trim()
        ? req.body.subjectSteamId.trim()
        : undefined;

    const replay = await prisma.replay.create({
      data: {
        userId: user.id,
        fileName: req.file.originalname,
        filePath: req.file.path,
        fileSize: req.file.size,
        status: 'queued',
        stage: 'queued',
      },
    });

    await enqueueReplayProcessing({
      replayId: replay.id,
      filePath: req.file.path,
      userId: user.id,
      subjectSteamId,
    });

    res.json({
      success: true,
      data: { replayId: replay.id, status: 'queued' },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    });
  }
});

replayRouter.get('/', async (req, res) => {
  const user = await resolveUser(req);

  if (!user) {
    return res.json({ success: true, data: { items: [], total: 0 } });
  }

  const replays = await prisma.replay.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    include: { report: true },
    take: 50,
  });

  res.json({
    success: true,
    data: {
      items: replays.map((r) => ({
        id: r.id,
        fileName: r.fileName,
        hero: r.hero ?? 'Unknown',
        map: r.map ?? 'Unknown',
        durationSeconds: r.durationSeconds ?? 0,
        grade: r.report?.grade,
        status: r.status,
        createdAt: r.createdAt.toISOString(),
      })),
      total: replays.length,
    },
  });
});

replayRouter.get('/:id', async (req, res) => {
  const replay = await prisma.replay.findUnique({
    where: { id: req.params.id },
    include: { report: true },
  });

  if (!replay) {
    return res.status(404).json({ success: false, error: 'Replay not found' });
  }

  res.json({ success: true, data: replay });
});

replayRouter.get('/:id/status', async (req, res) => {
  const replay = await prisma.replay.findUnique({
    where: { id: req.params.id },
    select: { id: true, status: true, stage: true, progress: true, errorMessage: true },
  });

  if (!replay) {
    return res.status(404).json({ success: false, error: 'Replay not found' });
  }

  res.json({
    success: true,
    data: {
      replayId: replay.id,
      stage: replay.stage,
      progress: replay.progress,
      message: replay.status,
      error: replay.errorMessage,
    },
  });
});

replayRouter.get('/:id/report', async (req, res) => {
  const report = await prisma.coachingReport.findUnique({
    where: { replayId: req.params.id },
  });

  if (!report) {
    return res.status(404).json({ success: false, error: 'Report not ready' });
  }

  res.json({ success: true, data: report.report });
});
