// src/attentions/selective/games/AcharOFaltando/AcharOFaltandoEvaluationContainer.tsx
import { useEffect, useState } from 'react';
// react-router-dom removed
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import db, { auth } from '../../../../lib/firebase';
import { getSessionById } from '../../../../shared/storage';
import { adaptSessionToAcharOFaltando } from '../../../../assessment/acharOFaltando/adaptSessionToAcharOFaltando';
import { calculateAcharOFaltandoMetrics } from '../../../../assessment/acharOFaltando/calculateAcharOFaltandoMetrics';
import { buildAcharOFaltandoScaleResult } from '../../../../assessment/acharOFaltando/buildAcharOFaltandoScaleResult';
import { useAcharOFaltandoEvaluation } from './useAcharOFaltandoEvaluation';
import type { AcharOFaltandoMetrics, AcharOFaltandoScaleResult } from '../../../../assessment/acharOFaltando/types';
import type { EvaluationReport as GeminiReport } from '../../../../lib/evaluatorClient';
import AcharOFaltandoReportPanel from './AcharOFaltandoReportPanel';

type LoadedState = false | 'organizing' | true;

interface Props {
  sessionId: string;
  onRepeat?: () => void;
}

const RETRYABLE_CODES = new Set(['unavailable', 'permission-denied', 'resource-exhausted']);

async function saveReportToFirestore(
  sessionId: string,
  uid: string,
  report: GeminiReport
): Promise<void> {
  try {
    const ref = doc(db, 'sessionReports', sessionId);
    await setDoc(
      ref,
      {
        uid,
        geminiReport: report,
        sessionId,
        savedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err) {
    if (import.meta.env.DEV) console.warn('[saveReportToFirestore] erro:', err);
  }
}

async function loadReportFromFirestore(
  sessionId: string
): Promise<GeminiReport | null> {
  try {
    const ref = doc(db, 'sessionReports', sessionId);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data();
      if (data?.geminiReport) return data.geminiReport as GeminiReport;
    }
    return null;
  } catch (err: any) {
    if (RETRYABLE_CODES.has(err?.code)) {
      try {
        await new Promise(r => setTimeout(r, 2000));
        const ref = doc(db, 'sessionReports', sessionId);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          if (data?.geminiReport) return data.geminiReport as GeminiReport;
        }
        return null;
      } catch {
        return null;
      }
    }
    return null;
  }
}

export default function AcharOFaltandoEvaluationContainer({ sessionId, onRepeat }: Props) {
  const sessionLog = getSessionById(sessionId);

  const [metrics, setMetrics] = useState<AcharOFaltandoMetrics | null>(null);
  const [scaleResult, setScaleResult] = useState<AcharOFaltandoScaleResult | null>(null);
  const [geminiReport, setGeminiReport] = useState<GeminiReport | undefined>(undefined);

  const [loaded, setLoaded] = useState<LoadedState>(false);

  useEffect(() => {
    if (!sessionId || !sessionLog) return;

    setLoaded(false);
    setGeminiReport(undefined);
    setMetrics(null);
    setScaleResult(null);


    // Pré-calcula as métricas locais e escala instantaneamente para exibição rápida
    const rawRounds = sessionLog.rounds ?? [];
    const results = adaptSessionToAcharOFaltando(rawRounds);
    const elapsed = sessionLog.completedAt && sessionLog.startedAt
      ? (sessionLog.completedAt - sessionLog.startedAt) / 1000
      : 180;
    const localMetrics = calculateAcharOFaltandoMetrics(results, elapsed);
    const localScale = buildAcharOFaltandoScaleResult(localMetrics);

    setMetrics(localMetrics);
    setScaleResult(localScale);

    (async () => {
      try {
        // 1. Tenta carregar do cache do Firestore
        const cached = await loadReportFromFirestore(sessionId);
        if (cached) {
          setGeminiReport(cached);
          try {
            await getDoc(doc(db, 'sessions', sessionId));
            // if (sessionSnap.exists()) { ... }
          } catch (err) {
            console.error('[AcharOFaltandoEvaluationContainer] erro ao carregar docs', err);
          }
          setLoaded(true);
          return;
        }

        // 2. Dispara a orquestração do laudo Gemini
        setLoaded('organizing');
        let result: any = null;
        try {
          result = await useAcharOFaltandoEvaluation(sessionId);
        } catch (err) {
          console.error('[AcharOFaltandoEvaluationContainer] erro hook:', err);
        }

        const uid = auth.currentUser?.uid;
        if (result?.geminiReport && uid) {
          await saveReportToFirestore(sessionId, uid, result.geminiReport);
          setGeminiReport(result.geminiReport);
        } else if (result?.geminiReport) {
          setGeminiReport(result.geminiReport);
        }
      } catch (err) {
        console.error('[AcharOFaltandoEvaluationContainer] erro geral na orquestração:', err);
      } finally {
        setLoaded(true);
      }
    })();
  }, [sessionId]);

  if (!sessionLog) {
    return (
      <div style={{ maxWidth: 920, margin: '0 auto', padding: 16, textAlign: 'center' }}>
        <p style={{ color: '#ffffff' }}>Sessão não encontrada.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 920, margin: '0 auto', padding: 16 }}>
      <AcharOFaltandoReportPanel
        metrics={metrics}
        scaleResult={scaleResult}
        geminiReport={geminiReport}

        loaded={loaded === true}
        onRepeat={onRepeat ?? (() => {})}
        onBack={() => {}}
      />
    </div>
  );
}
