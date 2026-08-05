'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { GameSelector } from './game-selector';
import { Button } from '@/components/ui/button';
import { UserMenu } from '@/components/auth/user-menu';
import { easeOutSoft } from '@/lib/motion';

/** Platform marketing navbar — no game-specific nav items */
export function PlatformNavbar() {
  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.45, ease: easeOutSoft }}
      className="fixed top-[var(--verify-banner-height)] z-50 w-full border-b border-white/5 glass"
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="group flex items-center gap-2">
          <motion.div
            whileHover={{ scale: 1.06, rotate: -3 }}
            whileTap={{ scale: 0.96 }}
            className="flex h-8 w-8 items-center justify-center rounded-lg gradient-purple text-sm font-bold"
          >
            CC
          </motion.div>
          <span className="text-lg font-bold text-white transition-colors group-hover:text-purple-200">
            CoachCore AI
          </span>
        </Link>
        <div className="hidden items-center gap-8 text-sm text-zinc-400 md:flex">
          <GameSelector variant="platform" />
          <Link href="#features" className="link-underline hover:text-purple-300">
            Features
          </Link>
          <Link href="#pricing" className="link-underline hover:text-purple-300">
            Pricing
          </Link>
          <Link href="#faq" className="link-underline hover:text-purple-300">
            FAQ
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <div className="md:hidden">
            <GameSelector variant="platform" />
          </div>
          <UserMenu />
          <Link href="/deadlock">
            <Button variant="glow" size="sm">
              Open Platform
            </Button>
          </Link>
        </div>
      </div>
    </motion.nav>
  );
}
