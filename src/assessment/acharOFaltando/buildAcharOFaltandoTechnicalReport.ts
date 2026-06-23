// src/assessment/acharOFaltando/buildAcharOFaltandoTechnicalReport.ts
import { AcharOFaltandoMetrics, AcharOFaltandoScaleResult } from './types';

export interface AcharOFaltandoEvaluatorInput {
  attentionType: 'seletiva';
  game: 'achar-o-faltando';
  sessionId: string;
  severity?: 'minimo' | 'leve' | 'moderado' | 'importante';
  totalRounds?: number;
  totalHits?: number;
  totalOmissions?: number;
  totalFalsePositives?: number;
  totalCorrectRounds?: number;
  accuracyPerMinute?: number;
  averageResponseMs?: number;
  accuracyNote?: string;
  speedNote?: string;
}

/**
 * Constrói o log estruturado pronto para ser enviado ao Gemini.
 */
export function buildAcharOFaltandoTechnicalReport(
  sessionId: string,
  metrics: AcharOFaltandoMetrics,
  scaleResult: AcharOFaltandoScaleResult
): AcharOFaltandoEvaluatorInput {
  let rawSeverity: 'minimo' | 'leve' | 'moderado' | 'importante' = 'minimo';
  if (scaleResult.level === 'mínimo') {
    rawSeverity = 'minimo';
  } else {
    rawSeverity = scaleResult.level;
  }

  return {
    attentionType: 'seletiva',
    game: 'achar-o-faltando',
    sessionId,
    severity: rawSeverity,
    totalRounds: metrics.roundsPlayed,
    totalHits: metrics.totalHits,
    totalOmissions: metrics.totalOmissions,
    totalFalsePositives: metrics.totalFalsePositives,
    totalCorrectRounds: metrics.totalCorrectRounds,
    accuracyPerMinute: Number(metrics.accuracyPerMinute.toFixed(2)),
    averageResponseMs: Math.round(metrics.averageResponseMs),
    accuracyNote: scaleResult.accuracyNote,
    speedNote: scaleResult.speedNote,
  };
}
