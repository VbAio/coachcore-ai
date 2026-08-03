import { NextResponse } from 'next/server';
import { auth, revokeAllRefreshTokens } from '@/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [sessions, refreshTokens] = await Promise.all([
    prisma.session.findMany({
      where: { userId: session.user.id, expires: { gt: new Date() } },
      select: { id: true, userAgent: true, ipAddress: true, expires: true },
      orderBy: { expires: 'desc' },
    }),
    prisma.refreshToken.findMany({
      where: { userId: session.user.id, expires: { gt: new Date() } },
      select: { id: true, userAgent: true, ipAddress: true, expires: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return NextResponse.json({ sessions, refreshTokens });
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const scope = searchParams.get('scope');

  if (scope === 'all') {
    await Promise.all([
      prisma.session.deleteMany({ where: { userId: session.user.id } }),
      revokeAllRefreshTokens(session.user.id),
    ]);
    return NextResponse.json({ success: true, message: 'Logged out from all devices' });
  }

  const sessionId = searchParams.get('sessionId');
  const refreshId = searchParams.get('refreshId');

  if (sessionId) {
    await prisma.session.deleteMany({
      where: { id: sessionId, userId: session.user.id },
    });
  }
  if (refreshId) {
    await prisma.refreshToken.deleteMany({
      where: { id: refreshId, userId: session.user.id },
    });
  }

  return NextResponse.json({ success: true });
}
