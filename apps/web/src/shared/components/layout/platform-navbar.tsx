'use client';

import Link from 'next/link';
import { GameSelector } from './game-selector';
import { Button } from '@/components/ui/button';
import { UserMenu } from '@/components/auth/user-menu';

/** Platform marketing navbar — no game-specific nav items */
export function PlatformNavbar() {
  return (
    <nav className="fixed top-[var(--verify-banner-height)] z-50 w-full glass border-b border-white/5">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg gradient-purple flex items-center justify-center text-sm font-bold">
            CC
          </div>
          <span className="text-lg font-bold text-white">CoachCore AI</span>
        </Link>
        <div className="hidden md:flex items-center gap-8 text-sm text-zinc-400">
          <GameSelector variant="platform" />
          <Link href="#features" className="hover:text-purple-400 transition-colors">Features</Link>
          <Link href="#pricing" className="hover:text-purple-400 transition-colors">Pricing</Link>
          <Link href="#faq" className="hover:text-purple-400 transition-colors">FAQ</Link>
        </div>
        <div className="flex items-center gap-3">
          <div className="md:hidden">
            <GameSelector variant="platform" />
          </div>
          <UserMenu />
          <Link href="/deadlock">
            <Button variant="glow" size="sm">Open Platform</Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}
