'use client';

import { motion } from 'framer-motion';
import {
  Brain, Map, Swords, TrendingUp, MessageSquare, BarChart3,
  Crosshair, Clock, Users,
} from 'lucide-react';
import { FadeIn, Stagger, StaggerItem } from '@/components/motion';
import { springSoft } from '@/lib/motion';

const features = [
  { icon: Brain, title: 'AI Coach Engine', desc: 'Every mistake explained — what happened, why, and what to do instead.' },
  { icon: Clock, title: 'Interactive Timeline', desc: 'Click any timestamp to jump to the moment with coach explanations.' },
  { icon: Map, title: 'Positioning Heatmaps', desc: 'Movement, deaths, farming, and danger zones visualized on the map.' },
  { icon: Swords, title: 'Team Fight Breakdown', desc: 'Full fight analysis — engagement, target focus, and win probability.' },
  { icon: TrendingUp, title: 'Progress Tracking', desc: 'Skill ratings across mechanics, macro, awareness, and more over weeks.' },
  { icon: MessageSquare, title: 'AI Chat Coach', desc: 'Ask "Why was this death bad?" and get timestamp-referenced answers.' },
  { icon: BarChart3, title: 'Pro Comparison', desc: 'Compare farm, positioning, and decisions against top 1% players.' },
  { icon: Crosshair, title: 'Hero-Specific Coaching', desc: 'Combos, matchups, itemization, and power spikes for your hero.' },
  { icon: Users, title: 'Team Analysis', desc: 'Premium team replay review with shareable coaching reports.' },
];

export function FeaturesSection() {
  return (
    <section id="features" className="px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <FadeIn inView className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl">
            Everything a Pro Coach Would Tell You
          </h2>
          <p className="mx-auto max-w-2xl text-zinc-400">
            ClutchCore analyzes every aspect of your gameplay and delivers actionable coaching — not raw statistics.
          </p>
        </FadeIn>

        <Stagger className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <StaggerItem key={feature.title}>
              <motion.div
                whileHover={{ y: -6, borderColor: 'rgba(168,85,247,0.35)' }}
                transition={springSoft}
                className="group h-full rounded-2xl p-6 glass"
              >
                <motion.div
                  whileHover={{ scale: 1.08, rotate: -4 }}
                  className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/20 transition-shadow group-hover:glow-purple"
                >
                  <feature.icon className="h-6 w-6 text-purple-400" />
                </motion.div>
                <h3 className="mb-2 text-lg font-semibold text-white">{feature.title}</h3>
                <p className="text-sm text-zinc-400">{feature.desc}</p>
              </motion.div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
