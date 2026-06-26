// src/attentions/alternating/games/Insetos/useInsetosEvaluation.ts
// Hook de avaliação pós-sessão Insetos — espelha useColorShapeEvaluation.

import type { InsetosSessionLog } from './types';
import type { InsetosMetrics } from '../../../../assessment/insetos/types';
import type { EvaluationReport, EvaluatorInput } from '../../../../lib/evaluatorClient';
import { adaptSessionToInsetos }    from '../../../../assessment/insetos/adaptSessionToInsetos';
import { calculateInsetosMetrics }  from '../../../../assessment/insetos/calculateInsetosMetrics';
import { buildInsetosScaleResult }  from '../../../../assessment/insetos/buildInsetosScaleResult';
import { saveReport } from '../../../../lib/saveReport';
import { auth } from '../../../../lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import db from '../../../../lib/firebase';

const EVALUATOR_URL    = import.meta.env.VITE_EVALUATOR_URL    as string | undefined;
const EVALUATOR_SECRET = import.meta.env.VITE_EVALUATOR_SECRET as string | undefined;

export interface InsetosEvaluationResult {
  metrics:      InsetosMetrics;
  geminiReport: EvaluationReport | null;
}

async function callEvaluator(payload: EvaluatorInput): Promise<EvaluationReport | null> {
  if (!EVALUATOR_URL || !EVALUATOR_SECRET) {
    console.warn('[Insetos] VITE_EVALUATOR_URL ou VITE_EVALUATOR_SECRET não configurados');
    return null;
  }
  try {
    const res = await fetch(`${EVALUATOR_URL}/evaluate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-evaluator-secret': EVALUATOR_SECRET,
      },
      body: JSON.stringify({ ...payload, uid: auth.currentUser?.uid }),
      signal: AbortSignal.timeout(45_000),
    });
    if (!res.ok) {
      console.error(`[Insetos] HTTP ${res.status}:`, await res.text());
      return null;
    }
    const raw = await res.json();
    return {
      score:    raw.score,
      level:    raw.severity ?? raw.level,
      ludic:    raw.report?.ludic    ?? null,
      general:  raw.report?.general  ?? null,
      clinical: raw.report?.clinical ?? null,
    } as EvaluationReport;
  } catch (err) {
    console.error('[Insetos] erro ao chamar evaluator:', err);
    return null;
  }
}

async function saveWithRetry(report: EvaluationReport, input: EvaluatorInput): Promise<void> {
  const result = await saveReport(report, input);
  if (result !== null) return;
  await new Promise((r) => setTimeout(r, 2000));
  const retry = await saveReport(report, input);
  if (retry === null) {
    console.warn('[Insetos] laudo não persistido após retry');
  }
}

export async function useInsetosEvaluation(
  log: InsetosSessionLog
): Promise<InsetosEvaluationResult> {
  const sessionData = adaptSessionToInsetos(log);
  const metrics     = calculateInsetosMetrics(sessionData.rawEvents);
  const scale       = buildInsetosScaleResult(metrics);

  const payload: EvaluatorInput = {
    game:          'insetos' as any,
    attentionType: 'alternada',
    sessionId:     sessionData.sessionId,
    startedAt:     sessionData.startedAt,
    severity:      scale.level,

    // Métricas globais
    totalTrials:      metrics.totalTrials,
    totalHits:        metrics.totalHits,
    accuracyPct:      metrics.accuracyPct,
    omissions:        metrics.omissions,
    commissionErrors: metrics.commissionErrors,
    meanRT:           metrics.meanRT,

    // Custo de alternância
    switchCostMs:      metrics.switchCostMs,
    switchCostNote:    scale.switchCostNote,

    // Custo de multi-track
    multiTrackCostPct: metrics.multiTrackCostPct,

    // Decaimento de vigílância
    vigilanceDecayPct: metrics.vigilanceDecayPct,

    // Notas clínicas
    accuracyNote: scale.accuracyNote,
    speedNote:    scale.speedNote,
  };

  // Salva score localmente antes da IA
  try {
    if (auth.currentUser?.uid) {
      await setDoc(doc(db, 'sessions', sessionData.sessionId), {
        uid:           auth.currentUser.uid,
        sessionId:     sessionData.sessionId,
        game:          'insetos',
        attentionType: 'alternada',
        score:         scale.score,
        level:         scale.level,
        createdAt:     serverTimestamp(),
      }, { merge: true });
    }
  } catch (err) {
    console.error('[Insetos] erro ao salvar sessão localmente:', err);
  }

  const geminiReport = await callEvaluator(payload);
  if (geminiReport) {
    await saveWithRetry(geminiReport, payload);
  }
  return { metrics, geminiReport };
}
