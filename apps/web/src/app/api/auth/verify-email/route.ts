import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/auth';
import { generateToken, tokenExpiresHours } from '@/lib/auth/tokens';
import { sendVerificationEmail } from '@/lib/auth/email';
import { rateLimit, getClientIp } from '@/lib/auth/rate-limit';

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request.headers);
    const limit = rateLimit(`verify:${ip}`, 10, 60 * 60 * 1000);
    if (!limit.allowed) {
      return NextResponse.json({ error: 'Too many attempts' }, { status: 429 });
    }

    const body = await request.json();
    const token = body.token as string | undefined;

    if (!token) {
      return NextResponse.json({ error: 'Verification token required' }, { status: 400 });
    }

    const verification = await prisma.verificationToken.findUnique({ where: { token } });
    if (!verification || verification.expires < new Date()) {
      return NextResponse.json({ error: 'Invalid or expired verification link' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email: verification.identifier } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: new Date() },
      }),
      prisma.verificationToken.delete({ where: { token } }),
    ]);

    return NextResponse.json({ success: true, message: 'Email verified successfully' });
  } catch (err) {
    console.error('[verify-email]', err);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ip = getClientIp(request.headers);
    const limit = rateLimit(`resend:${session.user.id}:${ip}`, 3, 60 * 60 * 1000);
    if (!limit.allowed) {
      return NextResponse.json({ error: 'Too many resend attempts' }, { status: 429 });
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    if (user.emailVerified) {
      return NextResponse.json({ error: 'Email already verified' }, { status: 400 });
    }

    await prisma.verificationToken.deleteMany({ where: { identifier: user.email } });
    const token = generateToken();
    await prisma.verificationToken.create({
      data: {
        identifier: user.email,
        token,
        expires: tokenExpiresHours(24),
      },
    });

    await sendVerificationEmail(user.email, token, user.username);

    return NextResponse.json({ success: true, message: 'Verification email sent' });
  } catch (err) {
    console.error('[resend-verification]', err);
    return NextResponse.json({ error: 'Failed to resend email' }, { status: 500 });
  }
}
