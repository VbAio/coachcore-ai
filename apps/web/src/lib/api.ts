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
      try {
        const json = JSON.parse(xhr.responseText);
        if (json.success) resolve(json.data);
        else reject(new Error(json.error));
      } catch {
        reject(new Error('Upload failed'));
      }
    });
    xhr.addEventListener('error', () => reject(new Error('Upload failed')));
    xhr.open('POST', `${API_URL}/api/replays/upload`);
    xhr.setRequestHeader('x-user-id', authHeaders['x-user-id']);
    xhr.send(formData);
  });
}

export { API_URL };
