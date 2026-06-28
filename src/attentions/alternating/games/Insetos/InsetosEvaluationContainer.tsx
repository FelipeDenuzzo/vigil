// src/attentions/alternating/games/Insetos/InsetosEvaluationContainer.tsx
// Orquestra avaliação pós-sessão do Insetos — espelha ColorShapeEvaluationContainer.

import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import db from '../../../../lib/firebase';
import { auth } from '../../../../lib/firebase';
import { useInsetosEvaluation } from './useInsetosEvaluation';
import { InsetosResult } from './InsetosResult';
import type { EvaluationReport as GeminiReport } from '../../../../lib/evaluatorClient';
import type { InsetosSessionLog } from './types';

/** false = IA chamando | 'organizing' = IA ok, app montando | true = tudo pronto */
type LoadedState = false | 'organizing' | true;

const RETRYABLE_CODES = new Set(['unavailable', 'permission-denied', 'resource-exhausted']);

function sessionStorageKey(sessionId: string) {
  return `vigil:insetos-log:${sessionId}`;
}

/** Persiste o log no sessionStorage para sobreviver a navegações. */
export function persistInsetosLog(log: InsetosSessionLog): void {
  try {
    sessionStorage.setItem(sessionStorageKey(log.sessionId), JSON.stringify(log));
  } catch { /* silencioso */ }
}

function loadInsetosLog(sessionId: string): InsetosSessionLog | null {
  try {
    const raw = sessionStorage.getItem(sessionStorageKey(sessionId));
    if (!raw) return null;
    return JSON.parse(raw) as InsetosSessionLog;
  } catch {
    return null;
  }
}

async function saveReportToFirestore(
  sessionId: string,
  uid: string,
  report: GeminiReport
): Promise<void> {
  try {
    const ref = doc(db, 'sessionReports', sessionId);
    await setDoc(
      ref,
      { uid, geminiReport: report, sessionId, savedAt: serverTimestamp() },
      { merge: true }
    );
  } catch (err) {
    if (import.meta.env.DEV) console.warn('[Insetos] Falha ao salvar relatório no Firestore:', err);
  }
}

async function loadReportFromFirestore(sessionId: string): Promise<GeminiReport | null> {
  try {
    const ref  = doc(db, 'sessionReports', sessionId);
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
        const ref  = doc(db, 'sessionReports', sessionId);
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

interface Props {
  sessionLog?: InsetosSessionLog;
  onRepeat?: () => void;
  onClose?: () => void;
}

export function InsetosEvaluationContainer({ sessionLog: logProp, onRepeat, onClose }: Props = {}) {
  const [searchParams] = useSearchParams();
  const sessionId = logProp?.sessionId ?? searchParams.get('sessionId') ?? '';

  const [geminiReport, setGeminiReport] = useState<GeminiReport | undefined>(undefined);
  const [loaded, setLoaded]             = useState<LoadedState>(false);

  useEffect(() => {
    if (!sessionId) return;
    setLoaded(false);
    setGeminiReport(undefined);

    (async () => {
      // 1️⃣ Cache no Firestore
      const cached = await loadReportFromFirestore(sessionId);
      if (cached) {
        setGeminiReport(cached);
        setLoaded(true);
        return;
      }

      // 2️⃣ Resolve o log
      const log = logProp ?? loadInsetosLog(sessionId);
      if (!log) {
        if (import.meta.env.DEV)
          console.warn('[Insetos] sessionLog não encontrado e sem cache.');
        setLoaded(true);
        return;
      }

      // 3️⃣ Chama evaluator
      let result = null;
      try {
        result = await useInsetosEvaluation(log);
      } catch (err) {
        if (import.meta.env.DEV) console.warn('[Insetos] Erro ao avaliar sessão:', err);
      }

      // 4️⃣ IA respondeu — organiza + salva
      setLoaded('organizing');

      const uid = auth.currentUser?.uid;
      if (result?.geminiReport && uid) {
        await saveReportToFirestore(sessionId, uid, result.geminiReport);
        setGeminiReport(result.geminiReport);
      }

      setLoaded(true);
    })();
  }, [sessionId]); // eslint-disable-line

  if (!sessionId) {
    return (
      <div style={{ maxWidth: 920, margin: '0 auto', padding: 16, textAlign: 'center' }}>
        <p style={{ color: '#ffffff' }}>Sessão não encontrada.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 920, margin: '0 auto', padding: 16 }}>
      <InsetosResult
        geminiReport={geminiReport}
        loaded={loaded}
        onRepeat={onRepeat ?? (() => {})}
        onBackToStart={onClose ?? (() => {})}
      />
    </div>
  );
}

export default InsetosEvaluationContainer;
