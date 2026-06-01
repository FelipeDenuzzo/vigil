/* src/attentions/selective/games/VisualSearchHunt/assessment-v2/calculateIES.ts */
/* Cálculo do Índice de Eficiência Inversa (IES) */
/* Atualizado em: 01/06/2026 */

import type { V2RoundInput, IESResult } from "./visualSearchV2.types";

export function calculateIES(rounds: V2RoundInput[]): IESResult {
  // 1. Juntar todos os reactionTimes de todas as rodadas
  const allRTs = rounds.flatMap((r) => r.reactionTimes);
  const meanRT = allRTs.length > 0
    ? allRTs.reduce((sum, v) => sum + v, 0) / allRTs.length
    : 0;

  // 2. Acurácia global: hits / (totalTargets + falseAlarms)
  const totalHits = rounds.reduce((s, r) => s + r.hits, 0);
  const totalTargets = rounds.reduce((s, r) => s + r.totalTargets, 0);
  const totalErrors = rounds.reduce((s, r) => s + r.errors, 0);
  const accuracyRate = (totalTargets + totalErrors) > 0
    ? totalHits / (totalTargets + totalErrors)
    : 0;

  // 3. IES e score gamificado
  const ies = meanRT > 0 && accuracyRate > 0 ? meanRT / accuracyRate : 99999;
  const displayScore = ies > 0 && Number.isFinite(ies)
    ? Math.round(10_000_000 / ies)
    : 0;

  return { meanReactionTime: Math.round(meanRT), accuracyRate, ies, displayScore };
}
