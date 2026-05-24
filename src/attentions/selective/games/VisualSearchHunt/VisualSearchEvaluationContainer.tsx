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
          })),
        }}
        onRepeatTraining={() => navigate('/treinar/seletiva/visual-search')}
        onBackToStart={() => navigate('/treinar/seletiva')}
      />
    </div>
  );
}

export default VisualSearchEvaluationContainer;
