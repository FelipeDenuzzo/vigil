// src/assessment/trilhaZigueZague/buildTrilhaZigueZagueScaleResult.ts

import type { TrilhaZigueZagueSessionMetrics } from './types.ts';
import { TRILHA_ZIGUE_ZAGUE_SCALE, getQualitativeLabel, FlexScoreLevel } from './trilhaZigueZagueScaleDefinitions.ts';

export interface TrilhaZigueZagueScaleResult {
  score: number;
  label: FlexScoreLevel;
  // Campos repassados para eventual exibição
  timePhase1: number;
  timePhase2: number;
  switchingCost: number;
  shiftingErrors: number;
  sequencingErrors: number;
  totalErrors: number;
}

export function buildTrilhaZigueZagueScaleResult(
  metrics: TrilhaZigueZagueSessionMetrics
): TrilhaZigueZagueScaleResult {
  const { BEST_COST, WORST_COST, ERROR_PENALTY } = TRILHA_ZIGUE_ZAGUE_SCALE;
  
  const { switchingCost, totalErrors } = metrics;

  // Min-Max Scaling invertido (menor custo = maior nota)
  const rawScore = 100 - ((switchingCost - BEST_COST) / (WORST_COST - BEST_COST)) * 100;

  const scoreWithPenalty = rawScore - (totalErrors * ERROR_PENALTY);

  // Clamp 0–100
  const flexScore = Math.min(100, Math.max(0, Math.round(scoreWithPenalty)));

  // Rótulo qualitativo
  const label = getQualitativeLabel(flexScore);

  return {
    score: flexScore,
    label,
    timePhase1: metrics.timePhase1,
    timePhase2: metrics.timePhase2,
    switchingCost: metrics.switchingCost,
    shiftingErrors: metrics.shiftingErrors,
    sequencingErrors: metrics.sequencingErrors,
    totalErrors: metrics.totalErrors
  };
}
