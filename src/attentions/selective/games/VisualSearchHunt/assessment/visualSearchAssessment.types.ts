/* src/attentions/selective/games/VisualSearchHunt/assessment/visualSearchAssessment.types.ts */

import type {
  AssessmentBias,
  AssessmentSeverity,
  QuestionEvidenceSummary,
} from '../../../assessment/assessment.types';

export type VisualSearchRoundLog = {
  round: number;
  level: number;
  targetsPresented: number;
  hits: number;
  errors: number;
  missedTargets: number;
  durationMs?: number;
  reactionTimes?: number[];
};

export type VisualSearchSessionLog = {
  sessionId: string;
  rounds: VisualSearchRoundLog[];
};

export type VisualSearchAssessmentQuestionResult = {
  id: string;
  title: string;
  answered: boolean;
  answer: 'sim' | 'nao' | 'parcial';
  severity: AssessmentSeverity;
  bias: AssessmentBias;
  confidence: number;
  summary: string;
  clinicalMeaning: string;
  evidence: QuestionEvidenceSummary;
};

export type VisualSearchAssessmentGraphPoint = {
  round: number;
  score: number;
  hits: number;
  errors: number;
  missedTargets: number;
  targetsPresented: number;
  omissionRate: number;
  commissionRateProxy: number;
  bias: 'omissao' | 'comissao' | 'misto' | 'adequado';
};

export type VisualSearchAssessmentResult = {
  gameKey: string;
  sessionId: string;
  createdAt: string;
  version: number;
  questions: VisualSearchAssessmentQuestionResult[];
  graphSeries: VisualSearchAssessmentGraphPoint[];
};