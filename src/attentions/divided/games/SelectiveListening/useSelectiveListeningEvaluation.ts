import { calculateSelectiveListeningMetrics } from '../../../../assessment/selectiveListening/calculateSelectiveListeningMetrics';
import { buildSelectiveListeningScaleResult } from '../../../../assessment/selectiveListening/buildSelectiveListeningScaleResult';
import { buildSelectiveListeningTechnicalReport } from '../../../../assessment/selectiveListening/buildSelectiveListeningTechnicalReport';
import { TentativaRodada } from '../../../../assessment/selectiveListening/types';
import type { EvaluationReport, EvaluatorInput } from '../../../../lib/evaluatorClient';
import { callEvaluator } from '../../../../lib/evaluatorClient';
import { saveReport } from '../../../../lib/saveReport';

export interface SelectiveListeningEvaluationResult {
  metrics: any;
  scaleResult: any;
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
    console.warn('[SelectiveListening] laudo não persistido após retry:', input.sessionId);
  }
}

export async function useSelectiveListeningEvaluation(
  sessionId: string,
  rodadas: TentativaRodada[]
): Promise<SelectiveListeningEvaluationResult> {
  const metrics = calculateSelectiveListeningMetrics(rodadas);
  const scaleResult = buildSelectiveListeningScaleResult(metrics);
  const technicalReport = buildSelectiveListeningTechnicalReport(sessionId, metrics, scaleResult);

  // Monta o payload de entrada do avaliador
  const evaluatorInput: EvaluatorInput = {
    sessionId,
    attentionType: 'dividida',
    game: 'escuta-seletiva',
    
    // Métricas do teste
    severity: technicalReport.severity,
    totalRounds: technicalReport.totalRounds,
    serialAccuracy: technicalReport.serialAccuracy,
    itemAccuracy: technicalReport.itemAccuracy,
    omissions: technicalReport.omissions,
    meanResponseTimeMs: technicalReport.meanResponseTimeMs,
    distractorIntrusionRate: technicalReport.distractorIntrusionRate,
    loadCost: technicalReport.loadCost,
    avgReplayCount: technicalReport.avgReplayCount,
    accuracyNote: technicalReport.accuracyNote,
    intrusionNote: technicalReport.intrusionNote,
  };

  // Chama o evaluator (Gemini)
  const geminiReport = await callEvaluator(evaluatorInput);

  if (geminiReport) {
    await saveWithRetry(geminiReport, evaluatorInput);
  }

  return { metrics, scaleResult, geminiReport };
}
