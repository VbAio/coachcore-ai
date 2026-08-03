import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { getUserAuthMethods } from '@/lib/auth/user-service';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const accounts = await prisma.account.findMany({
    where: { userId: session.user.id },
    select: { id: true, provider: true, providerAccountId: true },
  });

  const authMethods = await getUserAuthMethods(session.user.id);

  return NextResponse.json({ accounts, authMethods });
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const provider = searchParams.get('provider');

  if (!provider || !['google', 'discord'].includes(provider)) {
    return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
  }

  const authMethods = await getUserAuthMethods(session.user.id);
  if (authMethods.count <= 1) {
    return NextResponse.json(
      { error: 'Cannot disconnect your only login method' },
      { status: 400 }
    );
  }

  const isDisconnecting =
    (provider === 'google' && authMethods.hasGoogle) ||
    (provider === 'discord' && authMethods.hasDiscord);

  if (!isDisconnecting) {
    return NextResponse.json({ error: 'Provider not connected' }, { status: 404 });
  }

  await prisma.account.deleteMany({
    where: { userId: session.user.id, provider },
  });

  return NextResponse.json({ success: true });
}
