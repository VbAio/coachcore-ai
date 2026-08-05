'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Upload, Sparkles, Target, TrendingUp } from 'lucide-react';
import { easeOutSoft, staggerContainer, fadeUp } from '@/lib/motion';

export function HeroSection() {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden pt-[calc(4rem+var(--verify-banner-height))]">
      <div className="absolute inset-0">
        <div className="absolute left-1/4 top-1/4 h-96 w-96 animate-pulse-glow rounded-full bg-purple-600/20 blur-3xl" />
        <div
          className="absolute bottom-1/4 right-1/4 h-96 w-96 animate-pulse-glow rounded-full bg-indigo-600/20 blur-3xl"
          style={{ animationDelay: '1.5s' }}
        />
        <motion.div
          className="absolute left-[12%] top-[28%] h-24 w-24 rounded-full bg-purple-500/10 blur-2xl"
          animate={{ y: [0, -18, 0], x: [0, 10, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-[22%] right-[18%] h-32 w-32 rounded-full bg-indigo-500/10 blur-2xl"
          animate={{ y: [0, 16, 0], x: [0, -12, 0] }}
          transition={{ duration: 8.5, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(120,50,200,0.15),transparent_70%)]" />
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              'linear-gradient(rgba(147,51,234,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(147,51,234,0.3) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
            maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
          }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-6 text-center">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          <motion.div
            variants={fadeUp}
            className="mb-6 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm text-purple-300 glass"
          >
            <motion.span
              animate={{ rotate: [0, 12, -8, 0] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Sparkles className="h-4 w-4" />
            </motion.span>
            AI-Powered Deadlock Coaching
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="mb-6 text-5xl font-black tracking-tight text-white glow-text md:text-7xl"
          >
            Become Better
            <br />
            <span className="animate-gradient-shift bg-gradient-to-r from-purple-400 via-fuchsia-300 to-indigo-400 bg-clip-text text-transparent">
              Every Game
            </span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="mx-auto mb-10 max-w-2xl text-lg text-zinc-400 md:text-xl"
          >
            Upload your Deadlock replay and receive professional AI coaching in minutes.
            Not stats — real explanations of what happened, why, and how to improve.
          </motion.p>

          <motion.div
            variants={fadeUp}
            className="flex flex-col justify-center gap-4 sm:flex-row"
          >
            <Link href="/deadlock/replays">
              <Button variant="glow" size="lg" className="w-full gap-2 sm:w-auto">
                <Upload className="h-5 w-5" />
                Upload Replay
              </Button>
            </Link>
            <Link href="/deadlock">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                View Dashboard
              </Button>
            </Link>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.35, ease: easeOutSoft }}
          className="mx-auto mt-16 grid max-w-lg grid-cols-3 gap-4"
        >
          {[
            { icon: Target, label: 'Timestamp Coaching' },
            { icon: TrendingUp, label: 'MMR Tracking' },
            { icon: Sparkles, label: 'Pro Comparisons' },
          ].map(({ icon: Icon, label }, i) => (
            <motion.div
              key={label}
              whileHover={{ y: -6, scale: 1.03 }}
              transition={{ type: 'spring', stiffness: 360, damping: 22 }}
              className="rounded-xl p-4 text-center glass glass-interactive"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <Icon className="mx-auto mb-2 h-6 w-6 text-purple-400" />
              <p className="text-xs text-zinc-400">{label}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
