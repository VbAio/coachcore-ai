import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  getReplayBuffer,
  getStorageProvider,
  getUploadsRoot,
  makeReplayStorageKey,
  putReplayFile,
  deleteReplayFile,
} from './storage.js';

describe('storage local provider', () => {
  const prevProvider = process.env.STORAGE_PROVIDER;
  const prevBucket = process.env.S3_BUCKET;
  const prevKey = process.env.AWS_ACCESS_KEY_ID;
  const prevSecret = process.env.AWS_SECRET_ACCESS_KEY;

  beforeAll(() => {
    process.env.STORAGE_PROVIDER = 'local';
    delete process.env.S3_BUCKET;
    delete process.env.AWS_ACCESS_KEY_ID;
    delete process.env.AWS_SECRET_ACCESS_KEY;
  });

  afterAll(() => {
    if (prevProvider === undefined) delete process.env.STORAGE_PROVIDER;
    else process.env.STORAGE_PROVIDER = prevProvider;
    if (prevBucket === undefined) delete process.env.S3_BUCKET;
    else process.env.S3_BUCKET = prevBucket;
    if (prevKey === undefined) delete process.env.AWS_ACCESS_KEY_ID;
    else process.env.AWS_ACCESS_KEY_ID = prevKey;
    if (prevSecret === undefined) delete process.env.AWS_SECRET_ACCESS_KEY;
    else process.env.AWS_SECRET_ACCESS_KEY = prevSecret;
  });

  it('uses local when STORAGE_PROVIDER=local', () => {
    expect(getStorageProvider()).toBe('local');
  });

  it('auto-selects s3 when credentials exist and provider unset', () => {
    delete process.env.STORAGE_PROVIDER;
    process.env.S3_BUCKET = 'coachcore-replays';
    process.env.AWS_ACCESS_KEY_ID = 'key';
    process.env.AWS_SECRET_ACCESS_KEY = 'secret';
    expect(getStorageProvider()).toBe('s3');
    process.env.STORAGE_PROVIDER = 'local';
    delete process.env.S3_BUCKET;
    delete process.env.AWS_ACCESS_KEY_ID;
    delete process.env.AWS_SECRET_ACCESS_KEY;
  });

  it('stores and loads a replay under uploads/', async () => {
    const key = makeReplayStorageKey('test-user', 'match.dem');
    const tmpDir = path.join(getUploadsRoot(), 'tmp');
    await fs.mkdir(tmpDir, { recursive: true });
    const tmpPath = path.join(tmpDir, `vitest-${Date.now()}.dem`);
    const payload = Buffer.from('PBDEMS2-test-payload');
    await fs.writeFile(tmpPath, payload);

    await putReplayFile(key, tmpPath);

    const loaded = await getReplayBuffer(key);
    expect(loaded.equals(payload)).toBe(true);

    await deleteReplayFile(key);
  });

  it('loads legacy absolute paths', async () => {
    const abs = path.join(getUploadsRoot(), `legacy-${Date.now()}.dem`);
    await fs.mkdir(path.dirname(abs), { recursive: true });
    const payload = Buffer.from('legacy-absolute');
    await fs.writeFile(abs, payload);

    const loaded = await getReplayBuffer(abs);
    expect(loaded.equals(payload)).toBe(true);

    await fs.unlink(abs).catch(() => undefined);
  });
});
