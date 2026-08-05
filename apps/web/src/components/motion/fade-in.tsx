'use client';

import { motion, type HTMLMotionProps } from 'framer-motion';
import {
  defaultTransition,
  fadeIn,
  fadeUp,
  scaleIn,
  slideRight,
  viewPortOnce,
} from '@/lib/motion';
import { cn } from '@/lib/utils';

type Preset = 'fade' | 'up' | 'scale' | 'right';

const presets = {
  fade: fadeIn,
  up: fadeUp,
  scale: scaleIn,
  right: slideRight,
} as const;

interface FadeInProps extends HTMLMotionProps<'div'> {
  preset?: Preset;
  delay?: number;
  duration?: number;
  /** Animate when scrolled into view instead of on mount */
  inView?: boolean;
}

export function FadeIn({
  children,
  className,
  preset = 'up',
  delay = 0,
  duration = 0.45,
  inView = false,
  ...props
}: FadeInProps) {
  const variants = presets[preset];
  const transition = { ...defaultTransition, duration, delay };

  if (inView) {
    return (
      <motion.div
        className={cn(className)}
        variants={variants}
        initial="hidden"
        whileInView="visible"
        viewport={viewPortOnce}
        transition={transition}
        {...props}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      className={cn(className)}
      variants={variants}
      initial="hidden"
      animate="visible"
      transition={transition}
      {...props}
    >
      {children}
    </motion.div>
  );
}
