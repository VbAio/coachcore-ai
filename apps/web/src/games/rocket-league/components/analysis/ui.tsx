'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export function RlGlass({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'rounded-2xl border border-white/10 bg-gradient-to-br from-sky-500/[0.07] via-white/[0.03] to-orange-500/[0.07] shadow-[0_8px_40px_rgba(0,0,0,0.4)] backdrop-blur-xl',
        className
      )}
    >
      {children}
    </motion.div>
  );
}

export function RlSectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-3">
      <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-300/90">{title}</h2>
      {subtitle && <p className="mt-1 text-xs text-zinc-500">{subtitle}</p>}
    </div>
  );
}

export function formatClock(t: number): string {
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  const ds = Math.floor((t % 1) * 10);
  return `${m}:${s.toString().padStart(2, '0')}.${ds}`;
}
