'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FadeIn } from '@/components/motion';
import { easeOutSoft } from '@/lib/motion';

const faqs = [
  {
    q: 'What replay files are supported?',
    a: 'ClutchCore supports Deadlock .dem replay files downloaded from the game. Upload directly from your replays folder.',
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
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="px-6 py-24">
      <div className="mx-auto max-w-3xl">
        <FadeIn inView>
          <h2 className="mb-12 text-center text-3xl font-bold text-white">
            Frequently Asked Questions
          </h2>
        </FadeIn>
        <div className="space-y-3">
          {faqs.map((faq, i) => {
            const isOpen = open === i;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05, duration: 0.4, ease: easeOutSoft }}
                className="overflow-hidden rounded-xl glass"
              >
                <button
                  type="button"
                  className="flex w-full items-center justify-between p-5 text-left"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                >
                  <span className="font-medium text-white">{faq.q}</span>
                  <motion.span
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <ChevronDown className={cn('h-5 w-5 text-purple-400')} />
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.28, ease: easeOutSoft }}
                    >
                      <div className="px-5 pb-5 text-sm leading-relaxed text-zinc-400">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
