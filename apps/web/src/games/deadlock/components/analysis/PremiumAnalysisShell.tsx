'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import type { CoachInsight, CoachingReportPayload } from '@coachcore/shared';
import { adaptReport } from './adapter';
import { MatchSummary } from './MatchSummary';
import { AnalysisTimeline, type AnalysisTimelineRow } from './AnalysisTimeline';
import { CoachPanel } from './CoachPanel';
import { PatternPanel } from './PatternPanel';
import { InsightPanel } from './InsightPanel';
import { ImprovementPlanPanel } from './ImprovementPlanPanel';
import { HeroAnalysis } from './HeroAnalysis';
import { HeatmapViewer } from './HeatmapViewer';
import { SkillRadar } from './charts/SkillRadar';
import {
  CategoryDistribution,
  FightParticipation,
  MistakeFrequency,
} from './charts/AnalysisCharts';
import { MatchMap } from '../vod-review/MatchMap';
import { PlaybackControls } from '../vod-review/PlaybackControls';
import { buildTimelineRows } from '../vod-review/build-timeline-rows';
import { ItemsPanel } from '../vod-review/ItemsPanel';
import { GlassCard } from './ui';

interface Props {
  data: CoachingReportPayload;
}

export function PremiumAnalysisShell({ data }: Props) {
  const timeline = data.timeline;
  const report = useMemo(() => {
    const adapted = adaptReport(data.report);
    const subject = timeline?.players.find((p) => p.steamId === timeline.subjectPlayerId);
    if (!adapted.matchSummary) return adapted;
    return {
      ...adapted,
      matchSummary: {
        ...adapted.matchSummary,
        hero:
          adapted.matchSummary.hero !== 'Unknown' && adapted.matchSummary.hero !== 'Unknown hero'
            ? adapted.matchSummary.hero
            : subject?.hero ?? adapted.matchSummary.hero,
        kills: adapted.matchSummary.kills || subject?.kills || 0,
        deaths: adapted.matchSummary.deaths || subject?.deaths || 0,
        assists: adapted.matchSummary.assists || subject?.assists || 0,
        durationSeconds: timeline?.durationSeconds || adapted.matchSummary.durationSeconds,
      },
    };
  }, [data.report, timeline]);
  const duration =
    timeline?.durationSeconds ??
    report.matchSummary?.durationSeconds ??
    report.timeline.at(-1)?.timestamp ??
    600;

  const rows = useMemo(() => {
    const base = buildTimelineRows(report, timeline);
    return base.map(
      (r): AnalysisTimelineRow => ({
        id: r.id,
        timestamp: r.timestamp,
        label: r.label,
        kind: String(r.kind),
        insight: r.insight,
        involvedPlayerIds: r.involvedPlayerIds,
        position: r.position,
      })
    );
  }, [report, timeline]);

  const purchases = useMemo(() => {
    if (timeline?.enrichedPurchases?.length) return timeline.enrichedPurchases;
    return (report.buildReview?.purchases ?? []).map((p) => ({
      eventId: p.eventId,
      timestamp: p.timestamp,
      item: p.itemName,
      itemId: p.itemId,
      cost: p.cost,
      category: p.category,
      slotIndex: p.slotIndex,
      totalSoulsSpent: p.cost,
    }));
  }, [timeline, report.buildReview]);

  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(
    rows.find((r) => r.insight)?.id ?? rows[0]?.id ?? null
  );
  const [selectedPurchaseId, setSelectedPurchaseId] = useState<string | null>(null);
  const speedRef = useRef(speed);
  const durationRef = useRef(duration);
  speedRef.current = speed;
  durationRef.current = duration;

  const selected = rows.find((r) => r.id === selectedId) ?? null;
  const insight: CoachInsight | null =
    selected?.insight ??
    report.timeline.find((i) => i.id === selectedId) ??
    null;

  const highlightPlayerIds = selected?.involvedPlayerIds ?? insight?.involvedPlayerIds ?? [];
  const marker = selected?.position ?? insight?.position ?? null;

  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    let last = performance.now();
    let stopped = false;
    const tick = (now: number) => {
      if (stopped) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      setT((prev) => {
        const next = prev + dt * speedRef.current;
        if (next >= durationRef.current) {
          stopped = true;
          queueMicrotask(() => setPlaying(false));
          return durationRef.current;
        }
        return next;
      });
      if (!stopped) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      stopped = true;
      cancelAnimationFrame(frame);
    };
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
      } else if (e.key === ',') {
        setT((v) => Math.max(0, v - 0.1));
        setPlaying(false);
      } else if (e.key === '.') {
        setT((v) => Math.min(duration, v + 0.1));
        setPlaying(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [duration]);

  const jumpTo = (time: number, rowId?: string, nextInsight?: CoachInsight) => {
    setT(time);
    setPlaying(false);
    if (rowId) setSelectedId(rowId);
    else if (nextInsight) {
      const match = rows.find(
        (r) => r.insight?.id === nextInsight.id || (r.insight?.timestamp === nextInsight.timestamp && r.insight?.title === nextInsight.title)
      );
      if (match) setSelectedId(match.id);
    }
  };

  const confidence = report.extractionConfidence ?? timeline?.extractionConfidence ?? 'minimal';
  const notes = report.parserNotes ?? timeline?.parserNotes ?? [];

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(251,191,36,0.12),_transparent_50%),radial-gradient(ellipse_at_bottom_right,_rgba(52,211,153,0.08),_transparent_45%)]" />
      <div className="relative space-y-5 pb-16">
        {(confidence !== 'full' || notes.length > 0) && (
          <div className="flex gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-medium">
                Extraction confidence: {confidence}
                {report.estimatedSections.length
                  ? ` · Estimated: ${report.estimatedSections.slice(0, 4).join(', ')}`
                  : ''}
              </p>
              {notes.length > 0 && (
                <ul className="mt-1 list-disc pl-4 text-xs text-amber-100/80">
                  {notes.slice(0, 4).map((n, i) => (
                    <li key={i}>{n}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {report.matchSummary && <MatchSummary summary={report.matchSummary} />}

        <div className="grid gap-4 lg:grid-cols-12">
          <div className="space-y-3 lg:col-span-5">
            <MatchMap
              timeline={timeline}
              t={t}
              highlightPlayerIds={highlightPlayerIds}
              marker={marker}
              playing={playing}
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
            <p className="text-[11px] text-zinc-500">
              Keys: Space play/pause · J/L ±1s · ,/. ±0.1s · No video — clock + map from the .dem
            </p>
          </div>

          <div className="lg:col-span-3">
            <AnalysisTimeline
              rows={rows}
              selectedId={selectedId}
              t={t}
              onSelect={(row) => jumpTo(row.timestamp, row.id)}
            />
          </div>

          <div className="lg:col-span-4">
            <CoachPanel insight={insight} />
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <PatternPanel patterns={report.mistakePatterns ?? []} onJump={(time) => jumpTo(time)} />
          {report.aiInsights && <InsightPanel insights={report.aiInsights} />}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {report.skillAxisMeta && <SkillRadar axes={report.skillAxisMeta} />}
          <ImprovementPlanPanel plan={report.improvementPlan} />
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <CategoryDistribution byCategory={report.mistakesByCategory} />
          <MistakeFrequency timeline={report.timeline} />
          <FightParticipation
            fights={report.teamFightAnalysis ?? []}
            onJump={(time) => jumpTo(time)}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <HeatmapViewer
            heatmaps={report.heatmaps}
            estimated={report.estimatedSections.includes('heatmaps')}
            onJump={(time) => jumpTo(time)}
          />
          <HeroAnalysis
            report={report}
            onJump={(ins) => jumpTo(ins.timestamp, undefined, ins)}
          />
        </div>

        {purchases.length > 0 && (
          <GlassCard className="p-4">
            <ItemsPanel
              purchases={purchases}
              review={report.buildReview}
              t={t}
              duration={duration}
              selectedEventId={selectedPurchaseId}
              onSelectPurchase={(purchase) => {
                setSelectedPurchaseId(purchase.eventId);
                jumpTo(purchase.timestamp);
              }}
            />
          </GlassCard>
        )}
      </div>
    </div>
  );
}
