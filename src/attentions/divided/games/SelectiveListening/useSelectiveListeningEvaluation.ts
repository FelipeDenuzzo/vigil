import { calculateSelectiveListeningMetrics } from '../../../../assessment/selectiveListening/calculateSelectiveListeningMetrics';
import { buildSelectiveListeningScaleResult } from '../../../../assessment/selectiveListening/buildSelectiveListeningScaleResult';
import { buildSelectiveListeningTechnicalReport } from '../../../../assessment/selectiveListening/buildSelectiveListeningTechnicalReport';
import { TentativaRodada } from '../../../../assessment/selectiveListening/types';
import type { EvaluationReport, EvaluatorInput } from '../../../../lib/evaluatorClient';
import { callEvaluator } from '../../../../lib/evaluatorClient';
import { saveReport } from '../../../../lib/saveReport';
import { auth } from '../../../../lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import db from '../../../../lib/firebase';

export interface SelectiveListeningEvaluationResult {
  metrics: any;
  scaleResult: any;
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
    console.warn('[SelectiveListening] laudo não persistido após retry:', input.sessionId);
  }
}

export async function useSelectiveListeningEvaluation(
  sessionId: string,
  rodadas: TentativaRodada[]
): Promise<SelectiveListeningEvaluationResult> {
  const metrics = calculateSelectiveListeningMetrics(rodadas);
  const scaleResult = buildSelectiveListeningScaleResult(metrics);
  const technicalReport = buildSelectiveListeningTechnicalReport(sessionId, metrics, scaleResult);

  // Monta o payload de entrada do avaliador
  const evaluatorInput: EvaluatorInput = {
    sessionId,
    attentionType: 'dividida',
    game: 'escuta-seletiva',
    
    // Métricas do teste
    severity: technicalReport.severity,
    totalRounds: technicalReport.totalRounds,
    serialAccuracy: technicalReport.serialAccuracy,
    itemAccuracy: technicalReport.itemAccuracy,
    omissions: technicalReport.omissions,
    meanResponseTimeMs: technicalReport.meanResponseTimeMs,
    distractorIntrusionRate: technicalReport.distractorIntrusionRate,
    loadCost: technicalReport.loadCost,
    avgReplayCount: technicalReport.avgReplayCount,
    accuracyNote: technicalReport.accuracyNote,
    intrusionNote: technicalReport.intrusionNote,
  };

  // Salva score e level localmente antes do Gemini, garantindo que o Histórico funcione mesmo em caso de falha de IA
  try {
    if (auth.currentUser?.uid) {
      await setDoc(doc(db, 'sessions', sessionId), {
        uid: auth.currentUser.uid,
        sessionId: sessionId,
        game: 'escuta-seletiva',
        attentionType: 'dividida',
        score: scaleResult.score,
        level: scaleResult.level,
        createdAt: serverTimestamp(),
      }, { merge: true });
    }
  } catch (err) {
    console.error('[SelectiveListening] erro ao salvar sessão localmente:', err);
  }

  // Chama o evaluator (Gemini)
  const geminiReport = await callEvaluator({ ...evaluatorInput, ludicScore: metrics.ludicScore ?? undefined } as any);

  if (geminiReport) {
    await saveWithRetry(geminiReport, evaluatorInput);
  }

  return { metrics, scaleResult, geminiReport };
}
