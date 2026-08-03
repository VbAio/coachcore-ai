'use client';

import { motion } from 'framer-motion';
import {
  Brain, Map, Swords, TrendingUp, MessageSquare, BarChart3,
  Crosshair, Clock, Users,
} from 'lucide-react';

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
    <section id="features" className="py-24 px-6">
      <div className="mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Everything a Pro Coach Would Tell You
          </h2>
          <p className="text-zinc-400 max-w-2xl mx-auto">
            CoachCore AI analyzes every aspect of your gameplay and delivers actionable coaching — not raw statistics.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="glass rounded-2xl p-6 hover:border-purple-500/30 transition-all group"
            >
              <div className="h-12 w-12 rounded-xl bg-purple-500/20 flex items-center justify-center mb-4 group-hover:glow-purple transition-all">
                <feature.icon className="h-6 w-6 text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-sm text-zinc-400">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
