// src/attentions/selective/games/VisualSearchHunt/assessment/buildVisualSearchTechnicalReport.ts
// Atualizado em: 28/05/2026 — frases via selectiveAttentionLanguageBank

import { calculateVisualSearchMetrics } from './calculateVisualSearchMetrics';
import { buildVisualSearchScaleResult } from './buildVisualSearchScaleResult';
import { selectiveAttentionLanguageBank as banco } from '../../../../../assessment/languageBanks/selectiveAttentionLanguageBank';
import type {
  SubscaleSeverity,
  VisualSearchSessionMetricsInput,
  VisualSearchTechnicalReport,
} from './visualSearchScale.types';

// ─── Severidade global ──────────────────────────────────────────────────────────────────────────

function getSeverity(omissionRate: number, commissionRate: number): SubscaleSeverity {
  const maxRate = Math.max(omissionRate, commissionRate);
  if (maxRate < 0.1) return 'minimo';
  if (maxRate < 0.2) return 'leve';
  if (maxRate < 0.3) return 'moderado';
  return 'importante';
}

// ─── Indicadores positivos ──────────────────────────────────────────────────────────────────────

function resolvePositiveIndicators(
  severity: SubscaleSeverity,
  commissionRate: number,
  totalHits: number,
  engagementStatus: string
): string[] {
  // Sem engajamento real: não exibir pontos fortes
  if (engagementStatus === 'insuficiente' || totalHits === 0) return [];

  if (severity === 'minimo')
    return [
      banco.indicadoresPositivos[0],
      banco.indicadoresPositivos[2],
      banco.indicadoresPositivos[3],
    ];
  if (severity === 'leve')
    return [
      banco.indicadoresPositivos[0],
      banco.indicadoresPositivos[4],
    ];
  if (commissionRate < 0.5)
    return [banco.indicadoresPositivos[7]];
  return [];
}

// ─── Sinal de alerta ──────────────────────────────────────────────────────────────────────────────

// Negligência espacial: exige alvos perdidos E concentrados em um lado (>= 75%).
// Assimetria de cliques isolada não é evidência de negligência — reflete apenas
// onde os alvos estavam distribuídos na grade.
function resolveRedFlag(
  totalLeftMisses: number | null,
  totalRightMisses: number | null,
  dominantPattern: string,
  commissionRate: number
): string | null {
  const leftMisses  = totalLeftMisses  ?? 0;
  const rightMisses = totalRightMisses ?? 0;
  const totalMisses = leftMisses + rightMisses;
  const hasSpatialNeglect =
    totalMisses >= 3 &&
    (leftMisses / totalMisses >= 0.75 || rightMisses / totalMisses >= 0.75);

  if (hasSpatialNeglect) return banco.sinaisDeAlerta.assimetriaEspacial;
  if (dominantPattern === 'misto' && commissionRate >= 0.3)
    return banco.sinaisDeAlerta.colapsoDeConjuncao;
  if (commissionRate >= 0.5)
    return banco.sinaisDeAlerta.impulsividadeSemCorrecao;
  return null;
}

// ─── Subescala: Atenção seletiva ─────────────────────────────────────────────────────────────────

function buildSelectiveAttentionInterpretation(params: {
  dominantPattern: string;
  severity: SubscaleSeverity;
  dPrime: number | null;
  dPrimeBand: string;
}): string {
  const { dominantPattern, dPrime, dPrimeBand } = params;

  const dSentence =
    dPrime === null
      ? 'Sensibilidade perceptiva não calculada por falta de dados suficientes.'
      : `Sensibilidade perceptiva ${dPrimeBand} (d-prime: ${dPrime.toFixed(2)}).`;

  if (dominantPattern === 'omissao')
    return `${banco.frasesDeInterpretacao[4]} ${dSentence}`;
  if (dominantPattern === 'tendencia_omissao')
    return `${banco.frasesDeInterpretacao[0]} ${dSentence}`;
  if (dominantPattern === 'comissao')
    return `${banco.padroesDeerro.cliqueImpulsivo} ${dSentence}`;
  if (dominantPattern === 'tendencia_comissao')
    return `${banco.frasesDeInterpretacao[1]} ${dSentence}`;
  if (dominantPattern === 'misto')
    return `${banco.frasesDeInterpretacao[6]} ${dSentence}`;
  return `${banco.frasesDeInterpretacao[0]} ${dSentence}`;
}

// ─── Subescala: Varredura visual ────────────────────────────────────────────────────────────────

function buildScanningInterpretation(
  orgIndex: number | null,
  pattern: string | null
): string {
  if (orgIndex === null) return 'Dados de varredura visual não disponíveis.';
  const patternLabel =
    pattern === 'row-wise' ? 'em linhas' : pattern === 'column-wise' ? 'em colunas' : 'misto';
  if (orgIndex >= 70)
    return `Varredura organizada (índice ${orgIndex.toFixed(0)}/100), padrão predominante: ${patternLabel}.`;
  if (orgIndex >= 40)
    return `Varredura parcialmente sistemática (índice ${orgIndex.toFixed(0)}/100), padrão: ${patternLabel}. ${banco.frasesDeInterpretacao[1]}`;
  return `Varredura predominantemente errática (índice ${orgIndex.toFixed(0)}/100). ${banco.frasesDeInterpretacao[6]}`;
}

// ─── Subescala: Assimetria espacial ──────────────────────────────────────────────────────────────────

function buildAsymmetryInterpretation(
  asymIdx: number | null,
  leftMisses: number | null,
  rightMisses: number | null
): string {
  if (asymIdx === null) return 'Dados de assimetria espacial não disponíveis.';
  const side =
    leftMisses !== null && rightMisses !== null && leftMisses > rightMisses
      ? 'esquerdo'
      : 'direito';
  if (asymIdx > 50)
    return `${banco.sinaisDeAlerta.assimetriaEspacial} Maior perda de alvos no lado ${side} (índice ${asymIdx.toFixed(0)}).`;
  if (asymIdx > 25)
    return `Leve tendência de assimetria espacial (índice ${asymIdx.toFixed(0)}). Atenção ao lado ${side}.`;
  return `Distribuição espacial equilibrada (assimetria ${asymIdx.toFixed(0)}).`;
}

// ─── Subescala: Velocidade e consistência ─────────────────────────────────────────────────────

function buildSpeedInterpretation(
  meanRT: number | null,
  stdDev: number | null
): string {
  if (meanRT === null) return 'Dados de tempo de resposta não disponíveis.';
  const cv = stdDev !== null ? stdDev / meanRT : null;
  const rtLabel = `${(meanRT / 1000).toFixed(1)}s`;
  const cvLabel = cv !== null ? ` (variabilidade ${cv.toFixed(2)})` : '';
  if (meanRT > 4000 && cv !== null && cv > 0.5)
    return `${banco.frasesDeInterpretacao[3]} Média ${rtLabel}${cvLabel}.`;
  if (meanRT > 4000)
    return `Resposta mais cuidadosa que a média: ${rtLabel}. Ritmo adequado.`;
  if (cv !== null && cv > 0.5)
    return `Ritmo irregular de resposta${cvLabel}, apesar do tempo médio dentro do esperado (${rtLabel}).`;
  return `Tempo de resposta adequado: média ${rtLabel}${cvLabel}.`;
}

// ─── Função principal ───────────────────────────────────────────────────────────────────────────────

export function buildVisualSearchTechnicalReport(
  session: VisualSearchSessionMetricsInput
): VisualSearchTechnicalReport {
  const m = calculateVisualSearchMetrics(session);
  const scale = buildVisualSearchScaleResult(session);
  const severity = getSeverity(m.omissionRate, m.commissionRate);

  const selectiveAttention = buildSelectiveAttentionInterpretation({
    dominantPattern: m.dominantPattern,
    severity,
    dPrime: m.dPrime,
    dPrimeBand: m.dPrimeBand,
  });

  const visualScanning = buildScanningInterpretation(
    m.meanOrganizationIndex,
    m.predominantScanPattern
  );

  const spatialAsymmetry = buildAsymmetryInterpretation(
    m.meanSpatialAsymmetryIndex,
    m.totalLeftMisses,
    m.totalRightMisses
  );

  const speedConsistency = buildSpeedInterpretation(
    m.meanReactionTimeMs,
    m.reactionTimeStdDev
  );

  const positiveIndicators = resolvePositiveIndicators(
    severity,
    m.commissionRate,
    m.totalHits,
    m.engagementStatus
  );

  // Aviso de negligência espacial: passa misseds por lado, não hasSpatialAsymmetry
  const redFlag = resolveRedFlag(
    m.totalLeftMisses,
    m.totalRightMisses,
    m.dominantPattern,
    m.commissionRate
  );

  return {
    title: 'Avaliação do Visual Search Hunt',
    question: 'O paciente tem dificuldade em filtrar distratores?',
    answer: scale.answer,
    dominantPattern: m.dominantPattern,
    severity,
    positiveIndicators,
    redFlag,
    summary:
      `Score: ${scale.score}/100 | ` +
      `Erros: ${m.totalErrors} | Omissões: ${m.totalMissedTargets} | ` +
      `Comissão: ${(m.commissionRate * 100).toFixed(0)}% | ` +
      `Omissão: ${(m.omissionRate * 100).toFixed(0)}% | ` +
      `Organização: ${m.meanOrganizationIndex !== null ? m.meanOrganizationIndex.toFixed(0) : 'N/A'} | ` +
      `Assimetria: ${m.meanSpatialAsymmetryIndex !== null ? m.meanSpatialAsymmetryIndex.toFixed(0) : 'N/A'}`,
    interpretation: banco.severidade[severity],
    subscalesSummary: {
      selectiveAttention,
      visualScanning,
      spatialAsymmetry,
      speedConsistency,
    },
    evidence: {
      totalTargets: m.totalTargets,
      totalHits: m.totalHits,
      totalErrors: m.totalErrors,
      totalMissedTargets: m.totalMissedTargets,
      totalRounds: m.totalRounds,
      omissionRate: Number(m.omissionRate.toFixed(2)),
      commissionRate: Number(m.commissionRate.toFixed(2)),
      accuracyRate: Number(m.accuracyRate.toFixed(2)),
      hitRate: Number(m.hitRate.toFixed(2)),
      falseAlarmRate: m.falseAlarmRate !== null ? Number(m.falseAlarmRate.toFixed(2)) : null,
      dPrime: m.dPrime !== null ? Number(m.dPrime.toFixed(2)) : null,
      dPrimeBand: m.dPrimeBand,
      meanReactionTimeMs: m.meanReactionTimeMs !== null ? Math.round(m.meanReactionTimeMs) : null,
      reactionTimeStdDev: m.reactionTimeStdDev !== null ? Math.round(m.reactionTimeStdDev) : null,
      meanOrganizationIndex:
        m.meanOrganizationIndex !== null ? Number(m.meanOrganizationIndex.toFixed(1)) : null,
      predominantScanPattern: m.predominantScanPattern,
      meanSpatialAsymmetryIndex:
        m.meanSpatialAsymmetryIndex !== null
          ? Number(m.meanSpatialAsymmetryIndex.toFixed(1))
          : null,
      totalLeftMisses: m.totalLeftMisses,
      totalRightMisses: m.totalRightMisses,
      score: scale.score,
    },
  };
}
