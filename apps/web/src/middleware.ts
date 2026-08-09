import { NextResponse, type NextRequest } from 'next/server';
import { middlewareAuth } from '@/middleware-auth';
import { isEmailVerified } from '@/lib/auth/is-email-verified';

const authRoutes = ['/login', '/signup', '/forgot-password', '/reset-password'];
const protectedRoutes = ['/dashboard', '/upload', '/settings', '/report'];
const verifiedRequiredRoutes = ['/upload', '/settings'];

/** Game upload pages: /deadlock/replays, /fortnite/replays, etc. (not nested report URLs) */
function isReplayUploadPath(pathname: string) {
  return /^\/[a-z0-9-]+\/replays\/?$/.test(pathname);
}

/**
 * Stay on the hostname the browser actually opened.
 * Avoids AUTH_URL pointing at a renamed Vercel host that has no deployment yet
 * (e.g. Replay → login redirect → DEPLOYMENT_NOT_FOUND on clutchcore.vercel.app).
 */
function requestOrigin(req: NextRequest): string {
  const host =
    req.headers.get('x-forwarded-host')?.split(',')[0]?.trim() ||
    req.headers.get('host')?.split(',')[0]?.trim() ||
    req.nextUrl.host;
  const proto =
    req.headers.get('x-forwarded-proto')?.split(',')[0]?.trim() ||
    req.nextUrl.protocol.replace(':', '') ||
    'https';
  return `${proto}://${host}`;
}

function redirectPath(req: NextRequest, path: string) {
  return NextResponse.redirect(new URL(path, requestOrigin(req)));
}

export default middlewareAuth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  // Banner + replay upload stay locked until email is actually verified
  const isVerified = isEmailVerified(req.auth?.user?.emailVerified);

  const isAuthRoute = authRoutes.some((r) => pathname.startsWith(r));
  const isProtected =
    protectedRoutes.some((r) => pathname.startsWith(r)) || isReplayUploadPath(pathname);
  const needsVerification =
    verifiedRequiredRoutes.some((r) => pathname.startsWith(r)) || isReplayUploadPath(pathname);

  if (isLoggedIn && isAuthRoute && pathname !== '/verify-email') {
    return redirectPath(req, '/dashboard');
  }

  if (!isLoggedIn && isProtected) {
    const loginUrl = new URL('/login', requestOrigin(req));
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isLoggedIn && needsVerification && !isVerified && pathname !== '/verify-email') {
    return redirectPath(req, '/verify-email');
  }

  return NextResponse.next();
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
