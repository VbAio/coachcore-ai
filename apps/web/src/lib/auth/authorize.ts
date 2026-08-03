import { loginSchema } from '@/lib/auth/validation';
import { rateLimit, getClientIp } from '@/lib/auth/rate-limit';
import { verifyPassword } from '@/lib/auth/password';
import { recordFailedLogin, resetFailedLogins } from '@/lib/auth/user-service';
import { prisma } from '@/lib/db';

export async function authorizeCredentials(
  credentials: Partial<Record<'email' | 'password', unknown>>,
  request?: Request
) {
  const parsed = loginSchema.safeParse({
    email: credentials?.email,
    password: credentials?.password,
  });
  if (!parsed.success) return null;

  const ip = getClientIp(new Headers(request?.headers ?? {}));
  const limit = rateLimit(`login:${ip}`, 10, 15 * 60 * 1000);
  if (!limit.allowed) return null;

  const email = parsed.data.email.toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user?.passwordHash) return null;

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    return null;
  }

  const valid = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!valid) {
    await recordFailedLogin(user.id);
    return null;
  }

  await resetFailedLogins(user.id);

  return {
    id: user.id,
    email: user.email,
    name: user.displayName ?? user.username,
    image: user.avatar,
    username: user.username,
    role: user.role,
    emailVerified: user.emailVerified,
  };
}
