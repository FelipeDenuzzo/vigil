// Hook de avaliação pós-sessão do Cofre Mental.
import { buildMentalVaultTechnicalReport } from '../../../../assessment/mentalVault/calculateMentalVaultMetrics';
import type { RegistroRodada } from './types';
import type { EvaluationReport, EvaluatorInput } from '../../../../lib/evaluatorClient';
import { callEvaluator } from '../../../../lib/evaluatorClient';
import { saveReport } from '../../../../lib/saveReport';

export interface MentalVaultEvaluationResult {
  metrics: any;
  geminiReport: EvaluationReport | null;
}

async function saveWithRetry(
  report: EvaluationReport,
  input: EvaluatorInput
): Promise<void> {
  const result = await saveReport(report, input);
  if (result !== null) return;
  await new Promise((r) => setTimeout(r, 2000));
  const retry = await saveReport(report, input);
  if (retry === null) {
    console.warn('[MentalVault] laudo não persistido após retry:', input.sessionId);
  }
}

export async function useMentalVaultEvaluation(
  sessionId: string,
  startedAt: string,
  nivelMaximo: number,
  rodadas: RegistroRodada[]
): Promise<MentalVaultEvaluationResult> {
  const technicalReport = buildMentalVaultTechnicalReport(sessionId, startedAt, nivelMaximo, rodadas);
  const metrics = technicalReport.metrics;

  // Monta o payload de entrada do avaliador
  const evaluatorInput: EvaluatorInput = {
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

  // Chama o evaluator (Gemini)
  const geminiReport = await callEvaluator(evaluatorInput);

  if (geminiReport) {
    await saveWithRetry(geminiReport, evaluatorInput);
  }

  return { metrics, geminiReport };
}
