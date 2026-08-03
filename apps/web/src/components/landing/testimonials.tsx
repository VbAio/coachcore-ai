'use client';

import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

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
    <section className="py-24 px-6 bg-purple-950/10">
      <div className="mx-auto max-w-7xl">
        <h2 className="text-3xl font-bold text-white text-center mb-12">
          Trusted by Deadlock Players
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass rounded-2xl p-6"
            >
              <div className="flex gap-1 mb-4">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} className="h-4 w-4 fill-purple-400 text-purple-400" />
                ))}
              </div>
              <p className="text-zinc-300 mb-4 text-sm leading-relaxed">&ldquo;{t.text}&rdquo;</p>
              <div>
                <p className="font-semibold text-white">{t.name}</p>
                <p className="text-xs text-purple-400">{t.rank}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
