/* src/attentions/selective/games/VisualSearchHunt/game/VisualSearchEvaluationScreen.tsx */

import { useMemo } from 'react';
import { evaluateVisualSearchAssessment } from '../assessment/visualSearchAssessment';
import type { VisualSearchSessionLog } from '../assessment/visualSearchAssessment.types';

const mockSessionLog: VisualSearchSessionLog = {
  gameKey: 'visual-search-hunt',
  sessionId: 'visual-search-test-session-001',
  startedAt: '2026-05-23T09:00:00.000Z',
  finishedAt: '2026-05-23T09:05:00.000Z',
  rounds: [
    {
      round: 1,
      targetsPresented: 10,
      hits: 8,
      errors: 4,
      missedTargets: 2,
      timeMs: 28000,
    },
    {
      round: 2,
      targetsPresented: 10,
      hits: 7,
      errors: 5,
      missedTargets: 3,
      timeMs: 31000,
    },
    {
      round: 3,
      targetsPresented: 10,
      hits: 9,
      errors: 2,
      missedTargets: 1,
      timeMs: 26000,
    },
  ],
};

export function VisualSearchEvaluationScreen(): JSX.Element {
  const result = useMemo(() => {
    return evaluateVisualSearchAssessment(mockSessionLog);
  }, []);

  const question = result.questions[0];

  return (
    <div style={{ padding: 16 }}>
      <h1>Avaliação do Visual Search Hunt</h1>

      <p>
        <strong>Pergunta:</strong> {question.title}
      </p>

      <p>
        <strong>Resposta:</strong> {question.answer}
      </p>

      <p>
        <strong>Viés predominante:</strong> {question.bias}
      </p>

      <p>
        <strong>Gravidade:</strong> {question.severity}
      </p>

      <p>
        <strong>Resumo:</strong> {question.summary}
      </p>

      <p>
        <strong>Interpretação:</strong> {question.clinicalMeaning}
      </p>

      <hr />

      <h2>Evidências</h2>

      <ul>
        <li>Total de alvos: {question.evidence.totalTargets}</li>
        <li>Total de acertos: {question.evidence.totalHits}</li>
        <li>Total de erros: {question.evidence.totalErrors}</li>
        <li>Total de omissões: {question.evidence.totalMissedTargets}</li>
        <li>Taxa de omissão: {question.evidence.omissionRate.toFixed(2)}</li>
        <li>
          Taxa de comissão: {question.evidence.commissionRateProxy.toFixed(2)}
        </li>
        <li>Taxa de acurácia: {question.evidence.accuracyRate.toFixed(2)}</li>
      </ul>

      <h2>Rodadas</h2>

      <ul>
        {question.evidence.rounds.map((round) => (
          <li key={round.round}>
            Rodada {round.round}: viés {round.bias}, omissão{' '}
            {round.omissionRate.toFixed(2)}, comissão{' '}
            {round.commissionRateProxy.toFixed(2)}, acurácia{' '}
            {round.accuracyRate.toFixed(2)}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default VisualSearchEvaluationScreen;