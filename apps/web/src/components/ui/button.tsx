'use client';

import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';
import { springSnappy } from '@/lib/motion';

type ButtonVariant = 'default' | 'outline' | 'ghost' | 'glow';
type ButtonSize = 'default' | 'lg' | 'sm';

type Props = Omit<HTMLMotionProps<'button'>, 'children'> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children?: React.ReactNode;
};

export function Button({
  className,
  variant = 'default',
  size = 'default',
  children,
  ...props
}: Props) {
  const variants: Record<ButtonVariant, string> = {
    default: 'gradient-purple text-white hover:opacity-90',
    outline: 'border border-purple-500/50 text-purple-300 hover:bg-purple-500/10',
    ghost: 'text-purple-300 hover:bg-white/5',
    glow: 'gradient-purple text-white glow-purple',
  };

  const sizes: Record<ButtonSize, string> = {
    default: 'h-10 px-4 py-2',
    lg: 'h-14 px-8 text-lg',
    sm: 'h-8 px-3 text-sm',
  };

  return (
    <motion.button
      whileHover={{ scale: 1.03, y: -1 }}
      whileTap={{ scale: 0.97 }}
      transition={springSnappy}
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
}
