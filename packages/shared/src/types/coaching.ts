export type Grade = 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';

export type MistakeSeverity = 'minor' | 'medium' | 'major' | 'game_losing';

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

export interface CoachInsight {
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
  type: 'movement' | 'deaths' | 'farming' | 'objective' | 'danger' | 'safe_zones' | 'roaming';
  points: Array<{ x: number; y: number; weight: number }>;
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
}

export interface ProComparison {
  metric: string;
  playerValue: number;
  proAverage: number;
  percentile: number;
  unit: string;
  isEstimate: boolean;
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
  /** Sections marked as estimates when parser data was incomplete */
  estimatedSections: string[];
}

export interface ChatCoachMessage {
  role: 'user' | 'assistant';
  content: string;
  timestampReferences?: number[];
}
