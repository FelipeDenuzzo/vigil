// src/assessment/colorShape/buildColorShapeTechnicalReport.ts
// Monta o ColorShapeTechnicalReport pronto para enviar ao vigil-evaluator.

import { calculateColorShapeMetrics }  from './calculateColorShapeMetrics';
import { buildColorShapeScaleResult }   from './buildColorShapeScaleResult';
import type { ColorShapeAnalysisInput, ColorShapeTechnicalReport } from './types';

export function buildColorShapeTechnicalReport(
  input: ColorShapeAnalysisInput
): ColorShapeTechnicalReport {
  const metrics     = calculateColorShapeMetrics({
    pureTrials:  input.pureTrials,
    mixedTrials: input.mixedTrials,
  });
  const scaleResult = buildColorShapeScaleResult(metrics);

  return {
    sessionId:     input.sessionId,
    startedAt:     input.startedAt,
    attentionType: 'alternada',
    game:          'color-shape',
    metrics,
    scaleResult,
    interpretation: {
      switchingCost: {
        rtMs:    metrics.switchCostRtMs,
        errorPp: metrics.switchCostErrorPp,
        note:    scaleResult.switchingCostNote,
      },
      mixingCost: {
        rtMs:    metrics.mixingCostRtMs,
        errorPp: metrics.mixingCostErrorPp,
        note:    scaleResult.mixingCostNote,
      },
      perseveration: {
        count: metrics.perseverationErrors,
        pct:   metrics.perseverationPct,
        note:  scaleResult.perseverationNote,
      },
      bivalencyEffect: {
        ms:   metrics.bivalencyEffectMs,
        note: scaleResult.bivalencyNote,
      },
    },
    trialSummary: {
      total:        input.mainTrials.length,
      switchTrials: metrics.switchTrials,
      repeatTrials: metrics.repeatTrials,
      pureTrials:   metrics.pureTrials,
      errors:       input.mainTrials.filter(t => !t.correct).length,
      timeouts:     metrics.timeoutCount,
    },
  };
}
