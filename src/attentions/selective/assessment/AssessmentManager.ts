/* src/attentions/selective/assessment/AssessmentManager.ts */

import type {
  SelectiveAttentionAssessmentResult,
  SelectiveAttentionSessionLog,
} from './assessment.types';

export type SelectiveAssessmentEvaluator<
  TSessionLog extends SelectiveAttentionSessionLog,
  TResult extends SelectiveAttentionAssessmentResult,
> = (sessionLog: TSessionLog) => TResult;

export class AssessmentManager<
  TSessionLog extends SelectiveAttentionSessionLog,
  TResult extends SelectiveAttentionAssessmentResult,
> {
  private readonly evaluator: SelectiveAssessmentEvaluator<TSessionLog, TResult>;

  constructor(
    evaluator: SelectiveAssessmentEvaluator<TSessionLog, TResult>
  ) {
    this.evaluator = evaluator;
  }

  evaluate(sessionLog: TSessionLog): TResult {
    this.validateSessionLog(sessionLog);

    return this.evaluator(sessionLog);
  }

  private validateSessionLog(sessionLog: TSessionLog): void {
    if (!sessionLog) {
      throw new Error('O log da sessão é obrigatório para a avaliação.');
    }

    if (!sessionLog.gameKey) {
      throw new Error('O campo "gameKey" é obrigatório no log da sessão.');
    }

    if (!sessionLog.sessionId) {
      throw new Error('O campo "sessionId" é obrigatório no log da sessão.');
    }

    if (!sessionLog.startedAt || !sessionLog.finishedAt) {
      throw new Error(
        'Os campos "startedAt" e "finishedAt" são obrigatórios no log da sessão.'
      );
    }

    if (!Array.isArray(sessionLog.rounds)) {
      throw new Error('O campo "rounds" deve ser uma lista de rodadas.');
    }

    if (sessionLog.rounds.length === 0) {
      throw new Error(
        'A avaliação precisa de pelo menos uma rodada registrada.'
      );
    }
  }
}