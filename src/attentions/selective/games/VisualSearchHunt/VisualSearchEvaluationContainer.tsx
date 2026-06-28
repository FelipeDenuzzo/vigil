// src/attentions/selective/games/VisualSearchHunt/VisualSearchEvaluationContainer.tsx

import { useEffect, useState } from 'react';
// react-router-dom removed
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import db from '../../../../lib/firebase';
import { auth } from '../../../../lib/firebase';
import { useVisualSearchEvaluation } from './useVisualSearchEvaluation';
import type { EvaluationReport as InternalReport } from './useVisualSearchEvaluation';
import { getSessionById } from '../../../../shared/storage';
import { VisualSearchEvaluationScreen } from './VisualSearchEvaluationScreen';
import type { EvaluationReport as GeminiReport } from '../../../../lib/evaluatorClient';

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
        uid,                     // ← obrigatório para as Security Rules
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

export function VisualSearchEvaluationContainer({ sessionId, onRepeat }: Props) {
  const sessionLog = getSessionById(sessionId);

  const [evaluation,   setEvaluation]   = useState<InternalReport | null>(null);
  const [geminiReport, setGeminiReport] = useState<GeminiReport | undefined>(undefined);
  const [loaded,       setLoaded]       = useState<LoadedState>(false);

  useEffect(() => {
    if (!sessionId) return;

    setLoaded(false);
    setGeminiReport(undefined);
    setEvaluation(null);

    (async () => {
      const cached = await loadReportFromFirestore(sessionId);
      if (cached) {
        setGeminiReport(cached);
        setLoaded(true);
        return;
      }

      let result: InternalReport | null = null;
      try {
        result = await useVisualSearchEvaluation(sessionId);
      } catch {
        // silencioso em produção
      }

      setEvaluation(result);
      setLoaded('organizing');

      const uid = auth.currentUser?.uid;
      if (result?.geminiReport && uid) {
        await saveReportToFirestore(sessionId, uid, result.geminiReport);
        setGeminiReport(result.geminiReport);
      }

      setLoaded(true);
    })();
  }, [sessionId]);

  if (!sessionLog) {
    return (
      <div style={{ maxWidth: 920, margin: '0 auto', padding: 16, textAlign: 'center' }}>
        <p style={{ color: '#ffffff' }}>Sessão não encontrada.</p>
      </div>
    );
  }

  const sessionLogMapped = {
    sessionId: sessionLog.sessionId,
    gameId: sessionLog.gameId,
    startedAt:   sessionLog.startedAt   ? new Date(sessionLog.startedAt).toISOString()   : undefined,
    completedAt: sessionLog.completedAt ? new Date(sessionLog.completedAt).toISOString() : undefined,
    rounds: (sessionLog.rounds ?? []).map((round: any, idx: number) => ({
      round: idx + 1,
      totalTargets: round.totalTargets ?? 0,
      hits:         round.hits         ?? 0,
      errors:       round.errors       ?? 0,
      missedTargets:round.missedTargets ?? 0,
      durationMs:   round.durationMs,
      reactionTimes:round.reactionTimes,
      gridSize:     round.gridSize,
      clicks: Array.isArray(round.clicks)
        ? round.clicks.map((c: any) => ({
            isTarget:     c.isTarget     ?? false,
            clickedShape: c.clickedShape ?? '',
            clickedColor: c.clickedColor ?? '',
            targetShape:  c.targetShape  ?? '',
            targetColor:  c.targetColor  ?? '',
            row:          c.row          ?? 0,
            col:          c.col          ?? 0,
            screenHalf:   c.screenHalf   ?? 'left',
          }))
        : undefined,
      systematicMoves:       round.systematicMoves,
      erraticMoves:          round.erraticMoves,
      organizationIndex:     round.organizationIndex,
      scanPattern:           round.scanPattern,
      leftSideClicks:        round.leftSideClicks,
      rightSideClicks:       round.rightSideClicks,
      leftSideTargetMisses:  round.leftSideTargetMisses,
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
        onRepeatTraining={onRepeat ?? (() => {})}
        onBackToStart={() => {}}
      />
    </div>
  );
}

export default VisualSearchEvaluationContainer;
