'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { easeOutSoft, fadeUp, staggerContainer } from '@/lib/motion';

export function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-black">
      <div className="pointer-events-none absolute inset-0">
        <motion.div
          className="absolute -left-32 top-20 h-96 w-96 rounded-full bg-purple-600/20 blur-[120px]"
          animate={{ opacity: [0.45, 0.75, 0.45], scale: [1, 1.08, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -right-32 bottom-20 h-96 w-96 rounded-full bg-indigo-600/20 blur-[120px]"
          animate={{ opacity: [0.4, 0.7, 0.4], scale: [1.05, 1, 1.05] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={fadeUp}>
            <Link href="/" className="mb-8 flex items-center justify-center gap-2">
              <motion.div
                whileHover={{ scale: 1.08, rotate: -4 }}
                className="flex h-10 w-10 items-center justify-center rounded-xl gradient-purple text-sm font-bold"
              >
                CC
              </motion.div>
              <span className="text-xl font-bold text-white">CoachCore AI</span>
            </Link>
          </motion.div>

          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.45, ease: easeOutSoft }}
            className="rounded-2xl p-8 glass"
          >
            <div className="mb-6 text-center">
              <h1 className="text-2xl font-bold text-white">{title}</h1>
              {subtitle && <p className="mt-2 text-sm text-zinc-400">{subtitle}</p>}
            </div>
            {children}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
