'use client';

import type { RlMatchTimeline, RlSkillScores } from '@clutchcore/shared';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { RlGlass, RlSectionTitle } from '../ui';

export function RlSkillRadar({ scores }: { scores: RlSkillScores }) {
  const data = [
    { skill: 'Mech', value: scores.mechanical },
    { skill: 'Sense', value: scores.gameSense },
    { skill: 'Boost', value: scores.boost },
    { skill: 'Rotate', value: scores.rotation },
    { skill: 'Recover', value: scores.recovery },
    { skill: 'Aerial', value: scores.aerial },
    { skill: 'Kickoff', value: scores.kickoff },
    { skill: 'Defense', value: scores.defense },
    { skill: 'Offense', value: scores.offense },
  ];

  return (
    <RlGlass className="p-4">
      <RlSectionTitle title="Skill Radar" />
      <ResponsiveContainer width="100%" height={240}>
        <RadarChart data={data}>
          <PolarGrid stroke="#333" />
          <PolarAngleAxis dataKey="skill" tick={{ fill: '#a1a1aa', fontSize: 11 }} />
          <Radar dataKey="value" stroke="#38bdf8" fill="#f97316" fillOpacity={0.28} />
        </RadarChart>
      </ResponsiveContainer>
    </RlGlass>
  );
}

export function RlBoostSpeedCharts({ timeline }: { timeline: RlMatchTimeline | null }) {
  if (!timeline) {
    return (
      <RlGlass className="p-4">
        <RlSectionTitle title="Boost / Speed" subtitle="No timeline tracks" />
      </RlGlass>
    );
  }

  const subject = timeline.subjectPlayerId;
  const samples = timeline.playerTracks
    .filter((s) => s.playerId === subject)
    .filter((_, i) => i % 4 === 0)
    .map((s) => ({
      t: Math.round(s.t),
      boost: Math.round(s.boost),
      speed: Math.round(s.speed / 20),
    }));

  return (
    <RlGlass className="p-4">
      <RlSectionTitle title="Boost & Speed" subtitle="Subject track" />
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={samples}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis dataKey="t" stroke="#666" tick={{ fontSize: 10 }} />
          <YAxis stroke="#666" tick={{ fontSize: 10 }} />
          <Tooltip contentStyle={{ background: '#111', border: '1px solid #333' }} />
          <Line type="monotone" dataKey="boost" stroke="#38bdf8" dot={false} strokeWidth={2} />
          <Line type="monotone" dataKey="speed" stroke="#f97316" dot={false} strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </RlGlass>
  );
}
