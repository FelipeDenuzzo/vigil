// src/attentions/selective/games/AcharOFaltando/AcharOFaltandoEvaluationContainer.tsx
import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import db, { auth } from '../../../../lib/firebase';
import { getSessionById } from '../../../../shared/storage';
import { computeMetrics } from './logic';
import type { MissingItemRoundResult, MissingItemSessionMetrics } from './types';
import AcharOFaltandoReportPanel from './AcharOFaltandoReportPanel';

const RETRYABLE_CODES = new Set(['unavailable', 'permission-denied', 'resource-exhausted']);

async function saveReport(sessionId: string, uid: string, metrics: MissingItemSessionMetrics) {
  try {
    await setDoc(
      doc(db, 'sessionReports', sessionId),
      { uid, metrics, sessionId, savedAt: serverTimestamp() },
      { merge: true },
    );
  } catch (err) {
    if (import.meta.env.DEV) console.warn('[AcharOFaltando] save error:', err);
  }
}

async function loadReport(sessionId: string): Promise<MissingItemSessionMetrics | null> {
  const tryLoad = async () => {
    const snap = await getDoc(doc(db, 'sessionReports', sessionId));
    if (snap.exists() && snap.data()?.metrics) return snap.data()!.metrics as MissingItemSessionMetrics;
    return null;
  };
  try {
    return await tryLoad();
  } catch (err: any) {
    if (RETRYABLE_CODES.has(err?.code)) {
      try { await new Promise(r => setTimeout(r, 2000)); return await tryLoad(); } catch { return null; }
    }
    return null;
  }
}

export default function AcharOFaltandoEvaluationContainer() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('sessionId') || '';
  const navigate = useNavigate();
  const sessionLog = getSessionById(sessionId);

  const [metrics, setMetrics] = useState<MissingItemSessionMetrics | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!sessionId) return;
    setLoaded(false);
    setMetrics(null);
    (async () => {
      const cached = await loadReport(sessionId);
      if (cached) { setMetrics(cached); setLoaded(true); return; }

      if (sessionLog) {
        const results = (sessionLog.rounds ?? []) as MissingItemRoundResult[];
        const elapsed = sessionLog.completedAt && sessionLog.startedAt
          ? (sessionLog.completedAt - sessionLog.startedAt) / 1000
          : 180;
        const m = computeMetrics(results, elapsed);
        setMetrics(m);
        const uid = auth.currentUser?.uid;
        if (uid) await saveReport(sessionId, uid, m);
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
        loaded={loaded}
        onRepeat={() => navigate('/treinar/seletiva/achar-o-faltando')}
        onBack={() => navigate('/treinar/seletiva')}
      />
    </div>
  );
}
