'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';

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
    <section id="pricing" className="py-24 px-6">
      <div className="mx-auto max-w-7xl">
        <h2 className="text-3xl font-bold text-white text-center mb-4">Simple Pricing</h2>
        <p className="text-zinc-400 text-center mb-12">Start free. Upgrade when you&apos;re ready to grind.</p>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl p-6 ${
                plan.highlight
                  ? 'glass glow-purple border-purple-500/50 scale-105'
                  : 'glass'
              }`}
            >
              {plan.highlight && (
                <div className="text-xs font-semibold text-purple-400 mb-2 uppercase tracking-wider">
                  Most Popular
                </div>
              )}
              <h3 className="text-xl font-bold text-white">{plan.name}</h3>
              <div className="mt-2 mb-6">
                <span className="text-4xl font-black text-white">{plan.price}</span>
                <span className="text-zinc-400 text-sm">{plan.period}</span>
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-zinc-300">
                    <Check className="h-4 w-4 text-purple-400 mt-0.5 shrink-0" />
                    {f}
                  </li>
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
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
