// src/assessment/mentalVault/buildMentalVaultTechnicalReport.ts

import type { MentalVaultSessionMetrics } from './types';
import type { EvaluatorInput } from '../../lib/evaluatorClient';

export function buildMentalVaultTechnicalReport(
  sessionId: string,
  metrics: MentalVaultSessionMetrics
): EvaluatorInput {
  return {
    sessionId,
    attentionType: 'dividida',
    game: 'cofre-mental',
    
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
