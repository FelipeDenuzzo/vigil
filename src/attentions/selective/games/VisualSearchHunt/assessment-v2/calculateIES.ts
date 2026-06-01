/* src/attentions/selective/games/VisualSearchHunt/assessment-v2/calculateIES.ts */
/* Cálculo do Índice de Eficiência Inversa (IES) */
/* Atualizado em: 01/06/2026 */

import type { IESResult, VisualSearchV2SessionLog } from './visualSearchV2.types';

/**
 * Calcula o Índice de Eficiência Inversa (IES) da sessão.
 *
 * IES = meanReactionTime / accuracyRate
 *
 * Lógica:
 * - meanReactionTime: tempo médio de reação dos acertos (ms)
 * - accuracyRate: hits / (totalTargets + falseAlarms)
 * - Se accuracyRate === 0, retorna Infinity
 * - displayScore: 10_000_000 / ies (score gamificado)
 */
export function calculateIES(sessionLog: VisualSearchV2SessionLog): IESResult {
  const { rounds } = sessionLog;

  // ── Coleta de reaction times dos hits (cliques corretos) ──
  const allReactionTimes: number[] = [];
  for (const round of rounds) {
    if (round.reactionTimes && Array.isArray(round.reactionTimes)) {
      allReactionTimes.push(...round.reactionTimes);
    }
  }

  const totalHits = rounds.reduce((sum, r) => sum + r.hits, 0);
  const meanReactionTime =
    allReactionTimes.length > 0
      ? allReactionTimes.reduce((sum, rt) => sum + rt, 0) / allReactionTimes.length
      : 0;

  // ── Cálculo de acurácia ──
  // totalTargets: todos os alvos apresentados
  const totalTargets = rounds.reduce((sum, r) => sum + (r.targetsPresented ?? 0), 0);
  // totalFalseAlarms: total de erros (cliques em distratores)
  const totalFalseAlarms = rounds.reduce((sum, r) => sum + r.errors, 0);

  const accuracyRate =
    totalTargets + totalFalseAlarms > 0
      ? totalHits / (totalTargets + totalFalseAlarms)
      : 0;

  // ── Cálculo de IES ──
  const ies = accuracyRate > 0 ? meanReactionTime / accuracyRate : Infinity;

  // ── Score gamificado ──
  const displayScore = Number.isFinite(ies) && ies > 0
    ? Math.round(10_000_000 / ies)
    : 0;

  return {
    meanReactionTime: Number(meanReactionTime.toFixed(2)),
    accuracyRate: Number((accuracyRate * 100).toFixed(2)),
    ies: Number(ies.toFixed(2)),
    displayScore,
  };
}
