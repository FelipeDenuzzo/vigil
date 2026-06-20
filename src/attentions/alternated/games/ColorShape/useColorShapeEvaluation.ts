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
  const metrics = calculateColorShapeMetrics({
    pureTrials:  [...log.blockATrials, ...log.blockBTrials],
    mixedTrials: log.mixedTrials,
  });

  const analysisInput   = adaptSessionToColorShape(log);
  const technicalReport = buildColorShapeTechnicalReport(analysisInput);

  const m = technicalReport.metrics;
  const s = technicalReport.scaleResult;

  const payload = {
    game:          'color-shape',
    attentionType: 'alternada' as const,
    sessionId:     technicalReport.sessionId,
    startedAt:     technicalReport.startedAt,
    severity:      metrics.severity,

    // Global
    totalTrials:   m.totalTrials,
    accuracy:      m.accuracy,
    avgRtMs:       m.avgRtMs,
    timeoutCount:  m.timeoutCount,
    timeoutPct:    m.timeoutPct,

    // IES
    ies:     m.ies,
    iesNote: s.iesNote,

    // Switching Cost
    switchTrials:      m.switchTrials,
    repeatTrials:      m.repeatTrials,
    switchAccuracy:    m.switchAccuracy,
    repeatAccuracy:    m.repeatAccuracy,
    switchAvgRtMs:     m.switchAvgRtMs,
    repeatAvgRtMs:     m.repeatAvgRtMs,
    switchCostRtMs:    m.switchCostRtMs,
    switchCostErrorPp: m.switchCostErrorPp,
    switchingCostNote: s.switchingCostNote,

    // Mixing Cost
    pureTrials:        m.pureTrials,
    pureAccuracy:      m.pureAccuracy,
    pureAvgRtMs:       m.pureAvgRtMs,
    mixingCostRtMs:    m.mixingCostRtMs,
    mixingCostErrorPp: m.mixingCostErrorPp,
    mixingCostNote:    s.mixingCostNote,

    // Perseveração
    perseverationErrors: m.perseverationErrors,
    perseverationPct:    m.perseverationPct,
    perseverationNote:   s.perseverationNote,

    // Bivalência
    bivalentTrials:     m.bivalentTrials,
    bivalentAvgRtMs:    m.bivalentAvgRtMs,
    nonBivalentAvgRtMs: m.nonBivalentAvgRtMs,
    bivalencyEffectMs:  m.bivalencyEffectMs,
    bivalencyNote:      s.bivalencyNote,

    // Por regra
    colorAccuracy: m.colorAccuracy,
    shapeAccuracy: m.shapeAccuracy,
    colorAvgRtMs:  m.colorAvgRtMs,
    shapeAvgRtMs:  m.shapeAvgRtMs,

    // Fadiga atencional
    vigilanceEarlyRtMs:  m.vigilanceEarlyRtMs,
    vigilanceLateRtMs:   m.vigilanceLateRtMs,
    vigilanceDeclineMs:  m.vigilanceDeclineMs,
    vigilanceNote:       s.vigilanceNote,

    trialSummary: technicalReport.trialSummary,
  };

  const geminiReport = await callEvaluator(payload);
  return { metrics, geminiReport };
}
