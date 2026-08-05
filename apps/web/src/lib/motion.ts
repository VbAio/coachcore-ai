import type { Transition, Variants } from 'framer-motion';

/** Smooth cinematic ease used site-wide */
export const easeOutExpo: [number, number, number, number] = [0.16, 1, 0.3, 1];
export const easeOutSoft: [number, number, number, number] = [0.22, 1, 0.36, 1];
export const springSoft = { type: 'spring' as const, stiffness: 320, damping: 28, mass: 0.8 };
export const springSnappy = { type: 'spring' as const, stiffness: 420, damping: 32, mass: 0.7 };

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0 },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1 },
};

export const slideRight: Variants = {
  hidden: { opacity: 0, x: -12 },
  visible: { opacity: 1, x: 0 },
};

export const pageVariants: Variants = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06, delayChildren: 0.04 },
  },
};

export const staggerFast: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.04, delayChildren: 0.02 },
  },
};

export const defaultTransition: Transition = {
  duration: 0.45,
  ease: easeOutSoft,
};

export const viewPortOnce = { once: true, amount: 0.2, margin: '0px 0px -40px 0px' as const };
