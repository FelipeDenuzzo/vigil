// src/attentions/selective/games/VisualSearchHunt/VisualSearchEvaluationContainer.tsx
// Atualizado: estado de loading em 3 fases + salvamento do geminiReport no Firestore.

import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import db from '../../../../lib/firebase';
import { useVisualSearchEvaluation } from './useVisualSearchEvaluation';
import type { EvaluationReport as InternalReport } from './useVisualSearchEvaluation';
import { getSessionById } from '../../../../shared/storage';
import { VisualSearchEvaluationScreen } from './VisualSearchEvaluationScreen';
import type { EvaluationReport as GeminiReport } from '../../../../lib/evaluatorClient';

/** false = IA chamando | 'organizing' = IA ok, app montando | true = tudo pronto */
type LoadedState = false | 'organizing' | true;

async function saveReportToFirestore(
  sessionId: string,
  report: GeminiReport
): Promise<void> {
  try {
    const ref = doc(db, 'sessionReports', sessionId);
    await setDoc(
      ref,
      {
        geminiReport: report,
        sessionId,
        savedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('Falha ao salvar relatório no Firestore:', err);
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
    // Se o cliente ainda não estabeleceu conexão, aguarda 2s e tenta uma vez mais
    if (err?.code === 'unavailable') {
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
        console.warn('Falha ao carregar relatório do Firestore (retry):', retryErr);
        return null;
      }
    }
    console.warn('Falha ao carregar relatório do Firestore:', err);
    return null;
  }
}

export function VisualSearchEvaluationContainer() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('sessionId') || '';
  const navigate = useNavigate();
  const sessionLog = getSessionById(sessionId);

  const [evaluation, setEvaluation] = useState<InternalReport | null>(null);
  const [geminiReport, setGeminiReport] = useState<GeminiReport | undefined>(undefined);
  const [loaded, setLoaded] = useState<LoadedState>(false);

  useEffect(() => {
    if (!sessionId) return;

    setLoaded(false);
    setGeminiReport(undefined);
    setEvaluation(null);

    (async () => {
      // 1️⃣ Verifica cache no Firestore (resultado permanente)
      const cached = await loadReportFromFirestore(sessionId);
      if (cached) {
        setGeminiReport(cached);
        setLoaded(true);
        return;
      }

      // 2️⃣ Sem cache — chama Gemini (fase 1: IA analisando)
      let result: InternalReport | null = null;
      try {
        result = await useVisualSearchEvaluation(sessionId);
      } catch (err) {
        console.warn('Erro ao avaliar sessão:', err);
      }

      setEvaluation(result);

      // 3️⃣ IA respondeu — fase 2: App organizando + salva no Firestore
      setLoaded('organizing');

      if (result?.geminiReport) {
        await saveReportToFirestore(sessionId, result.geminiReport);
        setGeminiReport(result.geminiReport);
      }

      setLoaded(true);
    })();
  }, [sessionId]);

  if (!sessionLog) {
    return (
      <div style={{ maxWidth: 920, margin: '0 auto', padding: 16, textAlign: 'center' }}>
        <p style={{ color: '#8b8fa8' }}>Sessão não encontrada.</p>
      </div>
    );
  }

  const sessionLogMapped = {
    sessionId: sessionLog.sessionId,
    gameId: sessionLog.gameId,
    startedAt: sessionLog.startedAt ? new Date(sessionLog.startedAt).toISOString() : undefined,
    completedAt: sessionLog.completedAt ? new Date(sessionLog.completedAt).toISOString() : undefined,
    rounds: (sessionLog.rounds ?? []).map((round: any, idx: number) => ({
      round: idx + 1,
      totalTargets: round.totalTargets ?? 0,
      hits: round.hits ?? 0,
      errors: round.errors ?? 0,
      missedTargets: round.missedTargets ?? 0,
      durationMs: round.durationMs,
      reactionTimes: round.reactionTimes,
      gridSize: round.gridSize,
      clicks: Array.isArray(round.clicks)
        ? round.clicks.map((c: any) => ({
            isTarget: c.isTarget ?? false,
            clickedShape: c.clickedShape ?? '',
            clickedColor: c.clickedColor ?? '',
            targetShape: c.targetShape ?? '',
            targetColor: c.targetColor ?? '',
            row: c.row ?? 0,
            col: c.col ?? 0,
            screenHalf: c.screenHalf ?? 'left',
          }))
        : undefined,
      systematicMoves: round.systematicMoves,
      erraticMoves: round.erraticMoves,
      organizationIndex: round.organizationIndex,
      scanPattern: round.scanPattern,
      leftSideClicks: round.leftSideClicks,
      rightSideClicks: round.rightSideClicks,
      leftSideTargetMisses: round.leftSideTargetMisses,
      rightSideTargetMisses: round.rightSideTargetMisses,
      spatialAsymmetryIndex: round.spatialAsymmetryIndex,
    })),
  };

  return (
    <div style={{ maxWidth: 920, margin: '0 auto', padding: 16 }}>
      <VisualSearchEvaluationScreen
        sessionLog={sessionLogMapped}
        geminiReport={geminiReport ?? evaluation?.geminiReport}
        loaded={loaded}
        onRepeatTraining={() => navigate('/treinar/seletiva/visual-search')}
        onBackToStart={() => navigate('/treinar/seletiva')}
      />
    </div>
  );
}

export default VisualSearchEvaluationContainer;
