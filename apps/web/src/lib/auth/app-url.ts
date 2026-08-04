/** Normalize app/auth base URLs and catch common Vercel copy-paste mistakes. */
export function normalizeAppUrl(url: string): string {
  let normalized = url.trim().replace(/^["']|["']$/g, '');

  if (!/^https?:\/\//i.test(normalized)) {
    normalized = `https://${normalized}`;
  }

  // e.g. https://coachcore-ai-web.vercel.app/.vercel.app
  normalized = normalized.replace(/(\.vercel\.app)\/+\.vercel\.app\b/gi, '$1');
  normalized = normalized.replace(/\/+$/, '');

  return normalized;
}

export function getConfiguredAppUrl(): string {
  const raw = process.env.AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  return normalizeAppUrl(raw);
}

export function isMalformedAppUrl(url: string): boolean {
  const trimmed = url.trim();
  return /\.vercel\.app\/+\.vercel\.app/i.test(trimmed) || /\/+\.vercel\.app/i.test(trimmed);
}
