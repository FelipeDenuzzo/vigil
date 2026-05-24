import { useSearchParams, useNavigate } from 'react-router-dom';
import { useVisualSearchEvaluation } from './useVisualSearchEvaluation';
import { getSessionById } from '../../../../shared/storage';
import { VisualSearchEvaluationScreen } from './VisualSearchEvaluationScreen';

/**
 * Container que gerencia o fluxo de avaliação:
 * 1. Obtém o sessionId dos params
 * 2. Chama o hook para calcular scaleResult e technicalReport
 * 3. Passa os dados para o componente de renderização
 */
export function VisualSearchEvaluationContainer() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('sessionId') || '';

  const evaluation = useVisualSearchEvaluation(sessionId);
  const navigate = useNavigate();

  const sessionLog = getSessionById(sessionId);

  if (!evaluation || !sessionLog) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <p>Carregando avaliação...</p>
      </div>
    );
  }
  return (
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
  );
}

export default VisualSearchEvaluationContainer;
