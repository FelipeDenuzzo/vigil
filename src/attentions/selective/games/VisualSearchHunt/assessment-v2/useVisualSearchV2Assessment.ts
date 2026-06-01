/* src/attentions/selective/games/VisualSearchHunt/assessment-v2/useVisualSearchV2Assessment.ts */
/* Hook React para o avaliador V2 */
/* Atualizado em: 01/06/2026 */

import { useCallback, useMemo, useState } from 'react';
import { AssessmentManager, assessmentStorage } from '../../../assessment';
import type {
  VisualSearchV2AssessmentResult,
  VisualSearchV2SessionLog,
} from './visualSearchV2.types';
import { buildVisualSearchV2Result } from './buildVisualSearchV2Result';

const GAME_KEY = 'visual-search-hunt';

export interface UseVisualSearchV2AssessmentResult {
  result: VisualSearchV2AssessmentResult | null;
  error: string | null;
  evaluateSession: (
    sessionLog: VisualSearchV2SessionLog
  ) => VisualSearchV2AssessmentResult | null;
  clearResult: () => void;
  loadStoredResult: (sessionId: string) => VisualSearchV2AssessmentResult | null;
}

export function useVisualSearchV2Assessment(): UseVisualSearchV2AssessmentResult {
  const [result, setResult] = useState<VisualSearchV2AssessmentResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const manager = useMemo(
    () =>
      new AssessmentManager<
        VisualSearchV2SessionLog,
        VisualSearchV2AssessmentResult
      >(buildVisualSearchV2Result),
    []
  );

  const evaluateSession = useCallback(
    (sessionLog: VisualSearchV2SessionLog): VisualSearchV2AssessmentResult | null => {
      try {
        setError(null);

        const nextResult = manager.evaluate(sessionLog);

        // ── Guardar resultado em storage ──
        assessmentStorage.save(nextResult);
        setResult(nextResult);

        return nextResult;
      } catch (evaluationError) {
        const message =
          evaluationError instanceof Error
            ? evaluationError.message
            : 'Não foi possível avaliar a sessão com V2.';

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
    (sessionId: string): VisualSearchV2AssessmentResult | null => {
      const storedRecord = assessmentStorage.getBySessionId(sessionId);

      if (!storedRecord || storedRecord.gameKey !== GAME_KEY) {
        return null;
      }

      const storedResult = storedRecord.result as VisualSearchV2AssessmentResult;

      // ── Verificar se é realmente V2 ──
      if (storedResult.version !== 2) {
        return null;
      }

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
