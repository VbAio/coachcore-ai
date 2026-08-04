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

  beforeAll(() => {
    process.env.STORAGE_PROVIDER = 'local';
  });

  afterAll(() => {
    if (prevProvider === undefined) delete process.env.STORAGE_PROVIDER;
    else process.env.STORAGE_PROVIDER = prevProvider;
  });

  it('defaults to local provider', () => {
    expect(getStorageProvider()).toBe('local');
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
