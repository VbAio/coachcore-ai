'use client';

import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { CoachInsight, MistakeCategory, TeamFightBreakdown } from '@coachcore/shared';
import { GlassCard, SectionTitle } from '../ui';
import { formatClock } from '../../vod-review/format';

const COLORS = ['#fbbf24', '#34d399', '#38bdf8', '#f472b6', '#a78bfa', '#fb7185', '#2dd4bf'];

export function CategoryDistribution({
  byCategory,
}: {
  byCategory: Partial<Record<MistakeCategory, CoachInsight[]>>;
}) {
  const data = Object.entries(byCategory)
    .map(([name, list]) => ({
      name: name.replace(/_/g, ' '),
      value: list?.filter((i) => i.polarity === 'mistake').length ?? 0,
    }))
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value);

  return (
    <GlassCard className="p-4">
      <SectionTitle title="Mistake categories" subtitle="Distribution of event-backed mistakes" />
      <div className="h-56 w-full">
        {data.length === 0 ? (
          <p className="py-16 text-center text-sm text-zinc-500">No mistake categories yet</p>
        ) : (
          <ResponsiveContainer>
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" innerRadius={48} outerRadius={80}>
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: '#09090b',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 12,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </GlassCard>
  );
}

export function FightParticipation({
  fights,
  onJump,
}: {
  fights: TeamFightBreakdown[];
  onJump?: (t: number) => void;
}) {
  const data = fights.slice(0, 12).map((f, i) => ({
    name: `F${i + 1}`,
    startTime: f.startTime,
    label: formatClock(f.startTime),
    good: f.goodPlays.length,
    mistakes: f.mistakes.length,
  }));

  return (
    <GlassCard className="p-4">
      <SectionTitle
        title="Fight participation"
        subtitle="Good plays vs mistakes per team fight — click a bar to jump"
      />
      <div className="h-56 w-full">
        {data.length === 0 ? (
          <p className="py-16 text-center text-sm text-zinc-500">No team-fight breakdowns</p>
        ) : (
          <ResponsiveContainer>
            <BarChart
              data={data}
              onClick={(state) => {
                const payload = state?.activePayload?.[0]?.payload as
                  | { startTime?: number }
                  | undefined;
                if (payload?.startTime != null) onJump?.(payload.startTime);
              }}
            >
              <XAxis dataKey="label" tick={{ fill: '#71717a', fontSize: 10 }} />
              <YAxis allowDecimals={false} tick={{ fill: '#71717a', fontSize: 10 }} />
              <Tooltip
                contentStyle={{
                  background: '#09090b',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 12,
                }}
              />
              <Bar dataKey="good" stackId="a" fill="#34d399" radius={[0, 0, 0, 0]} cursor="pointer" />
              <Bar dataKey="mistakes" stackId="a" fill="#fb7185" radius={[6, 6, 0, 0]} cursor="pointer" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </GlassCard>
  );
}

export function MistakeFrequency({ timeline }: { timeline: CoachInsight[] }) {
  const buckets = new Map<number, number>();
  for (const m of timeline.filter((t) => t.polarity === 'mistake')) {
    const min = Math.floor(m.timestamp / 60);
    buckets.set(min, (buckets.get(min) ?? 0) + 1);
  }
  const data = [...buckets.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([minute, count]) => ({ minute: `${minute}m`, count }));

  return (
    <GlassCard className="p-4">
      <SectionTitle title="Mistake frequency" subtitle="Mistakes per match minute" />
      <div className="h-56 w-full">
        {data.length === 0 ? (
          <p className="py-16 text-center text-sm text-zinc-500">No mistake timeline</p>
        ) : (
          <ResponsiveContainer>
            <BarChart data={data}>
              <XAxis dataKey="minute" tick={{ fill: '#71717a', fontSize: 10 }} />
              <YAxis allowDecimals={false} tick={{ fill: '#71717a', fontSize: 10 }} />
              <Tooltip
                contentStyle={{
                  background: '#09090b',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 12,
                }}
              />
              <Bar dataKey="count" fill="#fb7185" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </GlassCard>
  );
}
