import { useState } from 'react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import db, { auth } from '../../../../lib/firebase';
import { callEvaluator, EvaluatorInput } from '../../../../lib/evaluatorClient';
import { saveReport } from '../../../../lib/saveReport';
import { 
  SalaDeVigiliaRawSession, 
  SalaDeVigiliaMetrics, 
  SalaDeVigiliaScaleResult 
} from '../../../../assessment/salaDeVigilia/types';
import { calculateSalaDeVigiliaMetrics } from '../../../../assessment/salaDeVigilia/calculateSalaDeVigiliaMetrics';
import { buildSalaDeVigiliaScaleResult } from '../../../../assessment/salaDeVigilia/buildSalaDeVigiliaScaleResult';
import { buildSalaDeVigiliaTechnicalReport } from '../../../../assessment/salaDeVigilia/buildSalaDeVigiliaTechnicalReport';

const GAME_ID = 'SalaDeVigilia';

export function useSalaDeVigiliaEvaluation() {
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [report, setReport] = useState<any>(null);
  const [error, setError] = useState<Error | null>(null);

  const evaluate = async (session: SalaDeVigiliaRawSession) => {
    setIsEvaluating(true);
    setError(null);

    try {
      // 1. Calculate metrics
      const metrics: SalaDeVigiliaMetrics = calculateSalaDeVigiliaMetrics(session);
      
      // 2. Get scale results (severity & score)
      const scaleResult: SalaDeVigiliaScaleResult = buildSalaDeVigiliaScaleResult(metrics);
      
      // 3. Prepare payload for Gemini (backend)
      const technicalReport = buildSalaDeVigiliaTechnicalReport(session.durationMs, metrics, scaleResult);

      // Save initial score locally
      try {
        const uid = auth?.currentUser?.uid;
        if (uid) {
          await setDoc(doc(db, 'sessions', session.sessionId), {
            uid,
            sessionId: session.sessionId,
            game: GAME_ID,
            attentionType: 'sustentada',
            score: scaleResult.score,
            level: scaleResult.level,
            createdAt: serverTimestamp(),
          }, { merge: true });
        }
      } catch (err) {
        console.warn('[useSalaDeVigiliaEvaluation] erro ao salvar score local:', err);
      }

      // Format input for callEvaluator (which expects { sessionId, evaluatorInput })
      const evaluatorInput: EvaluatorInput = {
        sessionId: session.sessionId,
        ...technicalReport // technicalReport já tem attentionType, game, durationMs, metrics, scales, e severity
      };

      let geminiReport = null;
      try {
        // Assume callEvaluator is standard
        geminiReport = await callEvaluator(evaluatorInput);
      } catch (e) {
        console.warn('Backend indisponível:', e);
      }

      if (geminiReport) {
        try {
          await saveReport(geminiReport, evaluatorInput);
        } catch (e) {
          console.warn('[useSalaDeVigiliaEvaluation] falha ao fazer saveReport:', e);
        }
      }

      setReport({
        session,
        metrics,
        scaleResult,
        geminiReport
      });

    } catch (e: any) {
      console.error(e);
      setError(e);
    } finally {
      setIsEvaluating(false);
    }
  };

  return { evaluate, report, isEvaluating, error };
}
