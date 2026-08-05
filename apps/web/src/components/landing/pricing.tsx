'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { FadeIn, Stagger, StaggerItem } from '@/components/motion';
import { springSoft } from '@/lib/motion';

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    features: ['3 replays per month', 'Basic coaching report', 'Overall grade & priorities', 'Timeline mistakes'],
    cta: 'Get Started',
    highlight: false,
  },
  {
    name: 'Premium',
    price: '$12',
    period: '/month',
    features: [
      'Unlimited replay uploads',
      'Full coaching report + heatmaps',
      'AI chat coach',
      'Pro comparison',
      'Weekly improvement reports',
      'Hero-specific coaching plans',
      'Downloadable PDF reports',
    ],
    cta: 'Start Premium',
    highlight: true,
  },
  {
    name: 'Team',
    price: '$39',
    period: '/month',
    features: [
      'Everything in Premium',
      'Team replay analysis',
      'Shareable coaching reports',
      'Multi-replay comparison',
      'AI voice coaching summaries',
      '5 team members',
    ],
    cta: 'Contact Us',
    highlight: false,
  },
];

export function PricingSection() {
  return (
    <section id="pricing" className="px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <FadeIn inView className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-white">Simple Pricing</h2>
          <p className="text-zinc-400">Start free. Upgrade when you&apos;re ready to grind.</p>
        </FadeIn>

        <Stagger className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <StaggerItem key={plan.name}>
              <motion.div
                whileHover={{ y: plan.highlight ? -8 : -5, scale: plan.highlight ? 1.02 : 1.01 }}
                transition={springSoft}
                className={`h-full rounded-2xl p-6 ${
                  plan.highlight
                    ? 'scale-105 border-purple-500/50 glass glow-purple'
                    : 'glass'
                }`}
              >
                {plan.highlight && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mb-2 text-xs font-semibold uppercase tracking-wider text-purple-400"
                  >
                    Most Popular
                  </motion.div>
                )}
                <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                <div className="mb-6 mt-2">
                  <span className="text-4xl font-black text-white">{plan.price}</span>
                  <span className="text-sm text-zinc-400">{plan.period}</span>
                </div>
                <ul className="mb-8 space-y-3">
                  {plan.features.map((f, i) => (
                    <motion.li
                      key={f}
                      initial={{ opacity: 0, x: -8 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.05 * i }}
                      className="flex items-start gap-2 text-sm text-zinc-300"
                    >
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-purple-400" />
                      {f}
                    </motion.li>
                  ))}
                </ul>
                <Link href="/deadlock/replays">
                  <Button
                    variant={plan.highlight ? 'glow' : 'outline'}
                    className="w-full"
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </motion.div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
