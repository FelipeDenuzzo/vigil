// src/assessment/insetos/buildInsetosTechnicalReport.ts
// Relatório técnico completo da sessão Insetos — para uso futuro pelo Gemini Evaluator.

import type { InsetosSessionData, InsetosMetrics, InsetosScaleResult } from './types';
import { calculateInsetosMetrics } from './calculateInsetosMetrics';
import { buildInsetosScaleResult } from './buildInsetosScaleResult';

export interface InsetosTechnicalReport {
  sessionId:   string;
  startedAt:   string;
  metrics:     InsetosMetrics;
  scaleResult: InsetosScaleResult;
  eventCount:  number;
  hitRate:     number | null;
}

export function buildInsetosTechnicalReport(
  data: InsetosSessionData
): InsetosTechnicalReport {
  const metrics     = calculateInsetosMetrics(data.rawEvents);
  const scaleResult = buildInsetosScaleResult(metrics);

  return {
    sessionId:   data.sessionId,
    startedAt:   data.startedAt,
    metrics,
    scaleResult,
    eventCount:  data.rawEvents.length,
    hitRate:     metrics.accuracyPct,
  };
}
