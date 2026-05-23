import { useSearchParams } from 'react-router-dom';
import { useVisualSearchEvaluation } from './useVisualSearchEvaluation';
import { VisualSearchEvaluationScreen } from './game/VisualSearchEvaluationScreen';

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

  if (!evaluation) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <p>Carregando avaliação...</p>
      </div>
    );
  }

  if (!evaluation.scaleResult || !evaluation.technicalReport) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <p>Dados de avaliação indisponíveis.</p>
      </div>
    );
  }

  return (
    <VisualSearchEvaluationScreen
      scaleResult={evaluation.scaleResult}
      technicalReport={evaluation.technicalReport}
    />
  );
}

export default VisualSearchEvaluationContainer;
