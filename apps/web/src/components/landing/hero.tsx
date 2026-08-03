'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Upload, Sparkles, Target, TrendingUp } from 'lucide-react';

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-purple-600/20 blur-3xl animate-pulse-glow" />
        <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-indigo-600/20 blur-3xl animate-pulse-glow" style={{ animationDelay: '1.5s' }} />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(120,50,200,0.15),transparent_70%)]" />
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'linear-gradient(rgba(147,51,234,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(147,51,234,0.3) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full glass px-4 py-2 text-sm text-purple-300">
            <Sparkles className="h-4 w-4" />
            AI-Powered Deadlock Coaching
          </div>

          <h1 className="mb-6 text-5xl md:text-7xl font-black tracking-tight text-white glow-text">
            Become Better
            <br />
            <span className="bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
              Every Game
            </span>
          </h1>

          <p className="mb-10 text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto">
            Upload your Deadlock replay and receive professional AI coaching in minutes.
            Not stats — real explanations of what happened, why, and how to improve.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/deadlock/replays">
              <Button variant="glow" size="lg" className="gap-2 w-full sm:w-auto">
                <Upload className="h-5 w-5" />
                Upload Replay
              </Button>
            </Link>
            <Link href="/deadlock">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                View Dashboard
              </Button>
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mt-16 grid grid-cols-3 gap-4 max-w-lg mx-auto"
        >
          {[
            { icon: Target, label: 'Timestamp Coaching' },
            { icon: TrendingUp, label: 'MMR Tracking' },
            { icon: Sparkles, label: 'Pro Comparisons' },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="glass rounded-xl p-4 text-center">
              <Icon className="h-6 w-6 text-purple-400 mx-auto mb-2" />
              <p className="text-xs text-zinc-400">{label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
