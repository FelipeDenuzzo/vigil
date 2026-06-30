// Hook de avaliação pós-sessão do Cofre Mental.
import { calculateSessionMetrics } from '../../../../assessment/mentalVault/calculateMentalVaultMetrics';
import { buildMentalVaultTechnicalReport } from '../../../../assessment/mentalVault/buildMentalVaultTechnicalReport';
import { buildMentalVaultScaleResult, MentalVaultScaleResult } from '../../../../assessment/mentalVault/buildMentalVaultScaleResult';
import { adaptSessionToMentalVault } from '../../../../assessment/mentalVault/adaptSessionToMentalVault';
import type { EvaluationReport, EvaluatorInput } from '../../../../lib/evaluatorClient';
import { callEvaluator } from '../../../../lib/evaluatorClient';
import { saveReport } from '../../../../lib/saveReport';
import { auth } from '../../../../lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import db from '../../../../lib/firebase';

export interface MentalVaultEvaluationResult {
  metrics: any;
  scaleResult: MentalVaultScaleResult;
  geminiReport: EvaluationReport | null;
}

async function saveWithRetry(
  report: EvaluationReport,
  input: EvaluatorInput
): Promise<void> {
  const result = await saveReport(report, input);
  if (result !== null) return;
  await new Promise((r) => setTimeout(r, 2000));
  const retry = await saveReport(report, input);
  if (retry === null) {
    console.warn('[MentalVault] laudo não persistido após retry:', input.sessionId);
  }
}

export async function useMentalVaultEvaluation(
  sessionId: string,
  startedAt: string,
  nivelMaximo: number,
  rawRounds: unknown
): Promise<MentalVaultEvaluationResult> {
  // 1. Adapta os logs brutos para a estrutura esperada
  const rodadas = adaptSessionToMentalVault(rawRounds);

  // 2. Calcula métricas
  const metrics = calculateSessionMetrics(nivelMaximo, rodadas);

  // 3. Calcula severidade
  const scaleResult = buildMentalVaultScaleResult(metrics);

  // 4. Monta o payload do GCP
  const evaluatorInput = buildMentalVaultTechnicalReport(sessionId, startedAt, metrics);

  // Salva score e level localmente antes do Gemini, garantindo que o Histórico funcione mesmo em caso de falha de IA
  try {
    if (auth.currentUser?.uid) {
      await setDoc(doc(db, 'sessions', sessionId), {
        uid: auth.currentUser.uid,
        sessionId: sessionId,
        game: 'cofre-mental',
        attentionType: 'dividida',
        score: scaleResult.score,
        level: scaleResult.level,
        createdAt: serverTimestamp(),
      }, { merge: true });
    }
  } catch (err) {
    console.error('[MentalVault] erro ao salvar sessão localmente:', err);
  }

  // Chama o evaluator (Gemini)
  const geminiReport = await callEvaluator({ ...evaluatorInput, ludicScore: metrics.ludicScore ?? undefined } as any);

  if (geminiReport) {
    await saveWithRetry(geminiReport, evaluatorInput);
  }

  return { metrics, scaleResult, geminiReport };
}

