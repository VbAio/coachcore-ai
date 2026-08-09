import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { middlewareAuth } from '@/middleware-auth';

const authRoutes = ['/login', '/signup', '/forgot-password', '/reset-password'];
const protectedRoutes = ['/dashboard', '/upload', '/settings', '/report'];
const verifiedRequiredRoutes = ['/upload', '/settings'];

/** Game upload pages: /deadlock/replays, /fortnite/replays, etc. (not nested report URLs) */
function isReplayUploadPath(pathname: string) {
  return /^\/[a-z0-9-]+\/replays\/?$/.test(pathname);
}

function isEmailVerified(value: unknown): boolean {
  if (value == null || value === false) return false;
  if (typeof value === 'number') return Number.isFinite(value) && value > 0;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed || trimmed === 'null' || trimmed === 'undefined' || trimmed === 'false') {
      return false;
    }
    return !Number.isNaN(Date.parse(trimmed));
  }
  if (value instanceof Date) return !Number.isNaN(value.getTime());
  return false;
}

/** Build a same-site redirect; never throw (bad AUTH_URL must not 500 the site). */
function redirectTo(req: NextRequest, pathname: string, callbackUrl?: string) {
  try {
    const url = req.nextUrl.clone();
    url.pathname = pathname;
    url.search = '';
    if (callbackUrl) url.searchParams.set('callbackUrl', callbackUrl);

    // Prefer the Host the browser used (alias), not a renamed AUTH_URL host with no deploy
    const browserHost = req.headers.get('host')?.split(',')[0]?.trim();
    if (browserHost && url.host !== browserHost && !browserHost.includes('localhost')) {
      const proto = req.headers.get('x-forwarded-proto')?.split(',')[0]?.trim() || 'https';
      const absolute = new URL(`${proto}://${browserHost}${url.pathname}${url.search}`);
      return NextResponse.redirect(absolute);
    }

    return NextResponse.redirect(url);
  } catch (err) {
    console.error('[middleware] redirect failed', err);
    try {
      const fallback = new URL(pathname, req.url);
      if (callbackUrl) fallback.searchParams.set('callbackUrl', callbackUrl);
      return NextResponse.redirect(fallback);
    } catch {
      return NextResponse.next();
    }
  }
}

export default middlewareAuth((req) => {
  try {
    const { pathname } = req.nextUrl;
    const isLoggedIn = !!req.auth;
    const isVerified = isEmailVerified(req.auth?.user?.emailVerified);

    const isAuthRoute = authRoutes.some((r) => pathname.startsWith(r));
    const isProtected =
      protectedRoutes.some((r) => pathname.startsWith(r)) || isReplayUploadPath(pathname);
    const needsVerification =
      verifiedRequiredRoutes.some((r) => pathname.startsWith(r)) || isReplayUploadPath(pathname);

    if (isLoggedIn && isAuthRoute && pathname !== '/verify-email') {
      return redirectTo(req, '/dashboard');
    }

    if (!isLoggedIn && isProtected) {
      return redirectTo(req, '/login', pathname);
    }

    if (isLoggedIn && needsVerification && !isVerified && pathname !== '/verify-email') {
      return redirectTo(req, '/verify-email');
    }

    return NextResponse.next();
  } catch (err) {
    console.error('[middleware] crashed', err);
    // Fail open on unexpected errors so the site is not a blank MIDDLEWARE_INVOCATION_FAILED page
    return NextResponse.next();
  }
});

export const config = {
  matcher: [
    '/login',
    '/signup',
    '/forgot-password',
    '/reset-password',
    '/verify-email',
    '/dashboard/:path*',
    '/upload/:path*',
    '/settings/:path*',
    '/report/:path*',
    '/deadlock/replays',
    '/fortnite/replays',
    '/valorant/replays',
    '/league-of-legends/replays',
    '/rocket-league/replays',
    '/cs2/replays',
    '/apex-legends/replays',
  ],
};
