import type { Adapter } from '@auth/core/adapters';
import { PrismaAdapter } from '@auth/prisma-adapter';
import type { PrismaClient } from '@prisma/client';

function isPrismaUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === 'P2002'
  );
}

function normalizeEmail(email?: string | null) {
  return email?.toLowerCase().trim() ?? undefined;
}

/** Prisma adapter with email normalization and safer OAuth account linking. */
export function clutchCoreAdapter(prisma: PrismaClient): Adapter {
  const base = PrismaAdapter(prisma);

  return {
    ...base,
    createUser: async (data) => {
      const email = normalizeEmail(data.email);
      if (!email) {
        return base.createUser!(data);
      }

      const payload = { ...data, email };

      try {
        return await base.createUser!(payload);
      } catch (error) {
        if (isPrismaUniqueViolation(error)) {
          const existing = await base.getUserByEmail!(email);
          if (existing) return existing;
        }
        throw error;
      }
    },
    getUserByEmail: async (email) => base.getUserByEmail!(normalizeEmail(email)!),
    linkAccount: async (data) => {
      try {
        await base.linkAccount!(data);
      } catch (error) {
        if (!isPrismaUniqueViolation(error)) throw error;

        const existing = await prisma.account.findUnique({
          where: {
            provider_providerAccountId: {
              provider: data.provider,
              providerAccountId: data.providerAccountId,
            },
          },
        });

        if (!existing) throw error;
      }
    },
  };
}
