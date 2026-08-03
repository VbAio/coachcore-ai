import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const user = await prisma.user.findUnique({
    where: { username: username.toLowerCase() },
    select: {
      id: true,
      username: true,
      displayName: true,
      avatar: true,
      createdAt: true,
      favoriteHeroes: true,
      savedHeroes: true,
      savedMatches: true,
      role: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({
    user: {
      username: user.username,
      displayName: user.displayName ?? user.username,
      avatar: user.avatar,
      joinDate: user.createdAt,
      favoriteHeroes: user.favoriteHeroes,
      savedHeroes: user.savedHeroes,
      savedMatches: user.savedMatches,
      role: user.role,
    },
  });
}
