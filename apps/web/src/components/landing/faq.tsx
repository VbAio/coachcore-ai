'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const faqs = [
  {
    q: 'What replay files are supported?',
    a: 'CoachCore AI supports Deadlock .dem replay files downloaded from the game. Upload directly from your replays folder.',
  },
  {
    q: 'How long does analysis take?',
    a: 'Most replays are analyzed in 2-5 minutes. You\'ll see live progress updates during processing.',
  },
  {
    q: 'Is the coaching real or just stats?',
    a: 'Every insight explains what happened, why it happened, what you should have done, and drills to improve. We never just show numbers.',
  },
  {
    q: 'What if the parser can\'t read all data?',
    a: 'We clearly label estimated insights. Our modular architecture supports upgrading to advanced parsers as Deadlock demo formats evolve.',
  },
  {
    q: 'Can I chat with the AI coach?',
    a: 'Premium users can ask questions like "Why was this death bad?" and get answers referencing specific timestamps.',
  },
];

export function FAQSection() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id="faq" className="py-24 px-6">
      <div className="mx-auto max-w-3xl">
        <h2 className="text-3xl font-bold text-white text-center mb-12">
          Frequently Asked Questions
        </h2>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div key={i} className="glass rounded-xl overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-5 text-left"
                onClick={() => setOpen(open === i ? null : i)}
              >
                <span className="font-medium text-white">{faq.q}</span>
                <ChevronDown
                  className={cn(
                    'h-5 w-5 text-purple-400 transition-transform',
                    open === i && 'rotate-180'
                  )}
                />
              </button>
              {open === i && (
                <div className="px-5 pb-5 text-sm text-zinc-400 leading-relaxed">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
