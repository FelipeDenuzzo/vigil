import type { MazeAggregatedMetrics } from './types';

// EvaluatorInput adaptado para o LongMazes — estrutura enviada ao vigil-evaluator
export interface LongMazesEvaluatorInput {
  sessionId: string;
  attentionType: 'sustentada';
  completedPhases: number;
  totalPhases: number;
  avgEfficiencyPct: number;
  totalRevisits: number;
  totalDeadEndEntries: number;
  totalLongStops: number;
  avgPostErrorPauseMs: number;
  severity: string;
  score: number;
  phaseDetail: {
    levelId: number;
    success: boolean;
    efficiencyPct: number;
    revisits: number;
    deadEndEntries: number;
    longStops: number;
    postErrorPauseMs: number;
    elapsedSec: number;
  }[];
}

export function buildLongMazesTechnicalReport(
  metrics: MazeAggregatedMetrics,
  sessionId: string
): LongMazesEvaluatorInput {
  return {
    sessionId,
    attentionType: 'sustentada',
    completedPhases: metrics.completedPhases,
    totalPhases: metrics.phases.length,
    avgEfficiencyPct: metrics.avgEfficiencyPct,
    totalRevisits: metrics.totalRevisits,
    totalDeadEndEntries: metrics.totalDeadEndEntries,
    totalLongStops: metrics.totalLongStops,
    avgPostErrorPauseMs: metrics.avgPostErrorPauseMs,
    severity: metrics.severity,
    score: metrics.score,
    phaseDetail: metrics.phases.map((p) => ({
      levelId: p.levelId,
      success: p.success,
      efficiencyPct: p.efficiencyPct,
      revisits: p.revisits,
      deadEndEntries: p.deadEndEntries,
      longStops: p.longStops,
      postErrorPauseMs: p.postErrorPauseMs,
      elapsedSec: Math.round(p.elapsedMs / 1000),
    })),
  };
}
