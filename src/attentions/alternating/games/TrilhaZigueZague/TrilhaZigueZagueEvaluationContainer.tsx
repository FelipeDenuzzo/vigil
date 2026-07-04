// src/attentions/alternating/games/TrilhaZigueZague/TrilhaZigueZagueEvaluationContainer.tsx

import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import db from '../../../../lib/firebase';
import { auth } from '../../../../lib/firebase';
import { useTrilhaZigueZagueEvaluation } from './useTrilhaZigueZagueEvaluation';
import { TrilhaZigueZagueResult } from './TrilhaZigueZagueResult';
import type { EvaluationReport as GeminiReport } from '../../../../lib/evaluatorClient';
import type { TrilhaZigueZagueSessionLog } from './types';

type LoadedState = false | 'organizing' | true;

const RETRYABLE_CODES = new Set(['unavailable', 'permission-denied', 'resource-exhausted']);

function sessionStorageKey(sessionId: string) {
  return `vigil:trilha-zigue-zague-log:${sessionId}`;
}

export function persistTrilhaZigueZagueLog(log: TrilhaZigueZagueSessionLog): void {
  try {
    sessionStorage.setItem(sessionStorageKey(log.sessionId), JSON.stringify(log));
  } catch { /* silencioso */ }
}

function loadTrilhaZigueZagueLog(sessionId: string): TrilhaZigueZagueSessionLog | null {
  try {
    const raw = sessionStorage.getItem(sessionStorageKey(sessionId));
    if (!raw) return null;
    return JSON.parse(raw) as TrilhaZigueZagueSessionLog;
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
    if (import.meta.env.DEV) console.warn('[TrilhaZigueZague] Falha ao salvar relatório no Firestore:', err);
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
  sessionLog?: TrilhaZigueZagueSessionLog;
  onRepeat?: () => void;
  onClose?: () => void;
}

export function TrilhaZigueZagueEvaluationContainer({ sessionLog: logProp, onRepeat, onClose }: Props = {}) {
  const [searchParams] = useSearchParams();
  const sessionId = logProp?.sessionId ?? searchParams.get('sessionId') ?? '';

  const [geminiReport, setGeminiReport] = useState<GeminiReport | undefined>(undefined);
  const [loaded, setLoaded]             = useState<LoadedState>(false);

  useEffect(() => {
    if (!sessionId) return;
    setLoaded(false);
    setGeminiReport(undefined);

    (async () => {
      // 1. Cache no Firestore
      const cached = await loadReportFromFirestore(sessionId);
      if (cached) {
        setGeminiReport(cached);
        setLoaded(true);
        return;
      }

      // 2. Resolve o log
      const log = logProp ?? loadTrilhaZigueZagueLog(sessionId);
      if (!log) {
        if (import.meta.env.DEV)
          console.warn('[TrilhaZigueZague] sessionLog não encontrado e sem cache.');
        setLoaded(true);
        return;
      }

      // 3. Chama evaluator
      let result = null;
      try {
        result = await useTrilhaZigueZagueEvaluation(log);
      } catch (err) {
        if (import.meta.env.DEV) console.warn('[TrilhaZigueZague] Erro ao avaliar sessão:', err);
      }

      // 4. IA respondeu
      setLoaded('organizing');

      const uid = auth.currentUser?.uid;
      if (result?.geminiReport && uid) {
        await saveReportToFirestore(sessionId, uid, result.geminiReport);
        setGeminiReport(result.geminiReport);
      }

      setLoaded(true);
    })();
  }, [sessionId, logProp]);

  if (!sessionId) {
    return (
      <div style={{ maxWidth: 920, margin: '0 auto', padding: 16, textAlign: 'center' }}>
        <p style={{ color: '#ffffff' }}>Sessão não encontrada.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 920, margin: '0 auto', padding: 16 }}>
      <TrilhaZigueZagueResult
        geminiReport={geminiReport}
        loaded={loaded}
        onRepeat={onRepeat ?? (() => {})}
        onBackToStart={onClose ?? (() => {})}
      />
    </div>
  );
}

export default TrilhaZigueZagueEvaluationContainer;
