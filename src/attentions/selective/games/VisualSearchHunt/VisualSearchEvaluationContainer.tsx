import { useSearchParams, useNavigate } from 'react-router-dom';
import { useVisualSearchEvaluation } from './useVisualSearchEvaluation';
import { getSessionById } from '../../../../shared/storage';
import { VisualSearchEvaluationScreen } from './VisualSearchEvaluationScreen';

export function VisualSearchEvaluationContainer() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('sessionId') || '';

  const evaluation = useVisualSearchEvaluation(sessionId);
  const navigate = useNavigate();

  const sessionLog = getSessionById(sessionId);

  if (!evaluation || !sessionLog) {
    return (
      <div style={{ maxWidth: 920, margin: '0 auto', padding: 16, textAlign: 'center' }}>
        <p>Carregando avaliação...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 920, margin: '0 auto', padding: 16 }}>
      <VisualSearchEvaluationScreen
        sessionLog={{
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
            // cliques detalhados para análise de qualidade do erro e posição
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
            // varredura visual
            systematicMoves: round.systematicMoves,
            erraticMoves: round.erraticMoves,
            organizationIndex: round.organizationIndex,
            scanPattern: round.scanPattern,
            // assimetria espacial
            leftSideClicks: round.leftSideClicks,
            rightSideClicks: round.rightSideClicks,
            leftSideTargetMisses: round.leftSideTargetMisses,
            rightSideTargetMisses: round.rightSideTargetMisses,
            spatialAsymmetryIndex: round.spatialAsymmetryIndex,
          })),
        }}
        onRepeatTraining={() => navigate('/treinar/seletiva/visual-search')}
        onBackToStart={() => navigate('/treinar/seletiva')}
      />
    </div>
  );
}

export default VisualSearchEvaluationContainer;
