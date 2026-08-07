'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type { RlCoachingReportPayload, RlCoachInsight } from '@coachcore/shared';
import { RlMatchSummary } from './RlMatchSummary';
import { RlTimeline, type RlTimelineRow } from './RlTimeline';
import { RlCoachPanel } from './RlCoachPanel';
import { RlFieldVisualizer } from './RlFieldVisualizer';
import { RlHeatmapViewer } from './RlHeatmapViewer';
import { RlBoostAnalysis } from './RlBoostAnalysis';
import { RlRotationAnalysis } from './RlRotationAnalysis';
import { RlShotAnalysis } from './RlShotAnalysis';
import { RlDefenseAnalysis } from './RlDefenseAnalysis';
import { RlMechanicsPanel } from './RlMechanicsPanel';
import { RlPatternPanel } from './RlPatternPanel';
import { RlInsightPanel } from './RlInsightPanel';
import { RlImprovementPlan } from './RlImprovementPlan';
import { RlSkillRadar, RlBoostSpeedCharts } from './charts/RlCharts';
import { formatClock } from './ui';
import { Pause, Play } from 'lucide-react';

interface Props {
  data: RlCoachingReportPayload;
}

export function RlPremiumAnalysisShell({ data }: Props) {
  const report = data.report;
  const timeline = data.timeline;
  const duration =
    timeline?.durationSeconds ??
    report.matchSummary.durationSeconds ??
    report.timeline.at(-1)?.timestamp ??
    300;

  const rows = useMemo(() => {
    const fromInsights: RlTimelineRow[] = report.timeline.map((insight) => ({
      id: insight.id,
      t: insight.timestamp,
      label: insight.title,
      kind: insight.eventType,
      insight,
      actorId: insight.involvedPlayerIds[0],
    }));
    if (!timeline?.events?.length) return fromInsights;
    const insightByTime = new Map(fromInsights.map((r) => [Math.round(r.t * 10), r]));
    const eventRows: RlTimelineRow[] = timeline.events.map((e) => {
      const match = insightByTime.get(Math.round(e.t * 10));
      return {
        id: e.id,
        t: e.t,
        label: e.label,
        kind: e.type,
        insight: match?.insight,
        actorId: e.actorId,
      };
    });
    // Prefer insight-rich rows + unique event rows
    const seen = new Set<string>();
    const merged: RlTimelineRow[] = [];
    for (const r of [...fromInsights, ...eventRows]) {
      const key = `${r.t}-${r.label}`;
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(r);
    }
    return merged.sort((a, b) => a.t - b.t);
  }, [report.timeline, timeline]);

  const [t, setT] = useState(rows[0]?.t ?? 0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(
    rows.find((r) => r.insight)?.id ?? rows[0]?.id ?? null
  );
  const speedRef = useRef(speed);
  const durationRef = useRef(duration);
  speedRef.current = speed;
  durationRef.current = duration;

  const selected = rows.find((r) => r.id === selectedId) ?? null;
  const insight: RlCoachInsight | null =
    selected?.insight ?? report.timeline.find((i) => i.id === selectedId) ?? null;
  const highlightPlayerIds = insight?.involvedPlayerIds ?? [];

  useEffect(() => {
    if (!playing) return;
    let last = performance.now();
    let stopped = false;
    const tick = (now: number) => {
      if (stopped) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      setT((prev) => {
        const next = prev + dt * speedRef.current;
        if (next >= durationRef.current) {
          setPlaying(false);
          return durationRef.current;
        }
        return next;
      });
      requestAnimationFrame(tick);
    };
    const id = requestAnimationFrame(tick);
    return () => {
      stopped = true;
      cancelAnimationFrame(id);
    };
  }, [playing]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.code === 'Space') {
        e.preventDefault();
        setPlaying((p) => !p);
      } else if (e.key === 'j' || e.key === 'J') {
        setT((v) => Math.max(0, v - 1));
        setPlaying(false);
      } else if (e.key === 'l' || e.key === 'L') {
        setT((v) => Math.min(durationRef.current, v + 1));
        setPlaying(false);
      } else if (e.key === ',') {
        setT((v) => Math.max(0, v - 0.1));
        setPlaying(false);
      } else if (e.key === '.') {
        setT((v) => Math.min(durationRef.current, v + 0.1));
        setPlaying(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const selectRow = (row: RlTimelineRow) => {
    setSelectedId(row.id);
    setT(row.t);
    setPlaying(false);
  };

  return (
    <div
      className="space-y-5"
      style={{
        background:
          'radial-gradient(ellipse at top, rgba(56,189,248,0.08), transparent 45%), radial-gradient(ellipse at bottom right, rgba(249,115,22,0.08), transparent 40%)',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-end justify-between gap-3"
      >
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-sky-300/80">Rocket League</p>
          <h1 className="text-2xl font-bold text-white md:text-3xl">Premium Replay Coaching</h1>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-3 py-2">
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            className="rounded-md bg-sky-500/20 p-2 text-sky-200 hover:bg-sky-500/30"
            aria-label={playing ? 'Pause' : 'Play'}
          >
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>
          <span className="font-mono text-sm text-white">{formatClock(t)}</span>
          <span className="text-xs text-zinc-500">/ {formatClock(duration)}</span>
          <select
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="ml-2 rounded-md border border-white/10 bg-black/40 px-2 py-1 text-xs text-zinc-300"
          >
            {[0.5, 1, 2, 4].map((s) => (
              <option key={s} value={s}>
                {s}x
              </option>
            ))}
          </select>
        </div>
      </motion.div>

      {(report.parserNotes?.length > 0 || report.estimatedSections.length > 0) && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs text-amber-100">
          {report.extractionConfidence !== 'full' && (
            <span className="mr-2">Extraction: {report.extractionConfidence}.</span>
          )}
          {report.estimatedSections.length > 0 && (
            <span>Estimated: {report.estimatedSections.join(', ')}. </span>
          )}
          {report.parserNotes[0]}
        </div>
      )}

      <RlMatchSummary summary={report.matchSummary} />

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <div className="grid gap-4 lg:grid-cols-2">
            <RlFieldVisualizer
              timeline={timeline}
              t={t}
              highlightPlayerIds={highlightPlayerIds}
              insight={insight}
            />
            <RlTimeline
              rows={rows}
              selectedId={selectedId}
              t={t}
              onSelect={selectRow}
              timeline={timeline}
            />
          </div>
          <RlCoachPanel insight={insight} />
        </div>
        <div className="space-y-4">
          <RlSkillRadar scores={report.skillScores} />
          <RlPatternPanel
            patterns={report.mistakePatterns}
            onJump={(ts, insightId) => {
              setT(ts);
              if (insightId) setSelectedId(insightId);
              setPlaying(false);
            }}
          />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <RlHeatmapViewer heatmaps={report.heatmaps} />
        <RlBoostSpeedCharts timeline={timeline} />
        <RlBoostAnalysis data={report.boostAnalysis} />
        <RlRotationAnalysis data={report.rotationAnalysis} />
        <RlShotAnalysis shots={report.shotAnalysis} />
        <RlDefenseAnalysis data={report.defenseAnalysis} />
        <RlMechanicsPanel scores={report.skillScores} axes={report.skillAxisMeta} />
        <RlInsightPanel insights={report.aiInsights} />
      </div>

      <RlImprovementPlan plan={report.improvementPlan} />

      {report.futureHooks && (
        <p className="pb-6 text-center text-[11px] text-zinc-600">
          Future hooks ready: voice · clips · SSL side-by-side · training packs (stubs)
        </p>
      )}
    </div>
  );
}
