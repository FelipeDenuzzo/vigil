// Envia métricas ao vigil-evaluator (Gemini) e persiste no Firestore
import type { ColorShapeSessionLog, ColorShapeMetrics } from './types';
import type { EvaluationReport } from '../../../../lib/evaluatorClient';
import { calculateColorShapeMetrics } from './calculateColorShapeMetrics';

const EVALUATOR_URL    = import.meta.env.VITE_EVALUATOR_URL    as string | undefined;
const EVALUATOR_SECRET = import.meta.env.VITE_EVALUATOR_SECRET as string | undefined;

export interface ColorShapeEvaluationResult {
  metrics:      ColorShapeMetrics;
  geminiReport: EvaluationReport | null;
}

async function callEvaluator(
  payload: object
): Promise<EvaluationReport | null> {
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
    if (!res.ok) {
      console.error(`[ColorShape] HTTP ${res.status}:`, await res.text());
      return null;
    }
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
    game:        'color-shape',
    attentionType: 'alternada',
    sessionId:   log.sessionId,
    startedAt:   log.startedAt,
    metrics,
    // Amostra dos trials (sem dados brutos todos para não inflar o payload)
    trialSummary: {
      total:         log.mainTrials.length,
      switchTrials:  log.mainTrials.filter(t => t.trialType === 'switch').length,
      repeatTrials:  log.mainTrials.filter(t => t.trialType === 'repeat').length,
      errors:        log.mainTrials.filter(t => !t.correct).length,
      timeouts:      log.mainTrials.filter(t => t.timedOut).length,
    },
  };

  const geminiReport = await callEvaluator(payload);
  return { metrics, geminiReport };
}
