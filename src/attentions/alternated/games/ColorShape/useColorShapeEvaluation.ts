// Hook de avaliação pós-sessão ColorShape.

import type { ColorShapeSessionLog, ColorShapeMetrics } from './types';
import type { EvaluationReport } from '../../../../lib/evaluatorClient';
import { calculateColorShapeMetrics } from './calculateColorShapeMetrics';
import { adaptSessionToColorShape }    from '../../../../assessment/colorShape/adaptSessionToColorShape';
import { buildColorShapeTechnicalReport } from '../../../../assessment/colorShape/buildColorShapeTechnicalReport';

const EVALUATOR_URL    = import.meta.env.VITE_EVALUATOR_URL    as string | undefined;
const EVALUATOR_SECRET = import.meta.env.VITE_EVALUATOR_SECRET as string | undefined;

export interface ColorShapeEvaluationResult {
  metrics:      ColorShapeMetrics;
  geminiReport: EvaluationReport | null;
}

async function callEvaluator(payload: object): Promise<EvaluationReport | null> {
  if (!EVALUATOR_URL || !EVALUATOR_SECRET) {
    console.warn('[ColorShape] VITE_EVALUATOR_URL ou VITE_EVALUATOR_SECRET não configurados');
    return null;
  }
  try {
    const res = await fetch(`${EVALUATOR_URL}/evaluate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-evaluator-secret': EVALUATOR_SECRET,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(45_000),
    });
    if (!res.ok) { console.error(`[ColorShape] HTTP ${res.status}:`, await res.text()); return null; }
    const raw = await res.json();
    return {
      score:    raw.score,
      level:    raw.severity ?? raw.level,
      ludic:    raw.report?.ludic    ?? null,
      general:  raw.report?.general  ?? null,
      clinical: raw.report?.clinical ?? null,
    } as EvaluationReport;
  } catch (err) {
    console.error('[ColorShape] erro ao chamar evaluator:', err);
    return null;
  }
}

export async function useColorShapeEvaluation(
  log: ColorShapeSessionLog
): Promise<ColorShapeEvaluationResult> {
  // Métricas: pureTrials = bloco A + B (baseline isolado), mixedTrials = bloco misto
  const metrics = calculateColorShapeMetrics({
    pureTrials:  [...log.blockATrials, ...log.blockBTrials],
    mixedTrials: log.mixedTrials,
  });

  const analysisInput   = adaptSessionToColorShape(log);
  const technicalReport = buildColorShapeTechnicalReport(analysisInput);

  const payload = {
    game:          'color-shape',
    attentionType: 'alternada' as const,
    sessionId:     technicalReport.sessionId,
    startedAt:     technicalReport.startedAt,
    severity:      metrics.severity,

    totalTrials:   technicalReport.metrics.totalTrials,
    accuracy:      technicalReport.metrics.accuracy,
    avgRtMs:       technicalReport.metrics.avgRtMs,
    timeoutCount:  technicalReport.metrics.timeoutCount,
    timeoutPct:    technicalReport.metrics.timeoutPct,

    switchTrials:      technicalReport.metrics.switchTrials,
    repeatTrials:      technicalReport.metrics.repeatTrials,
    switchAccuracy:    technicalReport.metrics.switchAccuracy,
    repeatAccuracy:    technicalReport.metrics.repeatAccuracy,
    switchAvgRtMs:     technicalReport.metrics.switchAvgRtMs,
    repeatAvgRtMs:     technicalReport.metrics.repeatAvgRtMs,
    switchCostRtMs:    technicalReport.metrics.switchCostRtMs,
    switchCostErrorPp: technicalReport.metrics.switchCostErrorPp,

    pureTrials:        technicalReport.metrics.pureTrials,
    pureAccuracy:      technicalReport.metrics.pureAccuracy,
    pureAvgRtMs:       technicalReport.metrics.pureAvgRtMs,
    mixingCostRtMs:    technicalReport.metrics.mixingCostRtMs,
    mixingCostErrorPp: technicalReport.metrics.mixingCostErrorPp,

    perseverationErrors: technicalReport.metrics.perseverationErrors,
    perseverationPct:    technicalReport.metrics.perseverationPct,

    bivalentTrials:      technicalReport.metrics.bivalentTrials,
    bivalentAvgRtMs:     technicalReport.metrics.bivalentAvgRtMs,
    nonBivalentAvgRtMs:  technicalReport.metrics.nonBivalentAvgRtMs,
    bivalencyEffectMs:   technicalReport.metrics.bivalencyEffectMs,

    colorAccuracy:  technicalReport.metrics.colorAccuracy,
    shapeAccuracy:  technicalReport.metrics.shapeAccuracy,
    colorAvgRtMs:   technicalReport.metrics.colorAvgRtMs,
    shapeAvgRtMs:   technicalReport.metrics.shapeAvgRtMs,

    switchingCostNote:  technicalReport.scaleResult.switchingCostNote,
    mixingCostNote:     technicalReport.scaleResult.mixingCostNote,
    perseverationNote:  technicalReport.scaleResult.perseverationNote,
    bivalencyNote:      technicalReport.scaleResult.bivalencyNote,

    trialSummary: technicalReport.trialSummary,
  };

  const geminiReport = await callEvaluator(payload);
  return { metrics, geminiReport };
}
