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

export function getStorageProvider(): StorageProvider {
  return process.env.STORAGE_PROVIDER === 's3' ? 's3' : 'local';
}

export function getUploadsRoot(): string {
  return uploadsRoot;
}

export function getTempUploadDir(): string {
  return path.join(uploadsRoot, 'tmp');
}

function getS3Client(): S3Client {
  if (s3Client) return s3Client;

  const region = process.env.AWS_REGION ?? 'us-east-1';
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

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: storageKey,
      Body: body,
      ContentType: 'application/octet-stream',
    })
  );

  await fs.unlink(tempFilePath).catch(() => undefined);
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
  // Legacy absolute paths from earlier local-only uploads
  if (path.isAbsolute(storageKeyOrPath)) {
    return fs.readFile(storageKeyOrPath);
  }

  if (getStorageProvider() === 'local') {
    return fs.readFile(path.join(uploadsRoot, storageKeyOrPath));
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
  const tmpPath = path.join(os.tmpdir(), `coachcore-${uuid()}.dem`);
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
