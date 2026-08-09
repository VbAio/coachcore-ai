'use client';

import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import type { SkillAxisMeta } from '@clutchcore/shared';
import { GlassCard, SectionTitle } from '../ui';

export function SkillRadar({ axes }: { axes: SkillAxisMeta[] }) {
  const data = axes.map((a) => ({
    skill: a.label,
    score: a.score,
    fullMark: 100,
  }));

  return (
    <GlassCard className="p-4">
      <SectionTitle title="Skill breakdown" subtitle="Per-axis scores from this match" />
      <div className="h-72 w-full">
        <ResponsiveContainer>
          <RadarChart data={data}>
            <PolarGrid stroke="rgba(255,255,255,0.12)" />
            <PolarAngleAxis dataKey="skill" tick={{ fill: '#a1a1aa', fontSize: 10 }} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
            <Radar
              name="Score"
              dataKey="score"
              stroke="#fbbf24"
              fill="#fbbf24"
              fillOpacity={0.28}
            />
            <Tooltip
              contentStyle={{
                background: '#09090b',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 12,
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {axes
          .filter((a) => a.isWeakness || a.isStrength)
          .slice(0, 8)
          .map((a) => (
            <div
              key={a.key}
              className={`rounded-lg border px-2 py-1.5 text-xs ${
                a.isStrength
                  ? 'border-emerald-500/30 text-emerald-200'
                  : 'border-rose-500/30 text-rose-200'
              }`}
            >
              <div className="font-medium">{a.label}</div>
              <div className="text-[10px] opacity-80">
                {a.score} · {a.isStrength ? 'strength' : 'weakness'}
              </div>
            </div>
          ))}
      </div>
    </GlassCard>
  );
}
