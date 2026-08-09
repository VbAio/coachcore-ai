import type { CoachInsight } from '@clutchcore/shared';
import type { DetectedMistake } from './mistake-detector.js';

export function generateTimeline(mistakes: DetectedMistake[]): CoachInsight[] {
  return [...mistakes].sort((a, b) => a.timestamp - b.timestamp);
}

export function formatTimestamp(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
