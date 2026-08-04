'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Mail } from 'lucide-react';

const AUTH_PATHS = ['/login', '/signup', '/verify-email', '/forgot-password', '/reset-password'];

function isAuthPath(pathname: string) {
  return AUTH_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export function EmailVerificationBanner() {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  const show =
    status === 'authenticated' &&
    !!session?.user &&
    !session.user.emailVerified &&
    !isAuthPath(pathname);

  useEffect(() => {
    document.documentElement.style.setProperty('--verify-banner-height', show ? '44px' : '0px');
    return () => {
      document.documentElement.style.setProperty('--verify-banner-height', '0px');
    };
  }, [show]);

  if (!show) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[100] flex h-11 items-center justify-center gap-2 border-b border-amber-500/30 bg-amber-950/95 px-4 text-sm backdrop-blur-sm sm:gap-3"
      role="alert"
    >
      <Mail className="h-4 w-4 shrink-0 text-amber-400" aria-hidden />
      <span className="truncate text-amber-100">
        <span className="hidden sm:inline">Verify your email to unlock saving heroes, replays, and synced settings.</span>
        <span className="sm:hidden">Verify your email to unlock full access.</span>
      </span>
      <Link
        href="/verify-email"
        className="shrink-0 font-medium text-amber-300 underline underline-offset-2 hover:text-white"
      >
        Verify now
      </Link>
    </div>
  );
}
