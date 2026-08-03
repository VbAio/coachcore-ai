import { prisma } from '@/lib/db';
import { usernameSchema } from '@/lib/auth/validation';

export async function isUsernameAvailable(username: string): Promise<boolean> {
  const existing = await prisma.user.findUnique({ where: { username: username.toLowerCase() } });
  return !existing;
}

export async function isEmailAvailable(email: string): Promise<boolean> {
  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  return !existing;
}

export async function generateUniqueUsername(base: string): Promise<string> {
  const sanitized = base
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 20);

  let candidate = sanitized || 'player';
  if (candidate.length < 3) candidate = `${candidate}123`.slice(0, 20);

  const parsed = usernameSchema.safeParse(candidate);
  if (!parsed.success) {
    candidate = `player_${Date.now().toString(36).slice(-6)}`;
  }

  if (await isUsernameAvailable(candidate)) return candidate;

  for (let i = 1; i <= 999; i++) {
    const suffix = String(i);
    const next = `${candidate.slice(0, 24 - suffix.length)}${suffix}`;
    if (await isUsernameAvailable(next)) return next;
  }

  return `user_${Date.now().toString(36)}`;
}

export async function getUserAuthMethods(userId: string): Promise<{
  hasPassword: boolean;
  hasGoogle: boolean;
  hasDiscord: boolean;
  count: number;
}> {
  const [user, accounts] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { passwordHash: true } }),
    prisma.account.findMany({ where: { userId }, select: { provider: true } }),
  ]);

  const hasPassword = Boolean(user?.passwordHash);
  const hasGoogle = accounts.some((a) => a.provider === 'google');
  const hasDiscord = accounts.some((a) => a.provider === 'discord');
  const count = [hasPassword, hasGoogle, hasDiscord].filter(Boolean).length;

  return { hasPassword, hasGoogle, hasDiscord, count };
}

export async function recordFailedLogin(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return;

  const attempts = user.failedLoginAttempts + 1;
  const lockedUntil =
    attempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : user.lockedUntil;

  await prisma.user.update({
    where: { id: userId },
    data: { failedLoginAttempts: attempts, lockedUntil },
  });
}

export async function resetFailedLogins(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { failedLoginAttempts: 0, lockedUntil: null, lastLogin: new Date() },
  });
}

export function sanitizePublicUser(user: {
  id: string;
  username: string;
  displayName: string | null;
  avatar: string | null;
  email?: string;
  emailVerified?: Date | null;
  role?: string;
  theme?: string;
  language?: string;
  timezone?: string;
  createdAt?: Date;
  favoriteHeroes?: unknown;
  savedHeroes?: unknown;
  savedMatches?: unknown;
  settings?: unknown;
  notificationPreferences?: unknown;
  preferences?: unknown;
}) {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName ?? user.username,
    avatar: user.avatar,
    email: user.email,
    emailVerified: user.emailVerified,
    role: user.role,
    theme: user.theme,
    language: user.language,
    timezone: user.timezone,
    createdAt: user.createdAt,
    favoriteHeroes: user.favoriteHeroes,
    savedHeroes: user.savedHeroes,
    savedMatches: user.savedMatches,
    settings: user.settings,
    notificationPreferences: user.notificationPreferences,
    preferences: user.preferences,
  };
}
