import { SalaDeVigiliaMetrics, SalaDeVigiliaScaleResult } from './types';
import {
  getOmissionSeverity,
  getCommissionSeverity,
  getVigilanceDecrementSeverity,
  getRtVariabilitySeverity,
} from './salaDeVigiliaScaleDefinitions';

export function buildSalaDeVigiliaScaleResult(
  metrics: SalaDeVigiliaMetrics
): SalaDeVigiliaScaleResult {
  const omissionSeverity = getOmissionSeverity(metrics.omissions);
  const commissionSeverity = getCommissionSeverity(metrics.commissions);
  const vigilanceDecrementSeverity = getVigilanceDecrementSeverity(metrics.vigilanceDecrement);
  const rtVariabilitySeverity = getRtVariabilitySeverity(metrics.sdRT);

  // Formula A: Sala de Vigília (sdRT)
  function clamp(v: number, min = 0, max = 100): number {
    return Math.max(min, Math.min(max, v));
  }
  
  // O score baseado em sdRT (variabilidade do tempo de reação)
  let baseScore = Math.round(clamp(100 - ((metrics.sdRT - 80) / (600 - 80)) * 100));

  // Penalidade por Omissões (se o usuário não clicar nas lâmpadas que acenderam)
  const hitRate = metrics.totalTargets > 0 
    ? (metrics.totalTargets - metrics.omissions) / metrics.totalTargets 
    : 1;
    
  // Penalidade por Comissões (cliques errados) - subtrai 2 pontos por cada clique impulsivo, limitado a -30
  const commissionPenalty = Math.min(metrics.commissions * 2, 30);
  
  let score = Math.round((baseScore * hitRate) - commissionPenalty);
  score = clamp(score, 0, 100);

  let level = 'Vigilância Estável';
  if (score < 50) level = 'Vigilância Oscilante';
  else if (score < 80) level = 'Vigilância Moderada';
  else if (score >= 95) level = 'Vigilância Excelente';

  return {
    omissionSeverity,
    commissionSeverity,
    vigilanceDecrementSeverity,
    rtVariabilitySeverity,
    score,
    level,
  };
}
