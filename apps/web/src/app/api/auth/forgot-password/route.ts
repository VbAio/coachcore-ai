import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { forgotPasswordSchema } from '@/lib/auth/validation';
import { generateToken, tokenExpires } from '@/lib/auth/tokens';
import { sendPasswordResetEmail } from '@/lib/auth/email';
import { rateLimit, getClientIp } from '@/lib/auth/rate-limit';

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request.headers);
    const limit = rateLimit(`forgot:${ip}`, 5, 60 * 60 * 1000);
    if (!limit.allowed) {
      return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429 });
    }

    const body = await request.json();
    const parsed = forgotPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    const email = parsed.data.email.toLowerCase();
    const user = await prisma.user.findUnique({ where: { email } });

    if (user?.passwordHash) {
      await prisma.passwordResetToken.deleteMany({ where: { email } });
      const token = generateToken();
      await prisma.passwordResetToken.create({
        data: { email, token, expires: tokenExpires(30) },
      });
      await sendPasswordResetEmail(email, token);
    }

    return NextResponse.json({
      success: true,
      message: 'If an account exists with that email, a reset link has been sent.',
    });
  } catch (err) {
    console.error('[forgot-password]', err);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
