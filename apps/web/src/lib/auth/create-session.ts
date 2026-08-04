import { encode } from '@auth/core/jwt';
import { cookies } from 'next/headers';

const SESSION_MAX_AGE = 30 * 24 * 60 * 60;

function sessionCookieName() {
  return process.env.NODE_ENV === 'production'
    ? '__Secure-authjs.session-token'
    : 'authjs.session-token';
}

export async function setUserSession(user: {
  id: string;
  email: string;
  username: string;
  role: string;
  emailVerified: Date | null;
  displayName?: string | null;
  avatar?: string | null;
}) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error('AUTH_SECRET is not configured');
  }

  const cookieName = sessionCookieName();
  const token = await encode({
    token: {
      sub: user.id,
      id: user.id,
      email: user.email,
      name: user.displayName ?? user.username,
      picture: user.avatar ?? null,
      username: user.username,
      role: user.role,
      emailVerified: user.emailVerified,
    },
    secret,
    maxAge: SESSION_MAX_AGE,
    salt: cookieName,
  });

  const cookieStore = await cookies();
  cookieStore.set(cookieName, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    maxAge: SESSION_MAX_AGE,
  });
}
