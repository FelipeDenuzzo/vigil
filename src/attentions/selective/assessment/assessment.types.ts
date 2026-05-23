/* src/attentions/selective/assessment/assessment.types.ts */

export type AssessmentQuestionId =
  | 'filter-distractors';

export type AssessmentBias =
  | 'adequado'
  | 'omissao'
  | 'comissao'
  | 'misto';

export type AssessmentSeverity =
  | 'ausente'
  | 'leve'
  | 'moderado'
  | 'elevado';

export interface SelectiveAttentionRoundLog {
  round: number;
  targetsPresented: number;
  hits: number;
  errors: number;
  missedTargets: number;
  timeMs?: number;
  startedAt?: string;
  finishedAt?: string;
}

export interface SelectiveAttentionSessionLog {
  gameKey: string;
  sessionId: string;
  userId?: string;
  startedAt: string;
  finishedAt: string;
  rounds: SelectiveAttentionRoundLog[];
}

export interface RoundAssessmentMetrics {
  round: number;
  omissionRate: number;
  commissionRateProxy: number;
  accuracyRate: number;
  bias: AssessmentBias;
}

export interface QuestionEvidenceSummary {
  totalTargets: number;
  totalHits: number;
  totalErrors: number;
  totalMissedTargets: number;
  omissionRate: number;
  commissionRateProxy: number;
  accuracyRate: number;
  predominantBias: AssessmentBias;
  rounds: RoundAssessmentMetrics[];
}

export interface AssessmentQuestionResult {
  id: AssessmentQuestionId;
  title: string;
  answered: boolean;
  answer: 'sim' | 'nao' | 'parcial';
  severity: AssessmentSeverity;
  bias: AssessmentBias;
  confidence: number;
  summary: string;
  clinicalMeaning: string;
  evidence: QuestionEvidenceSummary;
}

export interface SelectiveAttentionAssessmentResult {
  gameKey: string;
  sessionId: string;
  createdAt: string;
  version: number;
  questions: AssessmentQuestionResult[];
}

export interface StoredAssessmentRecord {
  sessionId: string;
  gameKey: string;
  createdAt: string;
  result: SelectiveAttentionAssessmentResult;
}

export function safeDivide(value: number, total: number): number {
  if (!total || total <= 0) return 0;
  return value / total;
}

export function clampConfidence(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

export function classifyAssessmentBias(
  errors: number,
  missedTargets: number
): AssessmentBias {
  if (errors === 0 && missedTargets === 0) {
    return 'adequado';
  }

  if (errors >= missedTargets * 1.5) {
    return 'comissao';
  }

  if (missedTargets >= errors * 1.5) {
    return 'omissao';
  }

  return 'misto';
}

export function classifyAssessmentSeverity(
  omissionRate: number,
  commissionRateProxy: number
): AssessmentSeverity {
  const criticalRate = Math.max(omissionRate, commissionRateProxy);

  if (criticalRate >= 0.4) return 'elevado';
  if (criticalRate >= 0.25) return 'moderado';
  if (criticalRate >= 0.1) return 'leve';

  return 'ausente';
}