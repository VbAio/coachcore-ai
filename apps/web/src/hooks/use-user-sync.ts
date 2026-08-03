'use client';

import { useSession } from 'next-auth/react';
import { useCallback, useEffect, useRef } from 'react';

/**
 * Syncs user preferences to the database when logged in.
 * Debounced PATCH to /api/user/settings on preference changes.
 */
export function useUserSync() {
  const { data: session, status } = useSession();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const syncData = useCallback(
    (data: Record<string, unknown>) => {
      if (status !== 'authenticated' || !session?.user?.emailVerified) return;

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(async () => {
        await fetch('/api/user/settings', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
      }, 800);
    },
    [session, status]
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { syncData, isAuthenticated: status === 'authenticated', isVerified: !!session?.user?.emailVerified };
}

export function UserSyncProvider({ children }: { children: React.ReactNode }) {
  return children;
}
