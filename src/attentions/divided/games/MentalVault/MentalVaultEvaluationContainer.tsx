// src/attentions/divided/games/MentalVault/MentalVaultEvaluationContainer.tsx
import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import db from '../../../../lib/firebase';
import { useMentalVaultEvaluation } from './useMentalVaultEvaluation';
import { MentalVaultEvaluationScreen } from './MentalVaultEvaluationScreen';
import type { EvaluationReport as GeminiReport } from '../../../../lib/evaluatorClient';
import type { RegistroRodada } from './types';

type LoadedState = false | 'organizing' | true;

const RETRYABLE_CODES = new Set(['unavailable', 'permission-denied', 'resource-exhausted']);

async function saveReportToFirestore(sessionId: string, report: GeminiReport): Promise<void> {
  try {
    const ref = doc(db, 'sessionReports', sessionId);
    await setDoc(ref, { geminiReport: report, sessionId, savedAt: serverTimestamp() }, { merge: true });
  } catch (err) {
    console.warn('[MentalVault] Falha ao salvar relatório no Firestore:', err);
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
      } catch (retryErr) {
        console.warn('[MentalVault] Falha ao carregar relatório do Firestore (retry):', retryErr);
        return null;
      }
    }
    console.warn('[MentalVault] Falha ao carregar relatório do Firestore:', err);
    return null;
  }
}

interface Props {
  sessionId?: string;
  startedAt?: string;
  nivelMaximo?: number;
  rodadas?: RegistroRodada[];
}

export function MentalVaultEvaluationContainer({ sessionId: propSessionId, startedAt, nivelMaximo, rodadas }: Props) {
  const [searchParams] = useSearchParams();
  const sessionId = propSessionId ?? searchParams.get('sessionId') ?? '';
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

      // 2️⃣ Precisa dos dados para chamar o evaluator
      if (!rodadas || !startedAt || nivelMaximo === undefined) {
        console.warn('[MentalVault] Dados da sessão não fornecidos e sem cache — sem avaliação.');
        setLoaded(true);
        return;
      }

      // 3️⃣ Chama evaluator
      let result = null;
      try {
        result = await useMentalVaultEvaluation(sessionId, startedAt, nivelMaximo, rodadas);
      } catch (err) {
        console.warn('[MentalVault] Erro ao avaliar sessão:', err);
      }

      // 4️⃣ IA respondeu — organiza + salva
      setLoaded('organizing');

      if (result?.geminiReport) {
        await saveReportToFirestore(sessionId, result.geminiReport);
        setGeminiReport(result.geminiReport);
      }

      setLoaded(true);
    })();
  }, [sessionId]); // eslint-disable-line

  if (!sessionId) {
    return (
      <div style={{ maxWidth: 920, margin: '0 auto', padding: 16, textAlign: 'center' }}>
        <p style={{ color: '#8b8fa8' }}>Sessão não encontrada.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 920, margin: '0 auto', padding: 16 }}>
      <MentalVaultEvaluationScreen
        geminiReport={geminiReport}
        loaded={loaded}
        onRepeat={() => navigate('/treinar/dividida/cofre-mental')}
        onBackToStart={() => navigate('/treinar/dividida')}
      />
    </div>
  );
}

export default MentalVaultEvaluationContainer;
