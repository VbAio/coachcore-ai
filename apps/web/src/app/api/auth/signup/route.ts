import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hashPassword } from '@/lib/auth/password';
import { signupSchema } from '@/lib/auth/validation';
import { isUsernameAvailable, isEmailAvailable } from '@/lib/auth/user-service';
import { generateToken, tokenExpiresHours } from '@/lib/auth/tokens';
import { sendVerificationEmail } from '@/lib/auth/email';
import { rateLimit, getClientIp } from '@/lib/auth/rate-limit';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request.headers);
    const limit = rateLimit(`signup:${ip}`, 5, 60 * 60 * 1000);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: 'Too many signup attempts. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parsed = signupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? 'Invalid input' },
        { status: 400 }
      );
    }

    const { username, email, password } = parsed.data;
    const normalizedUsername = username.toLowerCase();
    const normalizedEmail = email.toLowerCase();

    if (!(await isUsernameAvailable(normalizedUsername))) {
      return NextResponse.json({ error: 'Username is already taken' }, { status: 409 });
    }
    if (!(await isEmailAvailable(normalizedEmail))) {
      return NextResponse.json({ error: 'Email is already registered' }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        username: normalizedUsername,
        email: normalizedEmail,
        passwordHash,
        displayName: username,
        name: username,
      },
    });

    const token = generateToken();
    await prisma.verificationToken.create({
      data: {
        identifier: normalizedEmail,
        token,
        expires: tokenExpiresHours(24),
      },
    });

    await sendVerificationEmail(normalizedEmail, token, username);
    await prisma.userStats.create({ data: { userId: user.id } });

    return NextResponse.json({
      success: true,
      message: 'Account created. Please verify your email.',
      userId: user.id,
    });
  } catch (err) {
    console.error('[signup]', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    const isDev = process.env.NODE_ENV === 'development';
    return NextResponse.json(
      {
        error: isDev ? message : 'Failed to create account. Check DATABASE_URL on Vercel and try again.',
      },
      { status: 500 }
    );
  }
}
