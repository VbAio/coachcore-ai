'use client';

import { motion } from 'framer-motion';
import type { RlGrade } from '@clutchcore/shared';

export function RlPerformanceScore({ grade, score }: { grade: RlGrade; score: number }) {
  const pct = Math.max(0, Math.min(100, score));
  const r = 42;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;

  return (
    <div className="relative flex h-28 w-28 items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
        <motion.circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="url(#rlGradeGrad)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        />
        <defs>
          <linearGradient id="rlGradeGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#f97316" />
          </linearGradient>
        </defs>
      </svg>
      <div className="text-center">
        <p className="text-2xl font-bold text-white">{grade}</p>
        <p className="text-xs text-zinc-400">{score}</p>
      </div>
    </div>
  );
}
