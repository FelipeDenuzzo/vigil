/* src/attentions/selective/games/VisualSearchHunt/assessment-v2/buildVisualSearchV2Result.ts */
/* Orquestrador principal do avaliador V2 */
/* Atualizado em: 01/06/2026 */

import { buildVisualSearchScaleResult } from '../assessment/buildVisualSearchScaleResult';
import type { VisualSearchScaleResult } from '../assessment/visualSearchScale.types';
import type {
  VisualSearchAssessmentGraphPoint,
  VisualSearchSessionLog,
} from '../assessment/visualSearchAssessment.types';
import type {
  VisualSearchV2AssessmentResult,
  VisualSearchV2SessionLog,
} from './visualSearchV2.types';
import { calculateIES } from './calculateIES';
import { calculateRadarScale } from './calculateRadarScale';
import { calculateStaminaScale } from './calculateStaminaScale';
import { detectConjunctionBreak } from './detectConjunctionBreak';

/**
 * Função principal que orquestra todos os cálculos do avaliador V2.
 *
 * Executa em paralelo (conceitual):
 * 1. calculateIES — Índice de Eficiência Inversa
 * 2. calculateRadarScale — Régua de Visão de Radar
 * 3. calculateStaminaScale — Régua de Fôlego Mental
 * 4. detectConjunctionBreak — Eixo clínico A
 * 5. buildVisualSearchScaleResult (v1) — Reutiliza Olho de Águia
 * 6. Monta graphSeries para evolução
 */
export function buildVisualSearchV2Result(
  sessionLog: VisualSearchV2SessionLog
): VisualSearchV2AssessmentResult {
  const { gameKey, sessionId, rounds } = sessionLog;

  // ── 1. Calcular IES ──
  const ies = calculateIES(sessionLog);

  // ── 2. Calcular Radar Scale ──
  const radarScale = calculateRadarScale(sessionLog);

  // ── 3. Calcular Stamina Scale ──
  const staminaScale = calculateStaminaScale(sessionLog);

  // ── 4. Detectar Conjunction Break ──
  const conjunctionBreak = detectConjunctionBreak(sessionLog);

  // ── 5. Reutilizar avaliação Eagle (v1) ──
  // Adaptamos o sessionLog para o formato esperado por buildVisualSearchScaleResult
  const eagleScale = buildVisualSearchScaleResult(
    sessionLog as unknown as typeof sessionLog
  );

  // ── 6. Montar serie de pontos para gráfico ──
  const graphSeries: VisualSearchAssessmentGraphPoint[] = rounds.map((round, idx) => {
    const totalTargets = round.targetsPresented ?? 0;
    const totalActions = round.hits + round.errors;
    const accuracyRate = totalActions > 0 ? round.hits / totalActions : 0;
    const omissionRate = totalTargets > 0 ? round.missedTargets / totalTargets : 0;
    const commissionRateProxy = totalTargets > 0 ? round.errors / totalTargets : 0;

    // Classificar bias
    let bias: 'omissao' | 'comissao' | 'misto' | 'adequado' = 'adequado';
    if (omissionRate >= 0.2 && commissionRateProxy >= 0.2) {
      bias = 'misto';
    } else if (omissionRate >= 0.2) {
      bias = 'omissao';
    } else if (commissionRateProxy >= 0.2) {
      bias = 'comissao';
    }

    return {
      round: round.roundIndex ?? idx + 1,
      score: round.level * 10, // Score simplificado por nível
      hits: round.hits,
      errors: round.errors,
      missedTargets: round.missedTargets,
      targetsPresented: totalTargets,
      omissionRate: Number((omissionRate * 100).toFixed(2)),
      commissionRateProxy: Number((commissionRateProxy * 100).toFixed(2)),
      bias,
      organizationIndex: round.organizationIndex,
      spatialAsymmetryIndex: round.spatialAsymmetryIndex,
      meanReactionTimeMs:
        round.reactionTimes && round.reactionTimes.length > 0
          ? round.reactionTimes.reduce((sum, rt) => sum + rt, 0) / round.reactionTimes.length
          : undefined,
    };
  });

  // ── 7. Montar resultado final ──
  const createdAt = new Date().toISOString();

  return {
    gameKey,
    sessionId,
    createdAt,
    version: 2,
    ies,
    eagleScale,
    radarScale,
    staminaScale,
    conjunctionBreak,
    graphSeries,
  };
}
