import type { ColorShapeSessionLog, ColorShapeMetrics } from './types';
import type { EvaluationReport } from '../../../../lib/evaluatorClient';
import { calculateColorShapeMetrics } from './calculateColorShapeMetrics';

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
      level:    raw.severity,
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
  const metrics = calculateColorShapeMetrics(log.mainTrials);

  const payload = {
    game:          'color-shape',
    attentionType: 'alternada',
    sessionId:     log.sessionId,
    startedAt:     log.startedAt,
    metrics,
    // Resumo interpretativo enviado ao Gemini
    interpretation: {
      switchingCost: {
        rtMs:    metrics.switchCostRtMs,
        errorPp: metrics.switchCostErrorPp,
        note:    metrics.switchCostRtMs <= 150 ? 'baixo' :
                 metrics.switchCostRtMs <= 300 ? 'moderado' :
                 metrics.switchCostRtMs <= 500 ? 'alto' : 'muito alto',
      },
      mixingCost: {
        rtMs:    metrics.mixingCostRtMs,
        errorPp: metrics.mixingCostErrorPp,
        note:    metrics.mixingCostRtMs <= 100 ? 'baixo' :
                 metrics.mixingCostRtMs <= 250 ? 'moderado' :
                 metrics.mixingCostRtMs <= 450 ? 'alto' : 'muito alto',
      },
      perseveration: {
        count: metrics.perseverationErrors,
        pct:   metrics.perseverationPct,
        note:  metrics.perseverationErrors === 0 ? 'ausente' :
               metrics.perseverationErrors <= 2  ? 'rara' :
               metrics.perseverationErrors <= 5  ? 'frequente' : 'crítica',
      },
      bivalencyEffect: {
        ms:   metrics.bivalencyEffectMs,
        note: metrics.bivalencyEffectMs <= 80 ? 'sem efeito' :
              metrics.bivalencyEffectMs <= 200 ? 'leve' : 'marcado',
      },
      severity: metrics.severity,
    },
    trialSummary: {
      total:         log.mainTrials.length,
      switchTrials:  metrics.switchTrials,
      repeatTrials:  metrics.repeatTrials,
      pureTrials:    metrics.pureTrials,
      errors:        log.mainTrials.filter(t => !t.correct).length,
      timeouts:      metrics.timeoutCount,
    },
  };

  const geminiReport = await callEvaluator(payload);
  return { metrics, geminiReport };
}
