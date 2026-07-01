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

  // Calcula um score de 0 a 100 gamificado
  // TODO: Refinar o cálculo do score pela equipe científica
  let score = 100;
  score -= metrics.omissions * 10;
  score -= metrics.commissions * 5;
  if (metrics.vigilanceDecrement > 0.1) score -= 10;
  if (metrics.vigilanceDecrement > 0.2) score -= 10;
  
  score = Math.max(0, Math.min(100, Math.round(score)));

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
