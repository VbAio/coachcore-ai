import { NextResponse } from 'next/server';
import { prisma, normalizeDatabaseUrl } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET() {
  const raw = process.env.DATABASE_URL;
  if (!raw) {
    return NextResponse.json(
      { ok: false, error: 'DATABASE_URL is not set on Vercel' },
      { status: 500 }
    );
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
    const userCount = await prisma.user.count();
    return NextResponse.json({
      ok: true,
      userCount,
      host: normalizeDatabaseUrl(raw).replace(/:[^:@/]+@/, ':***@'),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Database connection failed';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
