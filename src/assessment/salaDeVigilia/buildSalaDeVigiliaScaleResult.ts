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

  const score = metrics.ludicScore;

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
