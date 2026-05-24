/* src/attentions/selective/games/VisualSearchHunt/assessment/visualSearchAssessment.ts */
/* Atualizado em: 24/05/2026 às 15:18 (BRT) */

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
  VisualSearchAssessmentGraphPoint,
  VisualSearchAssessmentQuestionResult,
  VisualSearchAssessmentResult,
  VisualSearchRoundLog,
  VisualSearchSessionLog,
} from './visualSearchAssessment.types';

// ─── Utilitários locais ────────────────────────────────────────────────────────

function localMean(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

// ─── Métricas por rodada ───────────────────────────────────────────────────────

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

// ─── Sumário de evidências ─────────────────────────────────────────────────────

function buildEvidenceSummary(
  rounds: VisualSearchRoundLog[]
): QuestionEvidenceSummary {
  const totalTargets = rounds.reduce((sum, r) => sum + r.targetsPresented, 0);
  const totalHits = rounds.reduce((sum, r) => sum + r.hits, 0);
  const totalErrors = rounds.reduce((sum, r) => sum + r.errors, 0);
  const totalMissedTargets = rounds.reduce((sum, r) => sum + r.missedTargets, 0);

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

// ─── Resposta e significância clínica ─────────────────────────────────────────

function buildAnswer(
  bias: AssessmentBias,
  totalTargets: number,
  totalRounds: number,
  totalHits: number,
  totalErrors: number
): 'sim' | 'nao' | 'parcial' | 'insuficiente' {
  // sessão insuficiente para interpretar
  if (totalTargets < 20 || totalRounds < 3 || totalHits + totalErrors < 5) {
    return 'insuficiente';
  }
  if (bias === 'comissao') return 'sim';
  if (bias === 'misto' || bias === 'omissao') return 'parcial';
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
    return clampConfidence(
      1 - Math.max(evidence.omissionRate, evidence.commissionRateProxy)
    );
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

// ─── Notas das subescalas (varredura, assimetria, velocidade) ──────────────────

function buildSubscaleNotes(rounds: VisualSearchRoundLog[]): {
  selectiveAttention?: string;
  visualScanning?: string;
  spatialAsymmetry?: string;
  speedConsistency?: string;
} {
  // varredura visual
  const orgValues = rounds
    .map((r) => r.organizationIndex)
    .filter((v): v is number => v !== undefined);
  const meanOrg = localMean(orgValues);

  // assimetria espacial
  const totalLeftMisses = rounds.reduce((acc, r) => acc + (r.leftSideTargetMisses ?? 0), 0);
  const totalRightMisses = rounds.reduce((acc, r) => acc + (r.rightSideTargetMisses ?? 0), 0);
  const asymValues = rounds
    .map((r) => r.spatialAsymmetryIndex)
    .filter((v): v is number => v !== undefined);
  const meanAsym = localMean(asymValues);

  // velocidade
  const allRT = rounds.flatMap((r) => r.reactionTimes ?? []);
  const meanRT = localMean(allRT);
  const cv =
    meanRT !== null && allRT.length >= 2
      ? Math.sqrt(
          allRT.reduce((acc, v) => acc + Math.pow(v - meanRT, 2), 0) /
            (allRT.length - 1)
        ) / meanRT
      : null;

  const notes: ReturnType<typeof buildSubscaleNotes> = {};

  // varredura
  if (meanOrg !== null) {
    notes.visualScanning =
      meanOrg >= 70
        ? `Varredura organizada (índice médio ${meanOrg.toFixed(0)}).`
        : meanOrg >= 40
        ? `Varredura parcialmente sistemática (índice ${meanOrg.toFixed(0)}).`
        : `Varredura errática (índice ${meanOrg.toFixed(0)}).`;
  }

  // assimetria
  if (meanAsym !== null) {
    const side = totalLeftMisses > totalRightMisses ? 'esquerdo' : 'direito';
    notes.spatialAsymmetry =
      meanAsym > 50
        ? `Assimetria pronunciada (índice ${meanAsym.toFixed(0)}), mais perdas no lado ${side}.`
        : meanAsym > 25
        ? `Leve assimetria espacial (índice ${meanAsym.toFixed(0)}).`
        : `Distribuição espacial equilibrada.`;
  }

  // velocidade
  if (meanRT !== null) {
    const rtLabel = `${(meanRT / 1000).toFixed(1)}s`;
    const cvLabel = cv !== null ? ` (CV ${cv.toFixed(2)})` : '';
    notes.speedConsistency =
      meanRT > 4000 && cv !== null && cv > 0.5
        ? `Resposta lenta e irregular: média ${rtLabel}${cvLabel}.`
        : meanRT > 4000
        ? `Resposta lenta: média ${rtLabel}.`
        : cv !== null && cv > 0.5
        ? `Ritmo irregular${cvLabel}, tempo médio ${rtLabel}.`
        : `Tempo adequado: média ${rtLabel}${cvLabel}.`;
  }

  return notes;
}

// ─── Resultado da pergunta principal ──────────────────────────────────────────

function buildQuestionResult(
  sessionLog: VisualSearchSessionLog
): VisualSearchAssessmentQuestionResult {
  const { rounds } = sessionLog;
  const evidence = buildEvidenceSummary(rounds);
  const severity = classifyAssessmentSeverity(
    evidence.omissionRate,
    evidence.commissionRateProxy
  );
  const bias = evidence.predominantBias;
  const answer = buildAnswer(
    bias,
    evidence.totalTargets,
    rounds.length,
    evidence.totalHits,
    evidence.totalErrors
  );
  const confidence = buildConfidence(bias, evidence);
  const summary = buildSummary(evidence);
  const clinicalMeaning = buildClinicalMeaning(bias, severity);
  const subscaleNotes = buildSubscaleNotes(rounds);

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
    subscaleNotes,
  };
}

// ─── Score por rodada (para gráfico) ──────────────────────────────────────────

function buildRoundGraphScore(round: VisualSearchRoundLog): number {
  const hitRate = safeDivide(round.hits, round.targetsPresented);
  const omissionRate = safeDivide(round.missedTargets, round.targetsPresented);
  const commissionRate = safeDivide(round.errors, round.targetsPresented);
  const score = hitRate - omissionRate - commissionRate * 0.75;
  return Math.max(0, Math.min(100, Number((score * 100).toFixed(1))));
}

function buildGraphSeries(
  rounds: VisualSearchRoundLog[]
): VisualSearchAssessmentGraphPoint[] {
  return rounds.map((round) => {
    const omissionRate = safeDivide(round.missedTargets, round.targetsPresented);
    const commissionRateProxy = safeDivide(round.errors, round.hits + round.errors);
    const bias = classifyAssessmentBias(round.errors, round.missedTargets);
    const roundRT = round.reactionTimes ? localMean(round.reactionTimes) : undefined;

    return {
      round: round.round,
      score: buildRoundGraphScore(round),
      hits: round.hits,
      errors: round.errors,
      missedTargets: round.missedTargets,
      targetsPresented: round.targetsPresented,
      omissionRate,
      commissionRateProxy,
      bias,
      organizationIndex: round.organizationIndex,
      spatialAsymmetryIndex: round.spatialAsymmetryIndex,
      meanReactionTimeMs: roundRT ?? undefined,
    };
  });
}

// ─── Função exportada ─────────────────────────────────────────────────────────

export function evaluateVisualSearchAssessment(
  sessionLog: VisualSearchSessionLog
): VisualSearchAssessmentResult {
  const question = buildQuestionResult(sessionLog);
  const graphSeries = buildGraphSeries(sessionLog.rounds);

  return {
    gameKey: 'visual-search-hunt',
    sessionId: sessionLog.sessionId,
    createdAt: new Date().toISOString(),
    version: visualSearchAssessmentConfig.version,
    questions: [question],
    graphSeries,
  };
}
