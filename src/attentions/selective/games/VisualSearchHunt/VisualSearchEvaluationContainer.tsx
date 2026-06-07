// src/attentions/selective/games/VisualSearchHunt/VisualSearchEvaluationContainer.tsx
// fix: passa prop `loaded` ao Screen para distinguir carregando / erro / sucesso.

import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useVisualSearchEvaluation } from './useVisualSearchEvaluation';
import type { EvaluationReport as InternalReport } from './useVisualSearchEvaluation';
import { getSessionById } from '../../../../shared/storage';
import { VisualSearchEvaluationScreen } from './VisualSearchEvaluationScreen';

export function VisualSearchEvaluationContainer() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('sessionId') || '';
  const navigate = useNavigate();
  const sessionLog = getSessionById(sessionId);

  const [evaluation, setEvaluation] = useState<InternalReport | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!sessionId) return;
    setLoaded(false);
    useVisualSearchEvaluation(sessionId)
      .then((result) => {
        setEvaluation(result);
      })
      .catch((err) => {
        console.warn('Erro ao avaliar sessão:', err);
        setEvaluation(null);
      })
      .finally(() => setLoaded(true));
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
        geminiReport={evaluation?.geminiReport ?? undefined}
        loaded={loaded}
        onRepeatTraining={() => navigate('/treinar/seletiva/visual-search')}
        onBackToStart={() => navigate('/treinar/seletiva')}
      />
    </div>
  );
}

export default VisualSearchEvaluationContainer;
