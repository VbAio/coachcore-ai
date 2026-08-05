'use client';

import { motion, type HTMLMotionProps } from 'framer-motion';
import {
  defaultTransition,
  fadeUp,
  staggerContainer,
  staggerFast,
  viewPortOnce,
} from '@/lib/motion';
import { cn } from '@/lib/utils';

interface StaggerProps extends HTMLMotionProps<'div'> {
  fast?: boolean;
  inView?: boolean;
}

export function Stagger({
  children,
  className,
  fast = false,
  inView = true,
  ...props
}: StaggerProps) {
  const variants = fast ? staggerFast : staggerContainer;

  if (inView) {
    return (
      <motion.div
        className={cn(className)}
        variants={variants}
        initial="hidden"
        whileInView="visible"
        viewport={viewPortOnce}
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
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
  ...props
}: HTMLMotionProps<'div'>) {
  return (
    <motion.div
      className={cn(className)}
      variants={fadeUp}
      transition={defaultTransition}
      {...props}
    >
      {children}
    </motion.div>
  );
}
