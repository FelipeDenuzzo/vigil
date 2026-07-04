// src/assessment/trilhaZigueZague/calculateTrilhaZigueZagueMetrics.ts

import type { TrilhaZigueZagueSessionData, TrilhaZigueZagueSessionMetrics } from './types.ts';

export function calculateTrilhaZigueZagueMetrics(
  data: TrilhaZigueZagueSessionData
): TrilhaZigueZagueSessionMetrics {
  const { timePhase1, timePhase2, shiftingErrors = 0, sequencingErrors = 0 } = data;
  
  const switchingCost = timePhase2 - timePhase1;
  const totalErrors = shiftingErrors + sequencingErrors;

  return {
    timePhase1,
    timePhase2,
    switchingCost: parseFloat(switchingCost.toFixed(2)),
    shiftingErrors,
    sequencingErrors,
    totalErrors
  };
}
