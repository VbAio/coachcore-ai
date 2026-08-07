export * from './coach/coach-provider.interface.js';
export * from './coach/mock-coach-provider.js';
export * from './coach/openai-coach-provider.js';
export * from './modules/mistake-detector.js';
export * from './modules/pattern-grouper.js';
export * from './modules/timeline-generator.js';
export * from './modules/heatmap-generator.js';
export * from './modules/score-engine.js';
export * from './modules/recommendation-engine.js';
export * from './modules/report-generator.js';
export * from './modules/item-analyzer.js';
export * from './pipeline/coaching-pipeline.js';

/** Rocket League coaching (additive — Deadlock pipeline unchanged) */
export { runRlCoachingPipeline } from './rocket-league/rl-pipeline.js';
export type { RlPipelineProgress } from './rocket-league/rl-pipeline.js';
export { detectRlMistakes } from './rocket-league/rl-mistake-detector.js';
export { groupRlPatterns } from './rocket-league/rl-pattern-grouper.js';
export { computeRlSkillScores, gradeFromScore } from './rocket-league/rl-score-engine.js';
export {
  analyzeRlBoost,
  analyzeRlDefense,
  analyzeRlRotation,
  analyzeRlShots,
  generateRlHeatmaps,
} from './rocket-league/rl-analyzers.js';
export { generateRlReport, polishRlInsightsWithRules } from './rocket-league/rl-report-generator.js';
