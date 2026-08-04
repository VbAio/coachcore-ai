import type { NextAuthConfig } from 'next-auth';
import Google from 'next-auth/providers/google';
import Discord from 'next-auth/providers/discord';
import { getDiscordOAuthConfig, getGoogleOAuthConfig } from '@/lib/auth/oauth';

const MAX_AGE = 30 * 24 * 60 * 60;
const SESSION_UPDATE_AGE = 24 * 60 * 60;

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      username: string;
      email: string;
      displayName: string;
      avatar: string | null;
      emailVerified: Date | null;
      role: string;
    };
  }

  interface User {
    username?: string;
    role?: string;
    emailVerified?: Date | null;
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    id: string;
    username: string;
    role: string;
    emailVerified: Date | null;
  }
}

export const authConfig = {
  providers: [
    ...(getGoogleOAuthConfig()
      ? [
          Google({
            ...getGoogleOAuthConfig()!,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
    ...(getDiscordOAuthConfig()
      ? [
          Discord({
            ...getDiscordOAuthConfig()!,
            allowDangerousEmailAccountLinking: true,
            authorization: { params: { scope: 'identify email' } },
          }),
        ]
      : []),
  ],
  pages: {
    signIn: '/login',
    newUser: '/deadlock',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: MAX_AGE,
    updateAge: SESSION_UPDATE_AGE,
  },
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === 'production'
          ? '__Secure-authjs.session-token'
          : 'authjs.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id!;
        token.username = user.username ?? '';
        token.role = user.role ?? 'user';
        token.emailVerified = user.emailVerified ?? null;
        token.name = user.name;
        token.picture = user.image;
      }

      if (trigger === 'update' && session) {
        token.name = session.name;
        token.picture = session.image;
        if (session.username) token.username = session.username;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
        session.user.username = (token.username as string) ?? '';
        session.user.role = (token.role as string) ?? 'user';
        session.user.emailVerified = (token.emailVerified as Date | null) ?? null;
        session.user.displayName = (token.name as string) ?? session.user.username;
        session.user.avatar = (token.picture as string | null) ?? null;
      }
      return session;
    },
  },
  trustHost: true,
} satisfies NextAuthConfig;
