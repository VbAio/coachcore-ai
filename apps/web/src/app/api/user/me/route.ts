import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { sanitizePublicUser, getUserAuthMethods } from '@/lib/auth/user-service';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      accounts: { select: { provider: true, providerAccountId: true } },
      stats: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const authMethods = await getUserAuthMethods(user.id);

  return NextResponse.json({
    user: sanitizePublicUser(user),
    authMethods,
    accounts: user.accounts.map((a) => ({ provider: a.provider })),
    stats: user.stats,
  });
}
