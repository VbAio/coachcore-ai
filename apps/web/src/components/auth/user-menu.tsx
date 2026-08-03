'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useState, useRef, useEffect } from 'react';
import {
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Settings,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function UserMenu() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  if (status === 'loading') {
    return <div className="h-9 w-24 animate-pulse rounded-lg bg-white/5" />;
  }

  if (!session?.user) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/login"
          className="rounded-lg px-3 py-2 text-sm text-zinc-400 transition-colors hover:text-white"
        >
          Log in
        </Link>
        <Link
          href="/signup"
          className="rounded-lg gradient-purple px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          Sign up
        </Link>
      </div>
    );
  }

  const { user } = session;
  const initials = (user.displayName ?? user.username ?? 'U').slice(0, 2).toUpperCase();

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] py-1.5 pl-1.5 pr-3 transition-colors hover:border-white/20"
      >
        {user.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.avatar} alt="" className="h-8 w-8 rounded-lg object-cover" />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-purple text-xs font-bold">
            {initials}
          </div>
        )}
        <span className="hidden max-w-[120px] truncate text-sm font-medium text-white sm:inline">
          {user.displayName ?? user.username}
        </span>
        <ChevronDown className={cn('h-4 w-4 text-zinc-500 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-white/10 bg-zinc-950/95 py-1 shadow-xl backdrop-blur-xl">
          <div className="border-b border-white/5 px-4 py-3">
            <p className="truncate text-sm font-medium text-white">{user.displayName}</p>
            <p className="truncate text-xs text-zinc-500">@{user.username}</p>
          </div>
          <MenuLink href="/dashboard" icon={LayoutDashboard} onClick={() => setOpen(false)}>
            Dashboard
          </MenuLink>
          <MenuLink href={`/profile/${user.username}`} icon={User} onClick={() => setOpen(false)}>
            Profile
          </MenuLink>
          <MenuLink href="/settings/account" icon={Settings} onClick={() => setOpen(false)}>
            Settings
          </MenuLink>
          <div className="border-t border-white/5 mt-1 pt-1">
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: '/' })}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10"
            >
              <LogOut className="h-4 w-4" />
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MenuLink({
  href,
  icon: Icon,
  children,
  onClick,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-300 hover:bg-white/5 hover:text-white"
    >
      <Icon className="h-4 w-4 text-zinc-500" />
      {children}
    </Link>
  );
}
