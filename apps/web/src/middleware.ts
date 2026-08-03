import { NextResponse } from 'next/server';
import { middlewareAuth } from '@/middleware-auth';

const authRoutes = ['/login', '/signup', '/forgot-password', '/reset-password'];
const protectedRoutes = ['/dashboard', '/upload', '/settings', '/report'];
const verifiedRequiredRoutes = ['/upload', '/settings'];

export default middlewareAuth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const isVerified = !!req.auth?.user?.emailVerified;

  const isAuthRoute = authRoutes.some((r) => pathname.startsWith(r));
  const isProtected = protectedRoutes.some((r) => pathname.startsWith(r));
  const needsVerification = verifiedRequiredRoutes.some((r) => pathname.startsWith(r));

  if (isLoggedIn && isAuthRoute && pathname !== '/verify-email') {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  if (!isLoggedIn && isProtected) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isLoggedIn && needsVerification && !isVerified && pathname !== '/verify-email') {
    return NextResponse.redirect(new URL('/verify-email', req.url));
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
  ],
};
