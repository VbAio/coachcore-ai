'use client';

import { motion, type HTMLMotionProps } from 'framer-motion';
import { springSoft } from '@/lib/motion';
import { cn } from '@/lib/utils';

interface MotionCardProps extends HTMLMotionProps<'div'> {
  lift?: boolean;
  glow?: boolean;
}

/** Interactive glass-style card with hover lift / press feedback */
export function MotionCard({
  children,
  className,
  lift = true,
  glow = false,
  ...props
}: MotionCardProps) {
  return (
    <motion.div
      className={cn(
        'rounded-2xl border border-white/10 bg-white/[0.04] shadow-[0_8px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl',
        glow && 'hover:shadow-[0_0_40px_rgba(147,51,234,0.2)]',
        className
      )}
      whileHover={
        lift
          ? { y: -4, borderColor: 'rgba(168,85,247,0.35)', transition: springSoft }
          : undefined
      }
      whileTap={lift ? { scale: 0.985 } : undefined}
      transition={springSoft}
      {...props}
    >
      {children}
    </motion.div>
  );
}
