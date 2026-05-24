/* src/attentions/selective/games/VisualSearchHunt/assessment/useVisualSearchAssessment.ts */
/* Atualizado em: 24/05/2026 às 15:25 (BRT) */

import { useCallback, useMemo, useState } from 'react';
import {
  AssessmentManager,
  assessmentStorage,
} from '../../../assessment';
import type {
  VisualSearchAssessmentResult,
  VisualSearchSessionLog,
} from './visualSearchAssessment.types';
import { evaluateVisualSearchAssessment } from './visualSearchAssessment';

const GAME_KEY = 'visual-search-hunt';

export interface UseVisualSearchAssessmentResult {
  result: VisualSearchAssessmentResult | null;
  error: string | null;
  evaluateSession: (
    sessionLog: VisualSearchSessionLog
  ) => VisualSearchAssessmentResult | null;
  clearResult: () => void;
  loadStoredResult: (sessionId: string) => VisualSearchAssessmentResult | null;
}

export function useVisualSearchAssessment(): UseVisualSearchAssessmentResult {
  const [result, setResult] = useState<VisualSearchAssessmentResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const manager = useMemo(
    () =>
      new AssessmentManager<
        VisualSearchSessionLog,
        VisualSearchAssessmentResult
      >(evaluateVisualSearchAssessment),
    []
  );

  const evaluateSession = useCallback(
    (sessionLog: VisualSearchSessionLog): VisualSearchAssessmentResult | null => {
      try {
        setError(null);

        const nextResult = manager.evaluate(sessionLog);

        assessmentStorage.save(nextResult);
        setResult(nextResult);

        return nextResult;
      } catch (evaluationError) {
        const message =
          evaluationError instanceof Error
            ? evaluationError.message
            : 'Não foi possível avaliar a sessão.';

        setError(message);
        return null;
      }
    },
    [manager]
  );

  const clearResult = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  const loadStoredResult = useCallback(
    (sessionId: string): VisualSearchAssessmentResult | null => {
      const storedRecord = assessmentStorage.getBySessionId(sessionId);

      if (!storedRecord || storedRecord.gameKey !== GAME_KEY) {
        return null;
      }

      const storedResult = storedRecord.result as VisualSearchAssessmentResult;

      setResult(storedResult);
      setError(null);

      return storedResult;
    },
    []
  );

  return {
    result,
    error,
    evaluateSession,
    clearResult,
    loadStoredResult,
  };
}
