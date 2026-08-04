import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import Credentials from 'next-auth/providers/credentials';
import { authConfig } from '@/auth.config';
import { prisma } from '@/lib/db';
import { generateUniqueUsername } from '@/lib/auth/user-service';
import { generateToken, tokenExpiresDays } from '@/lib/auth/tokens';

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  secret: process.env.AUTH_SECRET,
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
      try {
        const base = user.name ?? user.email?.split('@')[0] ?? 'player';
        const username = await generateUniqueUsername(base);
        await prisma.user.update({
          where: { id: user.id! },
          data: {
            username,
            displayName: user.name ?? username,
            avatar: user.image ?? null,
            name: user.name ?? null,
            image: user.image ?? null,
            emailVerified: user.emailVerified ?? null,
          },
        });
        await prisma.userStats.upsert({
          where: { userId: user.id! },
          create: { userId: user.id! },
          update: {},
        });
      } catch (err) {
        console.error('[auth createUser event]', err);
        throw err;
      }
    },
    async signIn({ user, account }) {
      if (user.id && account?.provider !== 'credentials') {
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLogin: new Date() },
        });
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
