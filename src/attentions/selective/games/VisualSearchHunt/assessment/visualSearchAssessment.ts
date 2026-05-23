/* src/attentions/selective/games/VisualSearchHunt/assessment/visualSearchAssessment.ts */

import {
  clampConfidence,
  classifyAssessmentBias,
  classifyAssessmentSeverity,
  safeDivide,
} from '../../../assessment/assessment.types';
import type {
  AssessmentBias,
  AssessmentSeverity,
  QuestionEvidenceSummary,
  RoundAssessmentMetrics,
} from '../../../assessment/assessment.types';
import { visualSearchAssessmentConfig } from './visualSearchAssessment.config';
import type {
  VisualSearchAssessmentQuestionResult,
  VisualSearchAssessmentResult,
  VisualSearchRoundLog,
  VisualSearchSessionLog,
} from './visualSearchAssessment.types';

function buildRoundMetrics(round: VisualSearchRoundLog): RoundAssessmentMetrics {
  const omissionRate = safeDivide(round.missedTargets, round.targetsPresented);
  const commissionRateProxy = safeDivide(round.errors, round.hits + round.errors);
  const accuracyRate = safeDivide(
    round.hits,
    round.hits + round.errors + round.missedTargets
  );
  const bias = classifyAssessmentBias(round.errors, round.missedTargets);

  return {
    round: round.round,
    omissionRate,
    commissionRateProxy,
    accuracyRate,
    bias,
  };
}

function buildEvidenceSummary(
  rounds: VisualSearchRoundLog[]
): QuestionEvidenceSummary {
  const totalTargets = rounds.reduce(
    (sum, round) => sum + round.targetsPresented,
    0
  );
  const totalHits = rounds.reduce((sum, round) => sum + round.hits, 0);
  const totalErrors = rounds.reduce((sum, round) => sum + round.errors, 0);
  const totalMissedTargets = rounds.reduce(
    (sum, round) => sum + round.missedTargets,
    0
  );

  const omissionRate = safeDivide(totalMissedTargets, totalTargets);
  const commissionRateProxy = safeDivide(totalErrors, totalHits + totalErrors);
  const accuracyRate = safeDivide(
    totalHits,
    totalHits + totalErrors + totalMissedTargets
  );
  const predominantBias = classifyAssessmentBias(totalErrors, totalMissedTargets);
  const roundsMetrics = rounds.map(buildRoundMetrics);

  return {
    totalTargets,
    totalHits,
    totalErrors,
    totalMissedTargets,
    omissionRate,
    commissionRateProxy,
    accuracyRate,
    predominantBias,
    rounds: roundsMetrics,
  };
}

function buildAnswer(bias: AssessmentBias): 'sim' | 'nao' | 'parcial' {
  if (bias === 'comissao') {
    return 'sim';
  }

  if (bias === 'misto' || bias === 'omissao') {
    return 'parcial';
  }

  return 'nao';
}

function buildClinicalMeaning(
  bias: AssessmentBias,
  severity: AssessmentSeverity
): string {
  if (bias === 'comissao') {
    return severity === 'elevado' || severity === 'moderado'
      ? 'Há sinais relevantes de dificuldade para inibir respostas diante de distratores semelhantes.'
      : 'Há indícios leves de dificuldade para inibir respostas diante de distratores semelhantes.';
  }

  if (bias === 'omissao') {
    return severity === 'elevado' || severity === 'moderado'
      ? 'O padrão sugere maior desatenção, lentidão de varredura visual ou perda do rastreio do alvo.'
      : 'Há indícios leves de desatenção ou lentidão no rastreio visual.';
  }

  if (bias === 'misto') {
    return 'O padrão combina omissões e comissões, sugerindo dificuldade mista de filtragem e estabilidade atencional.';
  }

  return 'O desempenho sugere controle seletivo adequado, com baixa interferência de distratores.';
}

function buildSummary(evidence: QuestionEvidenceSummary): string {
  return [
    `Erros: ${evidence.totalErrors}`,
    `Omissões: ${evidence.totalMissedTargets}`,
    `Taxa de omissão: ${evidence.omissionRate.toFixed(2)}`,
    `Taxa de comissão: ${evidence.commissionRateProxy.toFixed(2)}`,
  ].join(' | ');
}

function buildConfidence(
  bias: AssessmentBias,
  evidence: QuestionEvidenceSummary
): number {
  if (bias === 'adequado') {
    return clampConfidence(1 - Math.max(
      evidence.omissionRate,
      evidence.commissionRateProxy
    ));
  }

  if (bias === 'comissao') {
    return clampConfidence(
      evidence.commissionRateProxy - evidence.omissionRate + 0.5
    );
  }

  if (bias === 'omissao') {
    return clampConfidence(
      evidence.omissionRate - evidence.commissionRateProxy + 0.5
    );
  }

  return clampConfidence(
    1 - Math.abs(evidence.omissionRate - evidence.commissionRateProxy)
  );
}

function buildQuestionResult(
  sessionLog: VisualSearchSessionLog
): VisualSearchAssessmentQuestionResult {
  const evidence = buildEvidenceSummary(sessionLog.rounds);
  const severity = classifyAssessmentSeverity(
    evidence.omissionRate,
    evidence.commissionRateProxy
  );
  const bias = evidence.predominantBias;
  const answer = buildAnswer(bias);
  const confidence = buildConfidence(bias, evidence);
  const summary = buildSummary(evidence);
  const clinicalMeaning = buildClinicalMeaning(bias, severity);

  return {
    id: 'filter-distractors',
    title: visualSearchAssessmentConfig.questionTitle,
    answered: true,
    answer,
    severity,
    bias,
    confidence,
    summary,
    clinicalMeaning,
    evidence,
  };
}

export function evaluateVisualSearchAssessment(
  sessionLog: VisualSearchSessionLog
): VisualSearchAssessmentResult {
  const question = buildQuestionResult(sessionLog);

  return {
    gameKey: 'visual-search-hunt',
    sessionId: sessionLog.sessionId,
    createdAt: new Date().toISOString(),
    version: visualSearchAssessmentConfig.version,
    questions: [question],
  };
}