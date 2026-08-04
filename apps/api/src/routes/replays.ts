import { Router, type Request, type Response, type NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { prisma } from '../lib/prisma.js';
import { enqueueReplayProcessing } from '../jobs/replay-worker.js';
import {
  getTempUploadDir,
  makeReplayStorageKey,
  putReplayFile,
} from '../lib/storage.js';

const tempDir = getTempUploadDir();

/** Deadlock .dem files are often 200–800+ MB; keep a high default. */
export function getMaxReplaySizeMb(): number {
  const parsed = Number(process.env.MAX_REPLAY_SIZE_MB);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1500;
}

function getMaxReplayBytes(): number {
  return Math.floor(getMaxReplaySizeMb() * 1024 * 1024);
}

const diskStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    void fs
      .mkdir(tempDir, { recursive: true })
      .then(() => cb(null, tempDir))
      .catch((err) => cb(err as Error, tempDir));
  },
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage: diskStorage,
  limits: { fileSize: getMaxReplayBytes() },
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

function uploadMiddleware(req: Request, res: Response, next: NextFunction) {
  upload.single('replay')(req, res, (err: unknown) => {
    if (err) {
      const raw = err instanceof Error ? err.message : 'Upload failed';
      const isTooLarge =
        raw === 'File too large' ||
        (typeof err === 'object' &&
          err !== null &&
          'code' in err &&
          (err as { code?: string }).code === 'LIMIT_FILE_SIZE');
      if (isTooLarge) {
        return res.status(413).json({
          success: false,
          error: `File too large — max ${getMaxReplaySizeMb()} MB. Set MAX_REPLAY_SIZE_MB on the API if you need more.`,
        });
      }
      return res.status(400).json({ success: false, error: raw });
    }
    next();
  });
}

replayRouter.post('/upload', uploadMiddleware, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const user = await resolveUser(req);
    if (!user) {
      await fs.unlink(req.file.path).catch(() => undefined);
      return res.status(401).json({ success: false, error: 'Sign in to upload replays' });
    }

    const subjectSteamId =
      typeof req.body?.subjectSteamId === 'string' && req.body.subjectSteamId.trim()
        ? req.body.subjectSteamId.trim()
        : undefined;

    const storageKey = makeReplayStorageKey(user.id, req.file.originalname);
    await putReplayFile(storageKey, req.file.path);

    const replay = await prisma.replay.create({
      data: {
        userId: user.id,
        fileName: req.file.originalname,
        filePath: storageKey,
        fileSize: req.file.size,
        status: 'queued',
        stage: 'queued',
      },
    });

    await enqueueReplayProcessing({
      replayId: replay.id,
      filePath: storageKey,
      userId: user.id,
      subjectSteamId,
    });

    res.json({
      success: true,
      data: { replayId: replay.id, status: 'queued' },
    });
  } catch (error) {
    console.error('[replays] upload error:', error);
    if (req.file?.path) {
      await fs.unlink(req.file.path).catch(() => undefined);
    }
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
