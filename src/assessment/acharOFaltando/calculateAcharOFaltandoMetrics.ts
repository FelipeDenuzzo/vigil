// src/assessment/acharOFaltando/calculateAcharOFaltandoMetrics.ts
import { MissingItemRoundResult } from '../../attentions/selective/games/AcharOFaltando/types';
import { AcharOFaltandoMetrics } from './types';
import { computeMetrics } from '../../attentions/selective/games/AcharOFaltando/logic';

/**
 * Calcula as métricas de sessão de Achar o Faltando a partir dos resultados de rodada.
 */
export function calculateAcharOFaltandoMetrics(
  results: MissingItemRoundResult[],
  elapsedSec: number
): AcharOFaltandoMetrics {
  const m = computeMetrics(results, elapsedSec);
  return {
    roundsPlayed: m.roundsPlayed,
    totalHits: m.totalHits,
    totalOmissions: m.totalOmissions,
    totalFalsePositives: m.totalFalsePositives,
    totalCorrectRounds: m.totalCorrectRounds,
    accuracyPerMinute: m.accuracyPerMinute,
    averageResponseMs: m.averageResponseMs,
    roundCurve: m.roundCurve,
  };
}
