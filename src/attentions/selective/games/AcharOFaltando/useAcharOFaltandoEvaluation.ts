// src/attentions/selective/games/AcharOFaltando/useAcharOFaltandoEvaluation.ts
import { getSessionById } from "../../../../shared/storage";
import { adaptSessionToAcharOFaltando } from "../../../../assessment/acharOFaltando/adaptSessionToAcharOFaltando";
import { calculateAcharOFaltandoMetrics } from "../../../../assessment/acharOFaltando/calculateAcharOFaltandoMetrics";
import { buildAcharOFaltandoScaleResult } from "../../../../assessment/acharOFaltando/buildAcharOFaltandoScaleResult";
import { buildAcharOFaltandoTechnicalReport } from "../../../../assessment/acharOFaltando/buildAcharOFaltandoTechnicalReport";
import { callEvaluator } from "../../../../lib/evaluatorClient";
import type { EvaluationReport as GeminiReport } from "../../../../lib/evaluatorClient";
import { saveReport } from "../../../../lib/saveReport";
import type { AcharOFaltandoMetrics, AcharOFaltandoScaleResult } from "../../../../assessment/acharOFaltando/types";

export interface AcharOFaltandoEvaluationReport {
  sessionId: string;
  metrics: AcharOFaltandoMetrics;
  scaleResult: AcharOFaltandoScaleResult;
  geminiReport?: GeminiReport;
}

/** Tenta salvar o laudo; se falhar, aguarda 2s e tenta uma vez mais */
async function saveReportWithRetry(
  report: GeminiReport,
  input: any
): Promise<void> {
  const result = await saveReport(report, input);
  if (result !== null) return;
  // Primeira tentativa falhou — aguarda e retenta uma vez
  await new Promise((r) => setTimeout(r, 2000));
  const retry = await saveReport(report, input);
  if (retry === null) {
    console.warn('[saveReportWithRetry] laudo não persistido após retry:', input.sessionId);
  }
}

export async function useAcharOFaltandoEvaluation(
  currentSessionId: string
): Promise<AcharOFaltandoEvaluationReport | null> {
  const currentLog = getSessionById(currentSessionId);
  if (!currentLog) return null;

  const rawRounds = currentLog.rounds ?? [];
  const results = adaptSessionToAcharOFaltando(rawRounds);
  const elapsed = currentLog.completedAt && currentLog.startedAt
    ? (currentLog.completedAt - currentLog.startedAt) / 1000
    : 180;

  const metrics = calculateAcharOFaltandoMetrics(results, elapsed);
  const scaleResult = buildAcharOFaltandoScaleResult(metrics);
  const evaluatorInput = buildAcharOFaltandoTechnicalReport(currentSessionId, metrics, scaleResult);

  let geminiReport: GeminiReport | undefined;
  try {
    const res = await callEvaluator(evaluatorInput as any);
    if (res) geminiReport = res;
  } catch (err) {
    console.warn('vigil-evaluator/Gemini indisponível:', err);
  }

  // Salva laudo no Firebase Storage + URL no Firestore, com retry único em falha
  if (geminiReport) {
    await saveReportWithRetry(geminiReport, evaluatorInput);
  }

  return {
    sessionId: currentSessionId,
    metrics,
    scaleResult,
    geminiReport,
  };
}
