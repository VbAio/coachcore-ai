'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

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
        <div className="absolute -left-32 top-20 h-96 w-96 rounded-full bg-purple-600/20 blur-[120px]" />
        <div className="absolute -right-32 bottom-20 h-96 w-96 rounded-full bg-indigo-600/20 blur-[120px]" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-purple text-sm font-bold">
            CC
          </div>
          <span className="text-xl font-bold text-white">CoachCore AI</span>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="glass rounded-2xl p-8"
        >
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-white">{title}</h1>
            {subtitle && <p className="mt-2 text-sm text-zinc-400">{subtitle}</p>}
          </div>
          {children}
        </motion.div>
      </div>
    </div>
  );
}
