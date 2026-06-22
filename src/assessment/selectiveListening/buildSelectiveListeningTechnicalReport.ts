// src/assessment/selectiveListening/buildSelectiveListeningTechnicalReport.ts
import { SelectiveListeningMetrics, SelectiveListeningScaleResult } from './types';

export interface DividedEvaluatorInput {
  attentionType: 'dividida';
  sessionId: string;
  severity?: 'minimo' | 'leve' | 'moderado' | 'importante';
  totalRounds?: number;
  serialAccuracy?: number;
  itemAccuracy?: number;
  omissions?: number;
  meanResponseTimeMs?: number;
  distractorIntrusionRate?: number;
  loadCost?: number;
  avgReplayCount?: number;
  accuracyNote?: string;
  intrusionNote?: string;
}

/**
 * Monta o relatório técnico estruturado (DividedEvaluatorInput)
 * que será enviado para o backend vigil-evaluator/Gemini.
 */
export function buildSelectiveListeningTechnicalReport(
  sessionId: string,
  metrics: SelectiveListeningMetrics,
  scaleResult: SelectiveListeningScaleResult
): DividedEvaluatorInput {
  // Converte a severidade para o formato sem acentos esperado no backend
  let rawSeverity: 'minimo' | 'leve' | 'moderado' | 'importante' = 'minimo';
  if (scaleResult.level === 'mínimo') {
    rawSeverity = 'minimo';
  } else {
    rawSeverity = scaleResult.level;
  }

  return {
    attentionType: 'dividida',
    sessionId,
    severity: rawSeverity,
    totalRounds: metrics.totalRounds,
    serialAccuracy: Number(metrics.serialAccuracy.toFixed(3)),
    itemAccuracy: Number(metrics.itemAccuracy.toFixed(3)),
    omissions: metrics.omissions,
    meanResponseTimeMs: Math.round(metrics.meanResponseTimeMs),
    distractorIntrusionRate: Number(metrics.distractorIntrusionRate.toFixed(3)),
    loadCost: Number(metrics.loadCost.toFixed(3)),
    avgReplayCount: Number(metrics.avgReplayCount.toFixed(2)),
    accuracyNote: scaleResult.accuracyNote,
    intrusionNote: scaleResult.intrusionNote,
  };
}
