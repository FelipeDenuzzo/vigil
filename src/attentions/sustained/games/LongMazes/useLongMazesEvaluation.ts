// Artefato 3 — Interface de envio ao vigil-evaluator
// Recebe o MazeFullSessionLog, calcula métricas via avaliador interno
// e envia ao Gemini via vigil-evaluator.

import { calculateLongMazesMetrics } from '../../../../assessment/longMazes/calculateLongMazesMetrics';
import { buildLongMazesTechnicalReport } from '../../../../assessment/longMazes/buildLongMazesTechnicalReport';
import type { MazeFullSessionLog } from './types';
import type { EvaluationReport } from '../../../../lib/evaluatorClient';
import { saveReport } from '../../../../lib/saveReport';
import { auth } from '../../../../lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import db from '../../../../lib/firebase';

const EVALUATOR_URL = import.meta.env.VITE_EVALUATOR_URL as string | undefined;
const EVALUATOR_SECRET = import.meta.env.VITE_EVALUATOR_SECRET as string | undefined;

async function callEvaluatorSustained(
  input: ReturnType<typeof buildLongMazesTechnicalReport>
): Promise<EvaluationReport | null> {
  if (!EVALUATOR_URL || !EVALUATOR_SECRET) {
    console.warn('[LongMazes] VITE_EVALUATOR_URL ou VITE_EVALUATOR_SECRET não configurados');
    return null;
  }
  try {
    const res = await fetch(`${EVALUATOR_URL}/evaluate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-evaluator-secret': EVALUATOR_SECRET,
      },
      body: JSON.stringify({ ...input, uid: auth.currentUser?.uid }),
      signal: AbortSignal.timeout(45_000),
    });
    if (!res.ok) {
      const text = await res.text();
      console.error(`[LongMazes] HTTP ${res.status}: ${text}`);
      return null;
    }
    const raw = await res.json();
    return {
      score: raw.score,
      level: raw.severity === 'minimo' ? 'mínimo' : raw.severity,
      ludic: raw.report?.ludic ?? null,
      general: raw.report?.general ?? null,
      clinical: raw.report?.clinical ?? null,
    } as EvaluationReport;
  } catch (err) {
    console.error('[LongMazes] erro ao chamar evaluator:', err);
    return null;
  }
}

async function saveWithRetry(
  report: EvaluationReport,
  input: ReturnType<typeof buildLongMazesTechnicalReport>
): Promise<void> {
  // saveReport espera EvaluationReport + EvaluatorInput — usamos o input como any
  // pois a assinatura do vigil-evaluator já aceita o campo sustentada
  const result = await saveReport(report, input as any);
  if (result !== null) return;
  await new Promise((r) => setTimeout(r, 2000));
  const retry = await saveReport(report, input as any);
  if (retry === null) {
    console.warn('[LongMazes] laudo não persistido após retry:', input.sessionId);
  }
}

export interface LongMazesEvaluationResult {
  metrics: ReturnType<typeof calculateLongMazesMetrics>;
  geminiReport: EvaluationReport | null;
}

export async function useLongMazesEvaluation(
  log: MazeFullSessionLog,
  sessionId: string
): Promise<LongMazesEvaluationResult> {
  // Artefato 2: calcula métricas e severity deterministicamente
  const metrics = calculateLongMazesMetrics(log);

  // Monta o payload para o vigil-evaluator
  const evaluatorInput = buildLongMazesTechnicalReport(metrics, sessionId);

  // Salva score e level localmente antes do Gemini, garantindo que o Histórico funcione mesmo em caso de falha de IA
  try {
    if (auth.currentUser?.uid) {
      await setDoc(doc(db, 'sessions', sessionId), {
        uid: auth.currentUser.uid,
        sessionId: sessionId,
        game: 'long-mazes',
        attentionType: 'sustentada',
        score: metrics.avgEfficiencyPct,
        level: metrics.severity === 'minimo' ? 'mínimo' : metrics.severity,
        createdAt: serverTimestamp(),
      }, { merge: true });
    }
  } catch (err) {
    console.error('[LongMazes] erro ao salvar sessão localmente:', err);
  }

  // Artefato 3: envia ao Gemini
  const geminiReport = await callEvaluatorSustained(evaluatorInput);
  if (geminiReport) { geminiReport.score = metrics.avgEfficiencyPct; if (geminiReport.ludic) geminiReport.ludic.score = metrics.avgEfficiencyPct; }

  if (geminiReport) {
    await saveWithRetry(geminiReport, evaluatorInput);
  }

  return { metrics, geminiReport };
}
