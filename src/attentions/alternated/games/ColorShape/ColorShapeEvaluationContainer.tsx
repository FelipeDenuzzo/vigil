// src/attentions/alternated/games/ColorShape/ColorShapeEvaluationContainer.tsx
// Orquestra avaliação pós-sessão do ColorShape — espelha VisualSearchEvaluationContainer.

import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import db from '../../../../lib/firebase';
import { auth } from '../../../../lib/firebase';
import { useColorShapeEvaluation } from './useColorShapeEvaluation';
import { ColorShapeEvaluationScreen } from './ColorShapeEvaluationScreen';
import type { EvaluationReport as GeminiReport } from '../../../../lib/evaluatorClient';
import type { ColorShapeSessionLog } from './types';

/** false = IA chamando | 'organizing' = IA ok, app montando | true = tudo pronto */
type LoadedState = false | 'organizing' | true;

const RETRYABLE_CODES = new Set(['unavailable', 'permission-denied', 'resource-exhausted']);

// Chave usada para persistir o log temporariamente no sessionStorage
function sessionStorageKey(sessionId: string) {
  return `vigil:cs-log:${sessionId}`;
}

/** Persiste o log no sessionStorage para sobreviver a navegações dentro da mesma aba. */
export function persistColorShapeLog(log: ColorShapeSessionLog): void {
  try {
    sessionStorage.setItem(sessionStorageKey(log.sessionId), JSON.stringify(log));
  } catch { /* silencioso — sessionStorage indisponível */ }
}

/** Recupera o log do sessionStorage (retorna null se não existir). */
function loadColorShapeLog(sessionId: string): ColorShapeSessionLog | null {
  try {
    const raw = sessionStorage.getItem(sessionStorageKey(sessionId));
    if (!raw) return null;
    return JSON.parse(raw) as ColorShapeSessionLog;
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
      {
        uid,                      // ← obrigatório para as Security Rules
        geminiReport: report,
        sessionId,
        savedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err) {
    if (import.meta.env.DEV) console.warn('[ColorShape] Falha ao salvar relatório no Firestore:', err);
  }
}

async function loadReportFromFirestore(sessionId: string): Promise<GeminiReport | null> {
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

interface Props {
  /** Passa o log diretamente quando vindo do jogo inline */
  sessionLog?: ColorShapeSessionLog;
  onRepeat?: () => void;
  onClose?: () => void;
}

export function ColorShapeEvaluationContainer({ sessionLog: logProp, onRepeat, onClose }: Props = {}) {
  const [searchParams] = useSearchParams();
  const sessionId = logProp?.sessionId ?? searchParams.get('sessionId') ?? '';
  const navigate = useNavigate();

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

      // 2️⃣ Resolve o log: prop direto > sessionStorage (rota /resultado após refresh)
      const log = logProp ?? loadColorShapeLog(sessionId);
      if (!log) {
        if (import.meta.env.DEV)
          console.warn('[ColorShape] sessionLog não encontrado e sem cache — sem avaliação.');
        setLoaded(true);
        return;
      }

      // 3️⃣ Chama evaluator
      let result = null;
      try {
        result = await useColorShapeEvaluation(log);
      } catch (err) {
        if (import.meta.env.DEV) console.warn('[ColorShape] Erro ao avaliar sessão:', err);
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
      <ColorShapeEvaluationScreen
        geminiReport={geminiReport}
        loaded={loaded}
        onRepeat={onRepeat ?? (() => navigate('/treinar/alternada/color-shape'))}
        onBackToStart={onClose ?? (() => navigate('/treinar/alternada'))}
      />
    </div>
  );
}

export default ColorShapeEvaluationContainer;
