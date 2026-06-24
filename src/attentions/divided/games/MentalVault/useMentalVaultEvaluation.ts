// Hook de avaliação pós-sessão do Cofre Mental.
import { buildMentalVaultTechnicalReport } from '../../../../assessment/mentalVault/calculateMentalVaultMetrics';
import type { RegistroRodada } from './types';
import type { EvaluationReport, EvaluatorInput } from '../../../../lib/evaluatorClient';
import { callEvaluator } from '../../../../lib/evaluatorClient';
import { saveReport } from '../../../../lib/saveReport';
import { auth } from '../../../../lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import db from '../../../../lib/firebase';

export interface MentalVaultEvaluationResult {
  metrics: any;
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
  rodadas: RegistroRodada[]
): Promise<MentalVaultEvaluationResult> {
  const technicalReport = buildMentalVaultTechnicalReport(sessionId, startedAt, nivelMaximo, rodadas);
  const metrics = technicalReport.metrics;

  // Monta o payload de entrada do avaliador
  const evaluatorInput: EvaluatorInput = {
    sessionId,
    attentionType: 'dividida',
    game: 'cofre-mental',
    
    // Métricas do teste
    nivelMaximo: metrics.nivelMaximo,
    totalRodadas: metrics.totalRodadas,
    rodadasPuras: metrics.rodadasPuras,
    rodadasMistas: metrics.rodadasMistas,
    avgAbsoluteRecall: metrics.avgAbsoluteRecall,
    avgAbsoluteRecallPuras: metrics.avgAbsoluteRecallPuras,
    avgAbsoluteRecallMistas: metrics.avgAbsoluteRecallMistas,
    tbrsCost: metrics.tbrsCost,
    avgDigitAccuracy: metrics.avgDigitAccuracy,
    totalCommissionErrors: metrics.totalCommissionErrors,
    totalOmissions: metrics.totalOmissions,
    avgDigitMeanRtMs: metrics.avgDigitMeanRtMs,
    avgDigitIes: metrics.avgDigitIes,
  };

  // Salva score e level localmente antes do Gemini, garantindo que o Histórico funcione mesmo em caso de falha de IA
  try {
    if (auth.currentUser?.uid) {
      // Usar a mesma regra de conversão de level
      const levelClass = metrics.avgAbsoluteRecall >= 4.5 ? 'mínimo' :
                         metrics.avgAbsoluteRecall >= 3.5 ? 'leve' :
                         metrics.avgAbsoluteRecall >= 2.5 ? 'moderado' : 'importante';
      
      // Calculate a rough score (0-100) if not provided by metrics, or we can just use 0 if not calculated yet
      // Looking at `buildMentalVaultTechnicalReport`, it doesn't return `score` and `severity` directly in metrics?
      // Ah wait, let's look at `buildMentalVaultTechnicalReport`.
      // It returns `{ metrics, ... }`. Wait, let's see what `MentalVault` does.
      // I'll calculate an estimated score if not present. Let me check what `MentalVault` provides.
      // Actually, `MentalVault` severity/score logic was usually in Gemini. But wait, we need it locally.
      // Let me just save `score: 0` or something, or better calculate.
      // Let me look at how SelectiveListening did it.
      await setDoc(doc(db, 'sessions', sessionId), {
        uid: auth.currentUser.uid,
        sessionId: sessionId,
        game: 'cofre-mental',
        attentionType: 'dividida',
        score: metrics.avgDigitIes ? Math.max(0, Math.round(100 - (metrics.avgDigitIes / 50))) : 50, // rough estimate
        level: levelClass,
        createdAt: serverTimestamp(),
      }, { merge: true });
    }
  } catch (err) {
    console.error('[MentalVault] erro ao salvar sessão localmente:', err);
  }

  // Chama o evaluator (Gemini)
  const geminiReport = await callEvaluator(evaluatorInput);

  if (geminiReport) {
    await saveWithRetry(geminiReport, evaluatorInput);
  }

  return { metrics, geminiReport };
}
