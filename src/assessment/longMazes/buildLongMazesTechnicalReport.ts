// Artefato 2 — Monta o payload EvaluatorInput para o vigil-evaluator
// Entrada:  MazeAggregatedMetrics (saída do Artefato 1)
// Saída:   EvaluatorInput com attentionType 'sustentada'

import type { MazeAggregatedMetrics } from './types';
import type { EvaluatorInput } from '../../lib/evaluatorClient';

export function buildLongMazesTechnicalReport(
  metrics: MazeAggregatedMetrics,
  sessionId: string
): EvaluatorInput {
  return {
    sessionId,
    attentionType: 'sustentada',
    severity: metrics.severity,

    // Campos sustentada
    completedPhases:     metrics.completedPhases,
    totalPhases:         metrics.totalPhases,
    avgEfficiencyPct:    metrics.avgEfficiencyPct,
    totalRevisits:       metrics.totalRevisits,
    totalDeadEndEntries: metrics.totalDeadEndEntries,
    totalLongStops:      metrics.totalLongStops,
    avgPostErrorPauseMs: metrics.avgPostErrorPauseMs,

    phaseDetail: metrics.phases.map((p) => ({
      levelId:          p.levelId,
      success:          p.success,
      efficiencyPct:    p.efficiencyPct,
      revisits:         p.revisits,
      deadEndEntries:   p.deadEndEntries,
      longStops:        p.longStops,
      postErrorPauseMs: p.postErrorPauseMs,
      elapsedSec:       p.elapsedSec,
    })),
  };
}
