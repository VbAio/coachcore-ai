import { neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaClient } from '@prisma/client';
import ws from 'ws';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

/** Clean up common copy-paste issues from Vercel / Neon dashboard */
export function normalizeDatabaseUrl(url: string): string {
  let normalized = url.trim().replace(/^["']|["']$/g, '');
  // channel_binding breaks many serverless Postgres clients
  normalized = normalized.replace(/([?&])channel_binding=[^&]*&?/g, '$1');
  normalized = normalized.replace(/[?&]$/, '');
  return normalized;
}

function createPrismaClient(): PrismaClient {
  const raw = process.env.DATABASE_URL ?? '';

  if (!raw) {
    console.error('[db] DATABASE_URL is not set');
    return new PrismaClient({ log: ['error'] });
  }

  if (raw.includes('neon.tech')) {
    neonConfig.webSocketConstructor = ws;
    const connectionString = normalizeDatabaseUrl(raw);
    const adapter = new PrismaNeon({ connectionString });
    return new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    });
  }

  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
