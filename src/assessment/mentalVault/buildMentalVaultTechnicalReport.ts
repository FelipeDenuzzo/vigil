// src/assessment/mentalVault/buildMentalVaultTechnicalReport.ts

import type { MentalVaultSessionMetrics } from './types';
import type { EvaluatorInput } from '../../lib/evaluatorClient';

export function buildMentalVaultTechnicalReport(
  sessionId: string,
  startedAt: string,
  metrics: MentalVaultSessionMetrics
): EvaluatorInput {
  const severity =
    (metrics.avgAbsoluteRecall ?? 0) >= 4.5 ? 'minimo' :
    (metrics.avgAbsoluteRecall ?? 0) >= 3.5 ? 'leve' :
    (metrics.avgAbsoluteRecall ?? 0) >= 2.5 ? 'moderado' : 'importante';

  return {
    sessionId,
    startedAt,
    attentionType: 'dividida',
    game: 'cofre-mental',
    severity,
    
    // Métricas do teste
    nivelMaximo: metrics.nivelMaximo,
    totalRodadas: metrics.totalRodadas,
    rodadasPuras: metrics.rodadasPuras,
    rodadasMistas: metrics.rodadasMistas,
    avgAbsoluteRecall: metrics.avgAbsoluteRecall,
    avgAbsoluteRecallPuras: metrics.avgAbsoluteRecallPuras,
    avgAbsoluteRecallMistas: metrics.avgAbsoluteRecallMistas,
    tbrsCost: metrics.tbrsCost,
    avgDigitAccuracy: metrics.avgDigitAccuracy,
    totalCommissionErrors: metrics.totalCommissionErrors,
    totalOmissions: metrics.totalOmissions,
    avgDigitMeanRtMs: metrics.avgDigitMeanRtMs,
    avgDigitIes: metrics.avgDigitIes,
  };
}
