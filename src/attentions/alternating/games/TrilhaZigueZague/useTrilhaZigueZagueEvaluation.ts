// src/attentions/alternating/games/TrilhaZigueZague/useTrilhaZigueZagueEvaluation.ts

import type { TrilhaZigueZagueSessionLog } from './types';
import type { TrilhaZigueZagueSessionMetrics } from '../../../../assessment/trilhaZigueZague/types';
import type { EvaluationReport, EvaluatorInput } from '../../../../lib/evaluatorClient';
import { adaptSessionToTrilhaZigueZague } from '../../../../assessment/trilhaZigueZague/adaptSessionToTrilhaZigueZague';
import { buildTrilhaZigueZagueScaleResult } from '../../../../assessment/trilhaZigueZague/buildTrilhaZigueZagueScaleResult';
import { saveReport } from '../../../../lib/saveReport';
import { auth } from '../../../../lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import db from '../../../../lib/firebase';

const EVALUATOR_URL    = import.meta.env.VITE_EVALUATOR_URL    as string | undefined;
const EVALUATOR_SECRET = import.meta.env.VITE_EVALUATOR_SECRET as string | undefined;

export interface TrilhaZigueZagueEvaluationResult {
  metrics:      TrilhaZigueZagueSessionMetrics;
  geminiReport: EvaluationReport | null;
}

async function callEvaluator(payload: EvaluatorInput): Promise<EvaluationReport | null> {
  if (!EVALUATOR_URL || !EVALUATOR_SECRET) {
    console.warn('[TrilhaZigueZague] VITE_EVALUATOR_URL ou VITE_EVALUATOR_SECRET não configurados');
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
      console.error(`[TrilhaZigueZague] HTTP ${res.status}:`, await res.text());
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
    console.error('[TrilhaZigueZague] erro ao chamar evaluator:', err);
    return null;
  }
}

async function saveWithRetry(report: EvaluationReport, input: EvaluatorInput): Promise<void> {
  const result = await saveReport(report, input);
  if (result !== null) return;
  await new Promise((r) => setTimeout(r, 2000));
  const retry = await saveReport(report, input);
  if (retry === null) {
    console.warn('[TrilhaZigueZague] laudo não persistido após retry');
  }
}

export async function useTrilhaZigueZagueEvaluation(
  log: TrilhaZigueZagueSessionLog
): Promise<TrilhaZigueZagueEvaluationResult> {
  const metrics = adaptSessionToTrilhaZigueZague(log.sessionData);
  const scale = buildTrilhaZigueZagueScaleResult(metrics);

  const payload: EvaluatorInput = {
    game:          'trilha-zigue-zague' as any,
    attentionType: 'alternada',
    sessionId:     log.sessionId,
    startedAt:     log.startedAt,
    severity:      scale.level,

    // Trilha Zigue Zague específicos (precisa ser injetado para a IA no prompt)
    timePhase1:       metrics.timePhase1,
    timePhase2:       metrics.timePhase2,
    shiftingErrors:   metrics.shiftingErrors,
    sequencingErrors: metrics.sequencingErrors,
    totalErrors:      metrics.totalErrors,
    
    // Passando o Custo pro backend (a IA recebe)
    switchCostRtMs:   metrics.switchingCost * 1000 // Convertendo para ms caso a IA espere ms (ou o prompt lida com segundos)
  };

  // Salva score localmente antes da IA
  try {
    if (auth.currentUser?.uid) {
      await setDoc(doc(db, 'sessions', log.sessionId), {
        uid:           auth.currentUser.uid,
        sessionId:     log.sessionId,
        game:          'trilha-zigue-zague',
        attentionType: 'alternada',
        score:         scale.score,
        level:         scale.level,
        createdAt:     serverTimestamp(),
      }, { merge: true });
    }
  } catch (err) {
    console.error('[TrilhaZigueZague] erro ao salvar sessão localmente:', err);
  }

  const geminiReport = await callEvaluator(payload);
  if (geminiReport) { 
    geminiReport.score = scale.score; 
    if (geminiReport.ludic) geminiReport.ludic.score = scale.score; 
  }
  
  if (geminiReport) {
    await saveWithRetry(geminiReport, payload);
  }
  
  return { metrics, geminiReport };
}
