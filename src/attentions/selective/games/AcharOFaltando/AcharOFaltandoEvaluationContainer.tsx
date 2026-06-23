// src/attentions/selective/games/AcharOFaltando/AcharOFaltandoEvaluationContainer.tsx
import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
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

export default function AcharOFaltandoEvaluationContainer() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('sessionId') || '';
  const navigate = useNavigate();
  const sessionLog = getSessionById(sessionId);

  const [metrics, setMetrics] = useState<AcharOFaltandoMetrics | null>(null);
  const [scaleResult, setScaleResult] = useState<AcharOFaltandoScaleResult | null>(null);
  const [geminiReport, setGeminiReport] = useState<GeminiReport | undefined>(undefined);
  const [reportUrl, setReportUrl] = useState<string | null>(null);
  const [loaded, setLoaded] = useState<LoadedState>(false);

  useEffect(() => {
    if (!sessionId || !sessionLog) return;

    setLoaded(false);
    setGeminiReport(undefined);
    setMetrics(null);
    setScaleResult(null);
    setReportUrl(null);

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
      // 1. Tenta carregar do cache do Firestore
      const cached = await loadReportFromFirestore(sessionId);
      if (cached) {
        setGeminiReport(cached);
        const sessionSnap = await getDoc(doc(db, 'sessions', sessionId));
        if (sessionSnap.exists()) {
          setReportUrl(sessionSnap.data()?.reportUrl || null);
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

      // Carrega o reportUrl após a gravação
      const sessionSnap = await getDoc(doc(db, 'sessions', sessionId));
      if (sessionSnap.exists()) {
        setReportUrl(sessionSnap.data()?.reportUrl || null);
      }

      setLoaded(true);
    })();
  }, [sessionId]);

  if (!sessionLog) {
    return (
      <div style={{ maxWidth: 920, margin: '0 auto', padding: 16, textAlign: 'center' }}>
        <p style={{ color: 'var(--color-text-muted)' }}>Sessão não encontrada.</p>
        <button onClick={() => navigate('/treinar/seletiva')} style={{ marginTop: 16, cursor: 'pointer' }}>Voltar</button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 920, margin: '0 auto', padding: 16 }}>
      <AcharOFaltandoReportPanel
        metrics={metrics}
        scaleResult={scaleResult}
        geminiReport={geminiReport}
        reportUrl={reportUrl}
        loaded={loaded === true}
        onRepeat={() => navigate('/treinar/seletiva/achar-o-faltando')}
        onBack={() => navigate('/treinar/seletiva')}
      />
    </div>
  );
}
