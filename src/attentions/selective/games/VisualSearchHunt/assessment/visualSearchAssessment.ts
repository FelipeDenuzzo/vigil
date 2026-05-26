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
  SelectiveAttentionAssessmentResult,
} from '../../../assessment/assessment.types';
import type {
  VisualSearchAssessmentResult,
  VisualSearchAssessmentQuestionResult,
  VisualSearchAssessmentGraphPoint,
  VisualSearchSessionLog,
  VisualSearchRoundLog,
} from './visualSearchAssessment.types';
import type { VisualSearchAssessmentConfig } from './visualSearchAssessment.types';

// ─── Config ───────────────────────────────────────────────────────────────

export const visualSearchAssessmentConfig: VisualSearchAssessmentConfig = {
  version: 1,
  questionTitle: 'O paciente tem dificuldade em filtrar distratores visuais?',
  thresholds: {
    commissionBiasRatio: 1.5,
    omissionBiasRatio: 1.5,
    mildRate: 0.1,
    moderateRate: 0.2,
    highRate: 0.3,
  },
};

// ─── Auxiliares ────────────────────────────────────────────────────────────

function buildEvidenceSummary(
  rounds: VisualSearchRoundLog[]
): QuestionEvidenceSummary {
  const totalTargets = rounds.reduce((s, r) => s + r.targetsPresented, 0);
  const totalHits = rounds.reduce((s, r) => s + r.hits, 0);
  const totalErrors = rounds.reduce((s, r) => s + r.errors, 0);
  const totalMissedTargets = rounds.reduce((s, r) => s + r.missedTargets, 0);

  const omissionRate = safeDivide(totalMissedTargets, totalTargets);
  const commissionRateProxy = safeDivide(totalErrors, totalTargets);
  const accuracyRate = safeDivide(totalHits, totalTargets);
  const predominantBias = classifyAssessmentBias(totalErrors, totalMissedTargets);

  const roundMetrics: RoundAssessmentMetrics[] = rounds.map((r, i) => ({
    round: r.round ?? i + 1,
    omissionRate: safeDivide(r.missedTargets, r.targetsPresented),
    commissionRateProxy: safeDivide(r.errors, r.targetsPresented),
    accuracyRate: safeDivide(r.hits, r.targetsPresented),
    bias: classifyAssessmentBias(r.errors, r.missedTargets),
  }));

  return {
    totalTargets,
    totalHits,
    totalErrors,
    totalMissedTargets,
    omissionRate,
    commissionRateProxy,
    accuracyRate,
    predominantBias,
    rounds: roundMetrics,
  };
}

// ─── Confidence ──────────────────────────────────────────────────────────

function buildConfidence(
  bias: AssessmentBias,
  evidence: QuestionEvidenceSummary
): number {
  const base = evidence.totalTargets >= 30 ? 0.9 : evidence.totalTargets >= 20 ? 0.75 : 0.5;
  const ratioBoost =
    bias === 'comissao' || bias === 'omissao' ? 0.1 : 0;
  return clampConfidence(base + ratioBoost);
}

// ─── Resposta principal ─────────────────────────────────────────────────────

function buildAnswer(
  bias: AssessmentBias,
  totalTargets: number,
  totalRounds: number,
  totalHits: number,
  totalErrors: number
): 'sim' | 'nao' | 'parcial' {
  // sessão insuficiente para interpretar → retorna 'nao' com answered=false
  if (totalTargets < 20 || totalRounds < 3 || totalHits + totalErrors < 5) {
    return 'nao'; // sessão insuficiente
  }
  if (bias === 'comissao') return 'sim';
  if (bias === 'misto' || bias === 'omissao') return 'parcial';
  return 'nao';
}

// ─── Significado clínico ──────────────────────────────────────────────────────

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
      ? 'Há sinais relevantes de perda de alvos, sugerindo desatenção visual ou lentidão de rastreio.'
      : 'Há indícios leves de omissão de alvos.'
  }
  if (bias === 'misto') {
    return 'Há sinais mistos: perda de alvos e respostas indevidas a distratores, sugerindo instabilidade no filtro atencional.';
  }
  return 'Desempenho dentro do esperado: filtro de distratores preservado.';
}

// ─── Sumário ────────────────────────────────────────────────────────────────

function buildSummary(evidence: QuestionEvidenceSummary): string {
  const { omissionRate, commissionRateProxy, accuracyRate } = evidence;
  return (
    `Acerto: ${(accuracyRate * 100).toFixed(0)}% | ` +
    `Omissão: ${(omissionRate * 100).toFixed(0)}% | ` +
    `Comissão: ${(commissionRateProxy * 100).toFixed(0)}%`
  );
}

// ─── Notas de subescalas ────────────────────────────────────────────────────

function buildSubscaleNotes(
  rounds: VisualSearchRoundLog[]
): VisualSearchAssessmentQuestionResult['subscaleNotes'] {
  const notes: VisualSearchAssessmentQuestionResult['subscaleNotes'] = {};

  // varredura visual
  const orgIndexes = rounds
    .map((r) => r.organizationIndex)
    .filter((v): v is number => v !== undefined);
  if (orgIndexes.length > 0) {
    const avg = orgIndexes.reduce((a, b) => a + b, 0) / orgIndexes.length;
    notes.visualScanning =
      avg >= 70
        ? `Varredura organizada (média ${avg.toFixed(0)}/100).`
        : avg >= 40
        ? `Varredura parcialmente sistemática (média ${avg.toFixed(0)}/100).`
        : `Varredura predominantemente errática (média ${avg.toFixed(0)}/100).`;
  }

  // assimetria espacial
  const asymIndexes = rounds
    .map((r) => r.spatialAsymmetryIndex)
    .filter((v): v is number => v !== undefined);
  if (asymIndexes.length > 0) {
    const avg = asymIndexes.reduce((a, b) => a + b, 0) / asymIndexes.length;
    notes.spatialAsymmetry =
      avg > 50
        ? `Assimetria espacial pronunciada (média ${avg.toFixed(0)}).`
        : avg > 25
        ? `Leve tendência de assimetria espacial (média ${avg.toFixed(0)}).`
        : `Distribuição espacial equilibrada (média ${avg.toFixed(0)}).`;
  }

  // velocidade
  const rts = rounds.flatMap((r) => r.reactionTimes ?? []);
  if (rts.length > 0) {
    const meanRT = rts.reduce((a, b) => a + b, 0) / rts.length;
    const cv =
      rts.length >= 2
        ? Math.sqrt(
            rts.reduce((s, v) => s + Math.pow(v - meanRT, 2), 0) /
              (rts.length - 1)
          ) / meanRT
        : null;
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

// ─── Resultado da pergunta principal ───────────────────────────────────────────

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
  const isSessionSufficient =
    evidence.totalTargets >= 20 &&
    rounds.length >= 3 &&
    evidence.totalHits + evidence.totalErrors >= 5;
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
    answered: isSessionSufficient,
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

// ─── Score por rodada (para gráfico) ─────────────────────────────────────────

function buildRoundGraphScore(round: VisualSearchRoundLog): number {
  const hitRate = safeDivide(round.hits, round.targetsPresented);
  const errorPenalty = safeDivide(round.errors, round.targetsPresented);
  const raw = hitRate - errorPenalty * 0.5;
  return Math.round(Math.max(0, Math.min(1, raw)) * 100);
}

// ─── Série para gráfico ──────────────────────────────────────────────────────────

function buildGraphSeries(
  rounds: VisualSearchRoundLog[]
): VisualSearchAssessmentGraphPoint[] {
  return rounds.map((r, i) => ({
    round: r.round ?? i + 1,
    score: buildRoundGraphScore(r),
    hits: r.hits,
    errors: r.errors,
    missedTargets: r.missedTargets,
    targetsPresented: r.targetsPresented,
    omissionRate: safeDivide(r.missedTargets, r.targetsPresented),
    commissionRateProxy: safeDivide(r.errors, r.targetsPresented),
    bias: classifyAssessmentBias(r.errors, r.missedTargets),
    organizationIndex: r.organizationIndex,
    spatialAsymmetryIndex: r.spatialAsymmetryIndex,
    meanReactionTimeMs:
      r.reactionTimes && r.reactionTimes.length > 0
        ? r.reactionTimes.reduce((a, b) => a + b, 0) / r.reactionTimes.length
        : undefined,
  }));
}

// ─── Função principal ─────────────────────────────────────────────────────────────

export function evaluateVisualSearchAssessment(
  sessionLog: VisualSearchSessionLog
): VisualSearchAssessmentResult {
  const questionResult = buildQuestionResult(sessionLog);
  const graphSeries = buildGraphSeries(sessionLog.rounds);

  const result: VisualSearchAssessmentResult = {
    gameKey: sessionLog.gameKey,
    sessionId: sessionLog.sessionId,
    createdAt: new Date().toISOString(),
    version: visualSearchAssessmentConfig.version,
    questions: [questionResult],
    graphSeries,
  };

  // Validação de tipo em tempo de compilação
  const _typeCheck: SelectiveAttentionAssessmentResult = result;
  void _typeCheck;

  return result;
}
