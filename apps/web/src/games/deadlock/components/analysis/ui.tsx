'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { easeOutSoft, springSoft } from '@/lib/motion';

export function GlassCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.45, ease: easeOutSoft }}
      whileHover={{ y: -2, borderColor: 'rgba(251,191,36,0.25)' }}
      className={cn(
        'rounded-2xl border border-white/10 bg-white/[0.04] shadow-[0_8px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl',
        className
      )}
    >
      {children}
    </motion.div>
  );
}

export function SectionTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <motion.div
      className="mb-3"
      initial={{ opacity: 0, x: -8 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={springSoft}
    >
      <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-200/90">
        {title}
      </h2>
      {subtitle && <p className="mt-1 text-xs text-zinc-500">{subtitle}</p>}
    </motion.div>
  );
}
