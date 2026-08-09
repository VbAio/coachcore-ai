import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { createReadStream } from 'node:fs';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { Readable } from 'node:stream';
import { v4 as uuid } from 'uuid';

export type StorageProvider = 'local' | 's3';

const uploadsRoot = path.join(process.cwd(), 'uploads');

let s3Client: S3Client | null = null;

function hasS3Config(): boolean {
  return Boolean(
    process.env.S3_BUCKET &&
      process.env.AWS_ACCESS_KEY_ID &&
      process.env.AWS_SECRET_ACCESS_KEY
  );
}

/**
 * Prefer S3/R2 when credentials are present.
 * Explicit STORAGE_PROVIDER=local forces local disk (dev only).
 */
export function getStorageProvider(): StorageProvider {
  const explicit = process.env.STORAGE_PROVIDER?.toLowerCase();
  if (explicit === 'local') return 'local';
  if (explicit === 's3') return 's3';
  // Auto: production-safe default when R2/S3 env is configured
  if (hasS3Config()) return 's3';
  return 'local';
}

export function getStorageWarning(): string | null {
  if (getStorageProvider() === 'local' && process.env.LOCAL_DEV !== 'true') {
    return (
      'STORAGE_PROVIDER is local while LOCAL_DEV!=true. Replay files are stored on ' +
      'ephemeral disk and will vanish across restarts (ENOENT). Set STORAGE_PROVIDER=s3 ' +
      'plus S3_BUCKET, S3_ENDPOINT, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY (Cloudflare R2).'
    );
  }
  if (process.env.STORAGE_PROVIDER === 's3' && !hasS3Config()) {
    return 'STORAGE_PROVIDER=s3 but S3_BUCKET / AWS credentials are incomplete.';
  }
  return null;
}

export function getUploadsRoot(): string {
  return uploadsRoot;
}

export function getTempUploadDir(): string {
  return path.join(uploadsRoot, 'tmp');
}

function getS3Client(): S3Client {
  if (s3Client) return s3Client;

  const region = process.env.AWS_REGION ?? 'auto';
  const endpoint = process.env.S3_ENDPOINT || undefined;

  s3Client = new S3Client({
    region,
    endpoint,
    forcePathStyle: Boolean(endpoint),
    credentials:
      process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
        ? {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
          }
        : undefined,
  });

  return s3Client;
}

function requireBucket(): string {
  const bucket = process.env.S3_BUCKET;
  if (!bucket) {
    throw new Error('S3_BUCKET is required when STORAGE_PROVIDER=s3');
  }
  return bucket;
}

function isEnoent(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code?: string }).code === 'ENOENT'
  );
}

/** Storage key stored in Replay.filePath for both local and S3. */
export function makeReplayStorageKey(userId: string, originalName: string): string {
  const ext = path.extname(originalName).toLowerCase() || '.dem';
  return `replays/${userId}/${uuid()}${ext}`;
}

async function ensureDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true });
}

/**
 * Persist a temp-uploaded file under the given storage key.
 * Local: moves into uploads/<key>. S3: uploads then deletes the temp file.
 */
export async function putReplayFile(storageKey: string, tempFilePath: string): Promise<void> {
  try {
    await fs.access(tempFilePath);
  } catch (err) {
    if (isEnoent(err)) {
      throw new Error(
        `Upload temp file missing (${tempFilePath}). Retry the upload — the file never reached disk.`
      );
    }
    throw err;
  }

  const provider = getStorageProvider();

  if (provider === 'local') {
    const dest = path.join(uploadsRoot, storageKey);
    await ensureDir(path.dirname(dest));
    await fs.rename(tempFilePath, dest).catch(async () => {
      await fs.copyFile(tempFilePath, dest);
      await fs.unlink(tempFilePath).catch(() => undefined);
    });
    return;
  }

  const bucket = requireBucket();
  const client = getS3Client();
  const body = createReadStream(tempFilePath);

  try {
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: storageKey,
        Body: body,
        ContentType: 'application/octet-stream',
      })
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to upload replay to object storage (${bucket}/${storageKey}): ${msg}`);
  } finally {
    await fs.unlink(tempFilePath).catch(() => undefined);
  }
}

async function streamToBuffer(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

/**
 * Load replay bytes from a storage key or legacy absolute filesystem path.
 */
export async function getReplayBuffer(storageKeyOrPath: string): Promise<Buffer> {
  try {
    // Legacy absolute paths from earlier local-only uploads
    if (path.isAbsolute(storageKeyOrPath)) {
      return await fs.readFile(storageKeyOrPath);
    }

    if (getStorageProvider() === 'local') {
      const full = path.join(uploadsRoot, storageKeyOrPath);
      return await fs.readFile(full);
    }

    const bucket = requireBucket();
    const client = getS3Client();
    const result = await client.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: storageKeyOrPath,
      })
    );

    if (!result.Body) {
      throw new Error(`Empty object body for ${storageKeyOrPath}`);
    }

    const body = result.Body as Readable;
    return streamToBuffer(body);
  } catch (err) {
    if (isEnoent(err)) {
      const provider = getStorageProvider();
      throw new Error(
        provider === 'local'
          ? `Replay file not found on disk (${storageKeyOrPath}). With local storage on Railway/ephemeral hosts, files disappear after restart — set STORAGE_PROVIDER=s3 and R2 credentials, then re-upload.`
          : `Replay file not found (${storageKeyOrPath}).`
      );
    }
    throw err;
  }
}

/**
 * Write replay bytes to a temp file for parsers that need a path, then return path + cleanup.
 */
export async function materializeReplayFile(
  storageKeyOrPath: string
): Promise<{ filePath: string; cleanup: () => Promise<void> }> {
  if (path.isAbsolute(storageKeyOrPath)) {
    return {
      filePath: storageKeyOrPath,
      cleanup: async () => undefined,
    };
  }

  if (getStorageProvider() === 'local') {
    return {
      filePath: path.join(uploadsRoot, storageKeyOrPath),
      cleanup: async () => undefined,
    };
  }

  const buffer = await getReplayBuffer(storageKeyOrPath);
  const tmpPath = path.join(os.tmpdir(), `clutchcore-${uuid()}.dem`);
  await fs.writeFile(tmpPath, buffer);
  return {
    filePath: tmpPath,
    cleanup: async () => {
      await fs.unlink(tmpPath).catch(() => undefined);
    },
  };
}

export async function deleteReplayFile(storageKeyOrPath: string): Promise<void> {
  if (path.isAbsolute(storageKeyOrPath)) {
    await fs.unlink(storageKeyOrPath).catch(() => undefined);
    return;
  }

  if (getStorageProvider() === 'local') {
    await fs.unlink(path.join(uploadsRoot, storageKeyOrPath)).catch(() => undefined);
    return;
  }

  const bucket = requireBucket();
  const client = getS3Client();
  await client.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: storageKeyOrPath,
    })
  );
}
