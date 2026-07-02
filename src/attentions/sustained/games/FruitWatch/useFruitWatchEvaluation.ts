// src/attentions/sustained/games/FruitWatch/useFruitWatchEvaluation.ts

import { calculateFruitWatchScore } from './logic';
import type { PhaseRawResult, FruitWatchScore } from './types';
import type { EvaluationReport } from '../../../../lib/evaluatorClient';
import { saveReport } from '../../../../lib/saveReport';
import { auth } from '../../../../lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import db from '../../../../lib/firebase';

const EVALUATOR_URL = import.meta.env.VITE_EVALUATOR_URL as string | undefined;
const EVALUATOR_SECRET = import.meta.env.VITE_EVALUATOR_SECRET as string | undefined;

async function callEvaluatorFruitWatch(
  sessionId: string,
  metrics: FruitWatchScore
): Promise<EvaluationReport | null> {
  if (!EVALUATOR_URL || !EVALUATOR_SECRET) {
    console.warn('[FruitWatch] VITE_EVALUATOR_URL ou VITE_EVALUATOR_SECRET não configurados');
    return null;
  }

  // Define a severidade com base no Foco Contínuo
  const severity =
    metrics.focoContinuo >= 80 ? 'minimo' :
    metrics.focoContinuo >= 60 ? 'leve' :
    metrics.focoContinuo >= 40 ? 'moderado' : 'importante';

  const payload = {
    attentionType: 'sustentada',
    game: 'fruit-watch',
    sessionId,
    severity,
    focoContinuo: metrics.focoContinuo,
    controleCalma: metrics.controleCalma,
    focoMultitarefa: metrics.focoMultitarefa,
    conquistaSecreta: metrics.conquistaSecreta,
    rawResults: metrics.rawResults,
    uid: auth.currentUser?.uid,
  };

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
      const text = await res.text();
      console.error(`[FruitWatch] HTTP ${res.status}: ${text}`);
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
    console.error('[FruitWatch] erro ao chamar evaluator:', err);
    return null;
  }
}

async function saveWithRetry(
  report: EvaluationReport,
  sessionId: string,
  metrics: FruitWatchScore
): Promise<void> {
  // Converte para o formato genérico que saveReport espera
  const input = {
    sessionId,
    game: 'fruit-watch' as any,
    attentionType: 'sustentada' as any,
    score: metrics.focoContinuo,
  };
  
  const result = await saveReport(report, input as any);
  if (result !== null) return;

  await new Promise((r) => setTimeout(r, 2000));
  const retry = await saveReport(report, input as any);
  if (retry === null) {
    console.warn('[FruitWatch] laudo não persistido após retry:', sessionId);
  }
}

export interface FruitWatchEvaluationResult {
  metrics: FruitWatchScore;
  geminiReport: EvaluationReport | null;
}

export async function useFruitWatchEvaluation(
  results: PhaseRawResult[],
  sessionId: string
): Promise<FruitWatchEvaluationResult> {
  // 1. Calcula as métricas deterministicamente
  const metrics = calculateFruitWatchScore(results);

  // Define a classificação de severidade clínica
  const level =
    metrics.focoContinuo >= 80 ? 'mínimo' :
    metrics.focoContinuo >= 60 ? 'leve' :
    metrics.focoContinuo >= 40 ? 'moderado' : 'importante';

  // 2. Salva score e level localmente antes da IA para assegurar persistência e histórico íntegro
  try {
    if (auth.currentUser?.uid) {
      await setDoc(doc(db, 'sessions', sessionId), {
        uid: auth.currentUser.uid,
        sessionId: sessionId,
        game: 'fruit-watch',
        attentionType: 'sustentada',
        score: metrics.focoContinuo,
        level: level,
        createdAt: serverTimestamp(),
      }, { merge: true });
    }
  } catch (err) {
    console.error('[FruitWatch] erro ao salvar sessão localmente:', err);
  }

  // 3. Solicita a avaliação qualitativa à IA (Gemini)
  const geminiReport = await callEvaluatorFruitWatch(sessionId, metrics);
  if (geminiReport) { geminiReport.score = metrics.focoContinuo; if (geminiReport.ludic) geminiReport.ludic.score = metrics.focoContinuo; }

  if (geminiReport) {
    await saveWithRetry(geminiReport, sessionId, metrics);
  }

  return { metrics, geminiReport };
}
