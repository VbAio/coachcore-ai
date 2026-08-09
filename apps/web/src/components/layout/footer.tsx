'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { easeOutSoft } from '@/lib/motion';

export function Footer() {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: easeOutSoft }}
      className="border-t border-white/5 px-6 py-12"
    >
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 md:flex-row">
        <div className="flex items-center gap-2">
          <motion.div
            whileHover={{ scale: 1.08, rotate: -4 }}
            className="flex h-8 w-8 items-center justify-center rounded-lg gradient-purple text-sm font-bold"
          >
            Cl
          </motion.div>
          <span className="font-bold text-white">ClutchCore</span>
        </div>
        <p className="text-sm text-zinc-500">
          © {new Date().getFullYear()} ClutchCore. Not affiliated with Valve Corporation.
        </p>
        <div className="flex gap-6 text-sm text-zinc-400">
          <Link href="/deadlock" className="link-underline hover:text-purple-300">
            Dashboard
          </Link>
          <Link href="/deadlock/replays" className="link-underline hover:text-purple-300">
            Upload
          </Link>
          <Link href="#faq" className="link-underline hover:text-purple-300">
            FAQ
          </Link>
        </div>
      </div>
    </motion.footer>
  );
}
