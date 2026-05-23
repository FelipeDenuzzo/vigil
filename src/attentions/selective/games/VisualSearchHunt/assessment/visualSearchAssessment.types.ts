/* src/attentions/selective/games/VisualSearchHunt/assessment/visualSearchAssessment.types.ts */

import type {
  AssessmentQuestionResult,
  QuestionEvidenceSummary,
  SelectiveAttentionAssessmentResult,
  SelectiveAttentionRoundLog,
  SelectiveAttentionSessionLog,
} from '../../../assessment/assessment.types';

export interface VisualSearchRoundLog extends SelectiveAttentionRoundLog {
  distractorsPresented?: number;
  targetLabel?: string;
  distractorLabel?: string;
}

export interface VisualSearchSessionLog extends SelectiveAttentionSessionLog {
  gameKey: 'visual-search-hunt';
  rounds: VisualSearchRoundLog[];
}

export interface VisualSearchAssessmentQuestionResult
  extends AssessmentQuestionResult {
  id: 'filter-distractors';
  evidence: QuestionEvidenceSummary;
}

export interface VisualSearchAssessmentResult
  extends SelectiveAttentionAssessmentResult {
  gameKey: 'visual-search-hunt';
  questions: VisualSearchAssessmentQuestionResult[];
}

export interface VisualSearchAssessmentThresholds {
  commissionBiasRatio: number;
  omissionBiasRatio: number;
  mildRate: number;
  moderateRate: number;
  highRate: number;
}

export interface VisualSearchAssessmentConfig {
  version: number;
  questionTitle: string;
  thresholds: VisualSearchAssessmentThresholds;
}

export interface VisualSearchAssessmentContext {
  sessionLog: VisualSearchSessionLog;
  config: VisualSearchAssessmentConfig;
}

export interface VisualSearchQuestionEvaluation {
  question: VisualSearchAssessmentQuestionResult;
}

export type VisualSearchAssessmentEvaluator = (
  sessionLog: VisualSearchSessionLog
) => VisualSearchAssessmentResult;