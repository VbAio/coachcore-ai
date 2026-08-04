import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { authConfig } from '@/auth.config';
import { prisma } from '@/lib/db';
import { coachCoreAdapter } from '@/lib/auth/prisma-adapter';
import { generateUniqueUsername } from '@/lib/auth/user-service';
import { generateToken, tokenExpiresDays } from '@/lib/auth/tokens';

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: coachCoreAdapter(prisma),
  secret: process.env.AUTH_SECRET,
  debug: process.env.AUTH_DEBUG === 'true',
  logger: {
    error(error) {
      console.error('[auth][error]', error);
    },
    warn(code) {
      console.warn('[auth][warn]', code);
    },
  },
  providers: [
    ...authConfig.providers,
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, request) {
        const { authorizeCredentials } = await import('@/lib/auth/authorize');
        return authorizeCredentials(credentials, request);
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, trigger, session }) {
      if (user?.id) {
        try {
          const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
          if (dbUser) {
            token.id = dbUser.id;
            token.username = dbUser.username;
            token.role = dbUser.role;
            token.emailVerified = dbUser.emailVerified;
            token.name = dbUser.displayName ?? dbUser.name;
            token.picture = dbUser.avatar ?? dbUser.image;
          } else {
            token.id = user.id;
            token.username = user.username ?? '';
            token.role = user.role ?? 'user';
            token.emailVerified = user.emailVerified ?? null;
            token.name = user.name;
            token.picture = user.image;
          }
        } catch (err) {
          console.error('[auth jwt callback]', err);
          token.id = user.id;
          token.username = user.username ?? '';
          token.role = user.role ?? 'user';
          token.emailVerified = user.emailVerified ?? null;
          token.name = user.name;
          token.picture = user.image;
        }
      }

      if (trigger === 'update' && session) {
        token.name = session.name;
        token.picture = session.image;
        if (session.username) token.username = session.username;
      }

      return token;
    },
    async signIn({ user, account }) {
      if (account?.provider === 'discord' && !user.email) {
        return false;
      }

      if (account?.provider !== 'credentials' && user.id) {
        try {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              lastLogin: new Date(),
              avatar: user.image ?? undefined,
              displayName: user.name ?? undefined,
              name: user.name ?? undefined,
              image: user.image ?? undefined,
              ...(account?.provider === 'google' ? { emailVerified: new Date() } : {}),
            },
          });
        } catch (err) {
          console.error('[auth signIn callback]', err);
        }
      }
      return true;
    },
  },
  events: {
    async createUser({ user }) {
      if (!user.id) return;

      try {
        const existing = await prisma.user.findUnique({
          where: { id: user.id },
          include: { stats: true },
        });
        if (!existing) return;

        if (existing.stats) {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              avatar: user.image ?? existing.avatar,
              name: user.name ?? existing.name,
              image: user.image ?? existing.image,
              displayName: user.name ?? existing.displayName,
            },
          });
          return;
        }

        const base = user.name ?? user.email?.split('@')[0] ?? 'player';
        const username = await generateUniqueUsername(base);

        await prisma.user.update({
          where: { id: user.id },
          data: {
            username,
            displayName: user.name ?? existing.displayName ?? username,
            avatar: user.image ?? existing.avatar,
            name: user.name ?? existing.name,
            image: user.image ?? existing.image,
            emailVerified: user.emailVerified ?? existing.emailVerified,
          },
        });

        if (!existing.stats) {
          await prisma.userStats.create({ data: { userId: user.id } });
        }
      } catch (err) {
        console.error('[auth createUser event]', err);
      }
    },
    async signIn({ user, account }) {
      if (user.id && account?.provider !== 'credentials') {
        try {
          await prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() },
          });
        } catch (err) {
          console.error('[auth signIn event]', err);
        }
      }
    },
  },
});

export async function createRefreshToken(
  userId: string,
  userAgent?: string | null,
  ipAddress?: string | null
): Promise<string> {
  const token = generateToken(48);
  await prisma.refreshToken.create({
    data: {
      token,
      userId,
      expires: tokenExpiresDays(30),
      userAgent: userAgent ?? null,
      ipAddress: ipAddress ?? null,
    },
  });
  return token;
}

export async function revokeAllRefreshTokens(userId: string): Promise<void> {
  await prisma.refreshToken.deleteMany({ where: { userId } });
}

export async function revokeRefreshToken(token: string): Promise<void> {
  await prisma.refreshToken.deleteMany({ where: { token } });
}
