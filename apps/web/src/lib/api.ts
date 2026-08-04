import { getSession } from 'next-auth/react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export async function getAuthHeaders(): Promise<Record<string, string>> {
  const session = await getSession();
  if (!session?.user?.id) return {};
  return { 'x-user-id': session.user.id };
}

export async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const authHeaders = await getAuthHeaders();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...authHeaders,
      ...options?.headers,
    },
  });

  const json = await res.json();
  if (!json.success) throw new Error(json.error ?? 'API error');
  return json.data as T;
}

export async function uploadReplay(
  file: File,
  onProgress?: (pct: number) => void,
  options?: { subjectSteamId?: string }
) {
  const authHeaders = await getAuthHeaders();
  if (!authHeaders['x-user-id']) {
    throw new Error('Sign in to upload replays');
  }

  const formData = new FormData();
  formData.append('replay', file);
  if (options?.subjectSteamId?.trim()) {
    formData.append('subjectSteamId', options.subjectSteamId.trim());
  }

  return new Promise<{ replayId: string; status: string }>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });
    xhr.addEventListener('load', () => {
      if (xhr.status === 0) {
        reject(
          new Error(
            `Could not reach API at ${API_URL}. Start it with npm run dev:api (or npm run dev).`
          )
        );
        return;
      }
      try {
        const json = JSON.parse(xhr.responseText) as {
          success?: boolean;
          data?: { replayId: string; status: string };
          error?: string;
        };
        if (json.success && json.data) resolve(json.data);
        else reject(new Error(json.error ?? `Upload failed (${xhr.status})`));
      } catch {
        const snippet = (xhr.responseText || '').slice(0, 160).trim();
        reject(
          new Error(
            snippet
              ? `Upload failed (${xhr.status}): ${snippet}`
              : `Upload failed: unexpected response from ${API_URL} (${xhr.status})`
          )
        );
      }
    });
    xhr.addEventListener('error', () =>
      reject(
        new Error(
          `Could not reach API at ${API_URL}. Start it with npm run dev:api (or npm run dev).`
        )
      )
    );
    xhr.addEventListener('timeout', () =>
      reject(new Error('Upload timed out — try a smaller file or check the API is running.'))
    );
    xhr.open('POST', `${API_URL}/api/replays/upload`);
    xhr.setRequestHeader('x-user-id', authHeaders['x-user-id']);
    xhr.timeout = 10 * 60 * 1000;
    xhr.send(formData);
  });
}

export { API_URL };
