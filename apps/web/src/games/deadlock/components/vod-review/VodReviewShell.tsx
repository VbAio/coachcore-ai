'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import type { CoachingReportPayload } from '@coachcore/shared';
import { cn } from '@/lib/utils';
import { buildTimelineRows } from './build-timeline-rows';
import { CoachingMomentCard } from './CoachingMomentCard';
import { EventTimeline } from './EventTimeline';
import { FightPanel } from './FightPanel';
import { MatchMap } from './MatchMap';
import { PlaybackControls } from './PlaybackControls';
import type { TimelineFilter, TimelineRow } from './types';

interface Props {
  data: CoachingReportPayload;
}

export function VodReviewShell({ data }: Props) {
  const { report, timeline } = data;
  const duration = timeline?.durationSeconds ?? report.timeline.at(-1)?.timestamp ?? 600;
  const rows = useMemo(() => buildTimelineRows(report, timeline), [report, timeline]);

  const [t, setT] = useState(rows[0]?.timestamp ?? 0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [filter, setFilter] = useState<TimelineFilter>('all');
  const [selectedId, setSelectedId] = useState<string | null>(
    rows.find((r) => r.insight)?.id ?? rows[0]?.id ?? null
  );
  const [activeFightId, setActiveFightId] = useState<string | null>(null);
  const speedRef = useRef(speed);
  const durationRef = useRef(duration);
  speedRef.current = speed;
  durationRef.current = duration;

  const selected = rows.find((r) => r.id === selectedId) ?? null;
  const insight =
    selected?.insight ??
    report.timeline.find(
      (i) => Math.abs(i.timestamp - t) < 2 || i.relatedEventIds?.some((id) => id === selectedId)
    ) ??
    null;

  const highlightPlayerIds = selected?.involvedPlayerIds ?? insight?.involvedPlayerIds ?? [];
  const marker = selected?.position ?? insight?.position ?? null;

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      setT((prev) => {
        const next = prev + 0.25 * speedRef.current;
        if (next >= durationRef.current) {
          setPlaying(false);
          return durationRef.current;
        }
        return next;
      });
    }, 250);
    return () => window.clearInterval(id);
  }, [playing]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === 'Space') {
        e.preventDefault();
        setPlaying((p) => !p);
      } else if (e.key === 'j' || e.key === 'J') {
        setT((v) => Math.max(0, v - 1));
        setPlaying(false);
      } else if (e.key === 'l' || e.key === 'L') {
        setT((v) => Math.min(duration, v + 1));
        setPlaying(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [duration]);

  const selectRow = (row: TimelineRow) => {
    setSelectedId(row.id);
    setT(row.timestamp);
    setPlaying(false);
    if (row.kind === 'teamfight') setActiveFightId(row.id);
  };

  const confidence = report.extractionConfidence ?? timeline?.extractionConfidence ?? 'minimal';
  const skillEntries = Object.entries(report.skillScores).filter(([k]) => k !== 'overall');

  return (
    <div className="space-y-4">
      {/* Compact score strip */}
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-zinc-800 pb-4">
        <div>
          <div className="flex items-baseline gap-3">
            <span className="font-serif text-4xl font-bold tracking-tight text-amber-300">
              {report.overallGrade}
            </span>
            <h1 className="text-xl font-semibold text-white">Match Review</h1>
            <span className="text-sm text-zinc-500">{report.overallScore}/100</span>
          </div>
          <p className="mt-1 text-sm text-zinc-400">
            {report.biggestStrength} · Focus: {report.biggestWeakness}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {skillEntries.slice(0, 4).map(([k, v]) => (
            <span key={k} className="rounded bg-zinc-900 px-2 py-1 text-[11px] text-zinc-400">
              {k} <span className="text-zinc-200">{v}</span>
            </span>
          ))}
          <span
            className={cn(
              'rounded px-2 py-1 text-[11px]',
              confidence === 'full'
                ? 'bg-emerald-500/15 text-emerald-300'
                : confidence === 'partial'
                  ? 'bg-amber-500/15 text-amber-300'
                  : 'bg-yellow-500/15 text-yellow-300'
            )}
          >
            Parse {confidence}
          </span>
        </div>
      </header>

      {(confidence === 'minimal' || (report.parserNotes?.length ?? 0) > 0) && (
        <div className="flex gap-2 rounded-lg border border-amber-500/25 bg-amber-500/5 px-3 py-2 text-xs text-amber-200/90">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <div>
            {confidence === 'minimal' && (
              <p className="font-medium">Limited parse data — coaching may be incomplete.</p>
            )}
            <ul className="mt-0.5 space-y-0.5 text-amber-200/70">
              {(report.parserNotes ?? timeline?.parserNotes ?? []).slice(0, 4).map((n, i) => (
                <li key={i}>{n}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)_320px] lg:items-stretch">
        {/* Left: timeline */}
        <aside className="flex min-h-[420px] flex-col rounded-xl border border-zinc-800 bg-zinc-950/40 p-3">
          <div className="mb-2 text-[11px] uppercase tracking-wide text-zinc-500">Timeline</div>
          <EventTimeline
            rows={rows}
            filter={filter}
            selectedId={selectedId}
            onFilter={setFilter}
            onSelect={selectRow}
          />
        </aside>

        {/* Center: map + controls */}
        <section className="flex min-h-[420px] flex-col gap-3">
          <MatchMap
            timeline={timeline}
            t={t}
            highlightPlayerIds={highlightPlayerIds}
            marker={marker}
          />
          <PlaybackControls
            t={t}
            duration={duration}
            playing={playing}
            speed={speed}
            onSeek={(v) => {
              setT(v);
              setPlaying(false);
            }}
            onTogglePlay={() => setPlaying((p) => !p)}
            onSpeed={setSpeed}
            onStep={(d) => {
              setT((v) => Math.min(duration, Math.max(0, v + d)));
              setPlaying(false);
            }}
          />
          <p className="text-center text-[11px] text-zinc-600">
            Space play/pause · J / L ±1s · click timeline to jump
          </p>
        </section>

        {/* Right: coaching + fights */}
        <aside className="flex min-h-[420px] flex-col gap-3">
          <CoachingMomentCard insight={insight} />
          <FightPanel
            fights={report.teamFightAnalysis}
            timeline={timeline}
            activeFightId={activeFightId}
            onJump={(start, fightId) => {
              setT(start);
              setActiveFightId(fightId);
              setPlaying(false);
              const row = rows.find((r) => r.id === fightId || (r.kind === 'teamfight' && r.timestamp === start));
              if (row) setSelectedId(row.id);
            }}
          />
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3 text-xs text-zinc-400">
            <div className="mb-1 text-[11px] uppercase tracking-wide text-zinc-500">Practice</div>
            <p className="text-zinc-300">{report.improvementPlan.todaysFocus}</p>
            <ul className="mt-2 space-y-1">
              {report.improvementPlan.practiceDrills.slice(0, 3).map((d, i) => (
                <li key={i}>· {d}</li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
