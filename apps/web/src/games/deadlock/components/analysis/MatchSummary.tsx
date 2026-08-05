'use client';

import type { MatchSummaryStats } from '@coachcore/shared';
import { GlassCard } from './ui';
import { formatClock } from '../vod-review/format';

export function PerformanceScore({
  score,
  grade,
}: {
  score: number;
  grade: string;
}) {
  const r = 54;
  const c = 2 * Math.PI * r;
  const pct = Math.min(100, Math.max(0, score)) / 100;
  const offset = c * (1 - pct);

  return (
    <div className="relative flex h-36 w-36 items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 128 128">
        <circle cx="64" cy="64" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
        <circle
          cx="64"
          cy="64"
          r={r}
          fill="none"
          stroke="url(#scoreGrad)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-1000 ease-out"
        />
        <defs>
          <linearGradient id="scoreGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#34d399" />
          </linearGradient>
        </defs>
      </svg>
      <div className="text-center">
        <div className="text-3xl font-bold text-white">{score}</div>
        <div className="text-xs font-semibold uppercase tracking-widest text-amber-300">{grade}</div>
      </div>
    </div>
  );
}

export function MatchSummary({ summary }: { summary: MatchSummaryStats }) {
  return (
    <GlassCard className="p-5">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-5">
          <PerformanceScore score={summary.overallScore} grade={summary.letterGrade} />
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Match review</p>
            <h1 className="mt-1 font-serif text-3xl text-white">{summary.hero}</h1>
            <p className="mt-1 text-sm text-zinc-400">
              {formatClock(summary.durationSeconds)} · {summary.currentSkillRating} →{' '}
              <span className="text-emerald-300">{summary.estimatedRank}</span>
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <Pill label="K/D/A" value={`${summary.kills}/${summary.deaths}/${summary.assists}`} />
              <Pill label="Damage" value={summary.damage > 0 ? String(summary.damage) : '—'} />
              <Pill label="Objectives" value={`${summary.objectiveScore}`} />
              <Pill label="Fights" value={`${summary.teamFightScore}`} />
              <Pill label="Confidence" value={`${summary.confidence}%`} />
            </div>
          </div>
        </div>

        <div className="grid flex-1 gap-3 sm:grid-cols-3">
          <FocusCard tone="good" title="Biggest strength" body={summary.biggestStrength} />
          <FocusCard tone="bad" title="Biggest weakness" body={summary.biggestWeakness} />
          <div className="rounded-xl border border-white/10 bg-black/30 p-3">
            <p className="text-[10px] uppercase tracking-wider text-zinc-500">Top 3 priorities</p>
            <ol className="mt-2 space-y-1.5 text-sm text-zinc-200">
              {summary.topPriorities.map((p, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-amber-400">{i + 1}.</span>
                  <span className="leading-snug">{p}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

function Pill({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-zinc-300">
      <span className="text-zinc-500">{label}</span> <span className="font-semibold text-white">{value}</span>
    </span>
  );
}

function FocusCard({
  title,
  body,
  tone,
}: {
  title: string;
  body: string;
  tone: 'good' | 'bad';
}) {
  return (
    <div
      className={`rounded-xl border p-3 ${
        tone === 'good'
          ? 'border-emerald-500/30 bg-emerald-500/10'
          : 'border-rose-500/30 bg-rose-500/10'
      }`}
    >
      <p className="text-[10px] uppercase tracking-wider text-zinc-400">{title}</p>
      <p className="mt-1 text-sm font-medium text-white">{body}</p>
    </div>
  );
}
