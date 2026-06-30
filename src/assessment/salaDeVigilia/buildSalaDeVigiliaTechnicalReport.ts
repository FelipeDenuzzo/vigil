import { SalaDeVigiliaMetrics, SalaDeVigiliaScaleResult } from './types';
// Note: Assumindo que EvaluatorInput existe globalmente ou em vigil-evaluator
// O tipo será 'sustained' e o game 'SalaDeVigilia'

export function buildSalaDeVigiliaTechnicalReport(
  durationMs: number,
  metrics: SalaDeVigiliaMetrics,
  scales: SalaDeVigiliaScaleResult
) {
  // Converte tempos em ms para segundos conforme Regra 8 do ARCHITECTURE.md
  let severity: 'minimo' | 'leve' | 'moderado' | 'importante' = 'leve';
  if (scales.score < 50) severity = 'importante';
  else if (scales.score < 80) severity = 'moderado';
  else if (scales.score >= 95) severity = 'minimo';

  return {
    attentionType: 'sustentada' as const,
    game: 'SalaDeVigilia' as const,
    severity,
    durationMs,
    metrics: {
      omissions: metrics.omissions,
      commissions: metrics.commissions,
      hitRate: metrics.hitRate,
      meanRT: Number((metrics.meanRT / 1000).toFixed(3)),
      sdRT: Number((metrics.sdRT / 1000).toFixed(3)),
      vigilanceDecrement: metrics.vigilanceDecrement,
      rtDecrement: Number((metrics.rtDecrement / 1000).toFixed(3)),
      block1HitRate: metrics.block1HitRate,
      block2HitRate: metrics.block2HitRate,
      block1MeanRT: Number((metrics.block1MeanRT / 1000).toFixed(3)),
      block2MeanRT: Number((metrics.block2MeanRT / 1000).toFixed(3)),
    },
    scales: {
      omissionSeverity: scales.omissionSeverity,
      commissionSeverity: scales.commissionSeverity,
      vigilanceDecrementSeverity: scales.vigilanceDecrementSeverity,
      rtVariabilitySeverity: scales.rtVariabilitySeverity,
      score: scales.score,
      ludicScore: metrics.ludicScore,
      level: scales.level,
    }
  };
}
