/** Rocket League coaching + replay contracts (separate from Deadlock CoachingReport). */

export type RlGrade = 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';

export type RlSeverity =
  | 'critical'
  | 'game_losing'
  | 'high'
  | 'major'
  | 'medium'
  | 'low'
  | 'minor';

export type RlMistakeCategory =
  | 'rotation'
  | 'challenge'
  | 'boost'
  | 'mechanics'
  | 'positioning'
  | 'kickoff'
  | 'recovery'
  | 'shot'
  | 'defense'
  | 'demo'
  | 'decision_making'
  | 'aerial'
  | 'possession';

export type RlEventType =
  | 'goal'
  | 'assist'
  | 'save'
  | 'shot'
  | 'missed_shot'
  | 'whiff'
  | 'missed_open_net'
  | 'bad_rotation'
  | 'double_commit'
  | 'overcommit'
  | 'poor_challenge'
  | 'missed_boost'
  | 'boost_steal'
  | 'demo'
  | 'bump'
  | 'bad_recovery'
  | 'kickoff'
  | 'wall_play'
  | 'aerial'
  | 'ceiling_play'
  | 'flip_reset'
  | 'excellent_play'
  | 'neutral';

export type RlPlaylist =
  | 'ranked_duels'
  | 'ranked_doubles'
  | 'ranked_standard'
  | 'casual'
  | 'extra_modes'
  | 'unknown';

export type RlDrillDifficulty = 'easy' | 'medium' | 'hard';

export interface RlVec3 {
  x: number;
  y: number;
  z: number;
}

export interface RlPracticeDrill {
  title: string;
  description: string;
  durationMinutes: number;
  difficulty: RlDrillDifficulty;
  successMetric: string;
  trainingPackCode?: string;
}

export interface RlPlayer {
  id: string;
  name: string;
  team: 'blue' | 'orange';
  isSubject: boolean;
  platformId?: string;
  cameraSettings?: Record<string, number>;
  goals: number;
  assists: number;
  saves: number;
  shots: number;
  demos: number;
  score: number;
  boostUsage?: number;
  averageSpeed?: number;
  timeOnGround?: number;
  timeInAir?: number;
  ballTouches?: number;
}

export interface RlMatchMetadata {
  map: string;
  date: string;
  durationSeconds: number;
  playlist: RlPlaylist;
  rank?: string;
  mmr?: number;
  scoreBlue: number;
  scoreOrange: number;
  overtime: boolean;
  players: RlPlayer[];
  version?: string;
  ballchasingId?: string;
  game: 'rocket-league';
}

export interface RlPositionSample {
  t: number;
  playerId: string;
  x: number;
  y: number;
  z: number;
  boost: number;
  speed: number;
  onGround: boolean;
}

export interface RlBallSample {
  t: number;
  x: number;
  y: number;
  z: number;
  speed: number;
}

export interface RlBoostPickup {
  t: number;
  playerId: string;
  padId: string;
  amount: number;
  isBigPad: boolean;
  x: number;
  y: number;
}

export interface RlMatchEvent {
  id: string;
  t: number;
  type: RlEventType;
  label: string;
  actorId?: string;
  targetId?: string;
  team?: 'blue' | 'orange';
  position?: RlVec3;
  ballPosition?: RlVec3;
  boost?: number;
  speed?: number;
  relatedEventIds?: string[];
}

export interface RlParsedReplay {
  metadata: RlMatchMetadata;
  subjectPlayerId: string;
  playerTracks: RlPositionSample[];
  ballTrack: RlBallSample[];
  boostPickups: RlBoostPickup[];
  events: RlMatchEvent[];
  extractionConfidence: 'full' | 'partial' | 'minimal';
  parserNotes: string[];
  source: 'ballchasing' | 'fixture' | 'local';
}

export interface RlTimelineEvent {
  id: string;
  t: number;
  type: RlEventType;
  label: string;
  insightId?: string;
  actorId?: string;
  position?: RlVec3;
  ballPosition?: RlVec3;
}

export interface RlMatchTimeline {
  replayId: string;
  durationSeconds: number;
  subjectPlayerId: string;
  players: RlPlayer[];
  events: RlTimelineEvent[];
  playerTracks: RlPositionSample[];
  ballTrack: RlBallSample[];
  boostPickups: RlBoostPickup[];
  extractionConfidence: 'full' | 'partial' | 'minimal';
  parserNotes: string[];
}

export interface RlCoachInsight {
  id: string;
  timestamp: number;
  title: string;
  eventType: RlEventType;
  whatHappened: string;
  whyItHappened: string;
  whyBadOrGood: string;
  alternativePlay: string;
  alternativePositioning?: string;
  alternativeChallenge?: string;
  alternativeRotation?: string;
  expectedOutcome: string;
  howToImprove: string;
  mechanicsOrDecision: string;
  proExample?: string;
  category: RlMistakeCategory;
  severity: RlSeverity;
  severityScore: number;
  polarity: 'mistake' | 'excellent' | 'neutral';
  isEstimate: boolean;
  confidence: number;
  winProbabilityDelta?: number;
  difficulty?: number;
  practiceDrill?: RlPracticeDrill;
  relatedEventIds: string[];
  involvedPlayerIds: string[];
  position?: RlVec3;
  ballPosition?: RlVec3;
  boostAmount?: number;
  speed?: number;
  pressureLevel?: 'low' | 'medium' | 'high';
  gameScore?: string;
  recommendedPosition?: RlVec3;
}

export interface RlMistakePattern {
  id: string;
  title: string;
  category: RlMistakeCategory;
  count: number;
  timestamps: number[];
  insightIds: string[];
  commonCauses: string[];
  patternExplanation: string;
  practiceDrill: RlPracticeDrill;
  priorityScore: number;
  expectedImprovement: string;
  estimatedRankGain?: string;
  severity: RlSeverity;
}

export interface RlSkillScores {
  mechanical: number;
  gameSense: number;
  boost: number;
  rotation: number;
  recovery: number;
  aerial: number;
  kickoff: number;
  defense: number;
  offense: number;
  consistency: number;
  decisionMaking: number;
  overall: number;
}

export interface RlSkillAxisMeta {
  key: keyof RlSkillScores;
  label: string;
  score: number;
  grade: RlGrade;
  trend: 'up' | 'down' | 'flat';
  isStrength: boolean;
  isWeakness: boolean;
  practiceRecommendation: string;
}

export interface RlMatchSummaryStats {
  overallScore: number;
  letterGrade: RlGrade;
  estimatedRank: string;
  currentRank: string;
  playlist: RlPlaylist;
  durationSeconds: number;
  goals: number;
  assists: number;
  saves: number;
  shots: number;
  demos: number;
  boostEfficiency: number;
  averageSpeed: number;
  possessionTime: number;
  ballTouches: number;
  aerialSuccessRate: number;
  fiftyFiftyWinRate: number;
  recoveryScore: number;
  rotationScore: number;
  decisionMakingScore: number;
  mechanicalScore: number;
  consistencyScore: number;
  confidence: number;
  biggestStrength: string;
  biggestWeakness: string;
  topPriorities: [string, string, string];
}

export interface RlAiInsights {
  biggestStrengths: string[];
  mostCostlyMistakes: string[];
  hiddenPatterns: string[];
  recurringHabits: string[];
  highestImpactImprovement: string;
  biggestLostOpportunity: string;
  riskAssessment: string;
  confidenceSummary: string;
}

export interface RlPlanStep {
  title: string;
  reason: string;
  expectedImpact: string;
  difficulty: RlDrillDifficulty;
  priority: 'critical' | 'high' | 'medium' | 'low';
  estimatedMmrGain?: number;
  estimatedMinutes?: number;
  drills: string[];
  progressHint: string;
}

export interface RlImprovementPlan {
  today: RlPlanStep;
  nextFiveMatches: RlPlanStep;
  nextTwentyMatches: RlPlanStep;
  longTerm: RlPlanStep;
}

export interface RlHeatmapPoint {
  x: number;
  y: number;
  weight: number;
  t?: number;
  label?: string;
}

export interface RlHeatmapData {
  type:
    | 'movement'
    | 'boost'
    | 'ball_touches'
    | 'goals'
    | 'shots'
    | 'defense'
    | 'offense'
    | 'challenges'
    | 'demos'
    | 'whiffs'
    | 'possession';
  points: RlHeatmapPoint[];
  filter?: 'all' | 'first_half' | 'second_half' | 'overtime' | 'winning' | 'losing';
}

export interface RlBoostAnalysis {
  boostWasted: number;
  bigPadPickups: number;
  smallPadPickups: number;
  bigPadDependency: number;
  starvationEvents: number;
  avgBoostOnAerial: number;
  avgBoostOnRecovery: number;
  avgBoostOnRotation: number;
  pathNotes: string[];
  isEstimate: boolean;
}

export interface RlRotationAnalysis {
  doubleCommits: number;
  ballChases: number;
  cutRotations: number;
  slowRotations: number;
  backPostMistakes: number;
  overcommits: number;
  undercommits: number;
  spacingIssues: number;
  notes: string[];
  isEstimate: boolean;
}

export interface RlShotBreakdown {
  eventId: string;
  timestamp: number;
  difficulty: number;
  placement: string;
  power: number;
  angle: string;
  shotQuality: number;
  scoringProbability: number;
  alternativeShot?: string;
  passOpportunity?: string;
  boostUsed: number;
  mechanicsUsed: string[];
  xg: number;
  isEstimate: boolean;
}

export interface RlDefenseBreakdown {
  goalLineSaves: number;
  shadowDefenseScore: number;
  backboardDefenseScore: number;
  challengeTimingScore: number;
  saveQuality: number;
  recoveryAfterSave: number;
  clearQuality: number;
  notes: string[];
  isEstimate: boolean;
}

export interface RlCoachingReport {
  id: string;
  replayId: string;
  game: 'rocket-league';
  generatedAt: string;
  overallGrade: RlGrade;
  overallScore: number;
  matchSummary: RlMatchSummaryStats;
  skillScores: RlSkillScores;
  skillAxisMeta: RlSkillAxisMeta[];
  timeline: RlCoachInsight[];
  mistakePatterns: RlMistakePattern[];
  aiInsights: RlAiInsights;
  improvementPlan: RlImprovementPlan;
  heatmaps: RlHeatmapData[];
  boostAnalysis: RlBoostAnalysis;
  rotationAnalysis: RlRotationAnalysis;
  shotAnalysis: RlShotBreakdown[];
  defenseAnalysis: RlDefenseBreakdown;
  estimatedSections: string[];
  extractionConfidence: 'full' | 'partial' | 'minimal';
  parserNotes: string[];
  /** Extension points for future features */
  futureHooks?: {
    voiceCoachingReady?: boolean;
    clipExportReady?: boolean;
    sslComparisonReady?: boolean;
    trainingPacksReady?: boolean;
  };
}

export interface RlCoachingReportPayload {
  report: RlCoachingReport;
  timeline: RlMatchTimeline | null;
  game: 'rocket-league';
}

export function buildRlMatchTimeline(
  replay: RlParsedReplay,
  replayId: string
): RlMatchTimeline {
  return {
    replayId,
    durationSeconds: replay.metadata.durationSeconds,
    subjectPlayerId: replay.subjectPlayerId,
    players: replay.metadata.players,
    events: replay.events.map((e) => ({
      id: e.id,
      t: e.t,
      type: e.type,
      label: e.label,
      actorId: e.actorId,
      position: e.position,
      ballPosition: e.ballPosition,
    })),
    playerTracks: replay.playerTracks,
    ballTrack: replay.ballTrack,
    boostPickups: replay.boostPickups,
    extractionConfidence: replay.extractionConfidence,
    parserNotes: replay.parserNotes,
  };
}
