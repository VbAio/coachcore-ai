'use client';

import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { FadeIn, Stagger, StaggerItem } from '@/components/motion';
import { springSoft } from '@/lib/motion';

const testimonials = [
  {
    name: 'Vortex',
    rank: 'Diamond III',
    text: 'Finally something that tells me WHY I died, not just that I died 8 times. The timeline coaching is insane.',
    rating: 5,
  },
  {
    name: 'Nyxara',
    rank: 'Platinum I',
    text: 'Went from hardstuck Plat to Diamond in 3 weeks just following the improvement plan drills. Game changer.',
    rating: 5,
  },
  {
    name: 'PhantomEdge',
    rank: 'Ascendant',
    text: 'Even at high rank, the macro analysis catches things I miss. Pro comparison heatmaps are eye-opening.',
    rating: 5,
  },
];

export function TestimonialsSection() {
  return (
    <section className="bg-purple-950/10 px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <FadeIn inView>
          <h2 className="mb-12 text-center text-3xl font-bold text-white">
            Trusted by Deadlock Players
          </h2>
        </FadeIn>
        <Stagger className="grid gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <StaggerItem key={t.name}>
              <motion.div
                whileHover={{ y: -6, scale: 1.02 }}
                transition={springSoft}
                className="h-full rounded-2xl p-6 glass"
              >
                <div className="mb-4 flex gap-1">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <motion.span
                      key={j}
                      initial={{ opacity: 0, scale: 0.5 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.08 * j, type: 'spring', stiffness: 400, damping: 18 }}
                    >
                      <Star className="h-4 w-4 fill-purple-400 text-purple-400" />
                    </motion.span>
                  ))}
                </div>
                <p className="mb-4 text-sm leading-relaxed text-zinc-300">&ldquo;{t.text}&rdquo;</p>
                <div>
                  <p className="font-semibold text-white">{t.name}</p>
                  <p className="text-xs text-purple-400">{t.rank}</p>
                </div>
              </motion.div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
