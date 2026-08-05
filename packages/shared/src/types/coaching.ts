export type Grade = 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';

/** Expanded severity scale; legacy values remain accepted for older reports */
export type MistakeSeverity =
  | 'critical'
  | 'high'
  | 'medium'
  | 'low'
  | 'minor'
  | 'major'
  | 'game_losing';

export type MistakeCategory =
  | 'positioning'
  | 'awareness'
  | 'mechanics'
  | 'greed'
  | 'objective_play'
  | 'economy'
  | 'ability_usage'
  | 'itemization'
  | 'team_fighting'
  | 'decision_making'
  | 'communication'
  | 'vision';

export type MatchPhase = 'laning' | 'mid' | 'late';

export type DrillDifficulty = 'easy' | 'medium' | 'hard';

export interface ImpactEstimate {
  /** Short human label, e.g. "tempo loss" */
  label: string;
  /** Optional numeric hint; always treat as estimate */
  winProbabilityDelta?: number;
  /** Optional MMR hint; always treat as estimate */
  mmrDelta?: number;
}

export interface PracticeDrill {
  title: string;
  description: string;
  durationMinutes: number;
  difficulty: DrillDifficulty;
  successMetric: string;
}

export interface CoachInsight {
  id?: string;
  timestamp: number;
  title: string;
  whatHappened: string;
  whyItHappened: string;
  whyBadOrGood: string;
  alternativePlay: string;
  expectedOutcome: string;
  howToImprove: string;
  drills: string[];
  proExample?: string;
  category: MistakeCategory;
  severity: MistakeSeverity;
  /** true when insight is inferred rather than directly parsed */
  isEstimate: boolean;
  position?: { x: number; y: number };
  /** CombatEvent.eventId references */
  relatedEventIds?: string[];
  involvedPlayerIds?: string[];
  /** 0–100 confidence in the coaching claim */
  confidence?: number;
  impactEstimate?: ImpactEstimate;
  phase?: MatchPhase;
  /** 'mistake' | 'excellent' | 'neutral' for timeline filters */
  polarity?: 'mistake' | 'excellent' | 'neutral';
  /** 1–10 how hard the correct decision is under pressure */
  difficulty?: number;
  /** Structured practice drill (preferred over free-text drills[]) */
  practiceDrill?: PracticeDrill;
  /** Explicit WP swing for this moment (estimate) */
  winProbabilityDelta?: number;
  /** Severity 0–100 for sorting / UI meters */
  severityScore?: number;
  isCommonMistake?: boolean;
  heroSpecificAdvice?: string;
  /** Short category label for timeline chips */
  replayContext?: string;
}

export interface MistakePattern {
  id: string;
  title: string;
  category: MistakeCategory;
  count: number;
  timestamps: number[];
  insightIds: string[];
  commonCauses: string[];
  patternExplanation: string;
  practiceDrill: PracticeDrill;
  priorityScore: number;
  expectedImprovement: string;
  estimatedWinProbabilityGain?: number;
  severity: MistakeSeverity;
}

export interface TeamFightBreakdown {
  fightId: string;
  startTime: number;
  endTime: number;
  timeline: string[];
  whoEngaged: string;
  mistakes: CoachInsight[];
  goodPlays: CoachInsight[];
  positioningNotes: string;
  targetFocus: string;
  threatEvaluation: string;
  abilitySequencing: string;
  retreatTiming: string;
  ultimateValue: string;
  winProbabilityChange?: string;
}

export interface HeatmapData {
  type:
    | 'movement'
    | 'deaths'
    | 'kills'
    | 'farming'
    | 'objective'
    | 'danger'
    | 'safe_zones'
    | 'roaming'
    | 'rotations';
  points: Array<{ x: number; y: number; weight: number; t?: number; label?: string }>;
  mapName: string;
}

export interface SkillScores {
  mechanics: number;
  macro: number;
  awareness: number;
  positioning: number;
  consistency: number;
  economy: number;
  aggression: number;
  teamFighting: number;
  overall: number;
  /** Extended axes (optional for legacy reports) */
  decisionMaking?: number;
  micro?: number;
  abilityUsage?: number;
  itemization?: number;
  objectives?: number;
  mapControl?: number;
  rotations?: number;
  discipline?: number;
}

export interface SkillAxisMeta {
  key: keyof SkillScores;
  label: string;
  score: number;
  trend: 'up' | 'down' | 'flat';
  isStrength: boolean;
  isWeakness: boolean;
  importance: 'critical' | 'high' | 'medium' | 'low';
}

export interface ImprovementGoal {
  title: string;
  reason: string;
  expectedImpact: string;
  difficulty: DrillDifficulty;
  progressHint: string;
}

export interface ImprovementPlan {
  todaysFocus: string;
  weeklyFocus: string;
  topHabits: string[];
  practiceDrills: string[];
  warmupRoutine: string[];
  replayReviewChecklist: string[];
  goalForNextMatch: string;
  estimatedMmrGain: number;
  /** Structured roadmap (v2) */
  today?: ImprovementGoal;
  thisWeek?: ImprovementGoal;
  nextTenMatches?: ImprovementGoal;
  longTerm?: ImprovementGoal;
}

export interface ProComparison {
  metric: string;
  playerValue: number;
  proAverage: number;
  percentile: number;
  unit: string;
  isEstimate: boolean;
}

export interface AiInsights {
  biggestStrengths: string[];
  mostCostlyMistakes: string[];
  hiddenPatterns: string[];
  recurringHabits: string[];
  mostImprovedArea: string;
  highestImpactImprovement: string;
  biggestLostOpportunity: string;
  riskAssessment: string;
  confidenceSummary: string;
}

export interface MatchSummaryStats {
  hero: string;
  durationSeconds: number;
  kills: number;
  deaths: number;
  assists: number;
  /** Hero damage when available; else 0 */
  damage: number;
  healing: number;
  objectiveScore: number;
  teamFightScore: number;
  confidence: number;
  letterGrade: Grade;
  overallScore: number;
  currentSkillRating: string;
  estimatedRank: string;
  biggestStrength: string;
  biggestWeakness: string;
  topPriorities: [string, string, string];
}

export interface ItemPurchaseAnalysis {
  eventId: string;
  timestamp: number;
  itemName: string;
  itemId: string;
  cost: number;
  category: 'Weapon' | 'Vitality' | 'Spirit';
  slotIndex: number;
  rating: 'excellent' | 'good' | 'okay' | 'questionable' | 'poor';
  whyPurchased: string;
  timingAssessment: string;
  alternativeItem?: string;
  alternativeReason?: string;
  fightImpact: string;
  problemSolved: string;
  powerSpikeNote: string;
  confidence: number;
  isEstimate: boolean;
  relatedEventIds: string[];
}

export interface BuildPhaseItems {
  phase: 'starting' | 'early' | 'mid' | 'late' | 'final';
  label: string;
  itemIds: string[];
  itemNames: string[];
  timestamps: number[];
}

export interface BuildReview {
  overallScore: number;
  earlyScore: number;
  midScore: number;
  lateScore: number;
  bestPurchase?: ItemPurchaseAnalysis;
  worstPurchase?: ItemPurchaseAnalysis;
  delayedPurchase?: string;
  missedPurchase?: string;
  recommendedBuildOrder: string[];
  alternativeVsEnemy: string;
  summary: string;
  phases: BuildPhaseItems[];
  comparisons: Array<{
    versus: string;
    notes: string[];
    isEstimate: boolean;
  }>;
  purchases: ItemPurchaseAnalysis[];
}

export interface CoachingReport {
  id: string;
  replayId: string;
  generatedAt: string;
  overallGrade: Grade;
  overallScore: number;
  potentialRank: string;
  currentPerformance: string;
  biggestWeakness: string;
  biggestStrength: string;
  topPriorities: [string, string, string];
  lanePhaseAnalysis: CoachInsight[];
  macroAnalysis: CoachInsight[];
  microAnalysis: CoachInsight[];
  teamFightAnalysis: TeamFightBreakdown[];
  heatmaps: HeatmapData[];
  economyAnalysis: CoachInsight[];
  heroSpecificCoaching: CoachInsight[];
  timeline: CoachInsight[];
  mistakesByCategory: Record<MistakeCategory, CoachInsight[]>;
  improvementPlan: ImprovementPlan;
  proComparison: ProComparison[];
  skillScores: SkillScores;
  /** Itemization deep-dive for the VOD Items panel */
  buildReview?: BuildReview;
  /** Sections marked as estimates when parser data was incomplete */
  estimatedSections: string[];
  /** Parser confidence from replay extraction */
  extractionConfidence?: 'full' | 'partial' | 'minimal';
  /** Notes from the .dem parser (gaps, subject selection, fallbacks) */
  parserNotes?: string[];
  /** Grouped repeated mistake patterns (v2) */
  mistakePatterns?: MistakePattern[];
  /** Narrative AI insights block (v2) */
  aiInsights?: AiInsights;
  /** Header KPI summary (v2) */
  matchSummary?: MatchSummaryStats;
  /** Per-axis skill metadata for radar UI */
  skillAxisMeta?: SkillAxisMeta[];
}

/** API payload for the VOD review page */
export interface CoachingReportPayload {
  report: CoachingReport;
  timeline: import('./replay.js').MatchTimeline | null;
}

export interface ChatCoachMessage {
  role: 'user' | 'assistant';
  content: string;
  timestampReferences?: number[];
}
