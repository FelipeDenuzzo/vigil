// src/attentions/selective/games/VisualSearchHunt/assessment/buildVisualSearchTechnicalReport.ts

import { calculateVisualSearchMetrics } from './calculateVisualSearchMetrics';
import { buildVisualSearchScaleResult } from './buildVisualSearchScaleResult';
import type {
  SubscaleSeverity,
  VisualSearchSessionMetricsInput,
  VisualSearchTechnicalReport
} from './visualSearchScale.types';

// ─── Gravidade global (maior taxa de erro) ─────────────────────────────────────

function getSeverity(omissionRate: number, commissionRate: number): SubscaleSeverity {
  const maxRate = Math.max(omissionRate, commissionRate);
  if (maxRate < 0.1) return 'minimo';
  if (maxRate < 0.2) return 'leve';
  if (maxRate < 0.3) return 'moderado';
  return 'importante';
}

// ─── Interpretação da subescala de atenção seletiva ──────────────────────────

function buildSelectiveAttentionInterpretation(params: {
  dominantPattern: string;
  severity: SubscaleSeverity;
  dPrime: number | null;
  dPrimeBand: string;
}): string {
  const { dominantPattern, severity, dPrime, dPrimeBand } = params;
  const dSentence =
    dPrime === null
      ? 'O d-prime não foi calculado por falta do total de oportunidades de falso alarme.'
      : `O d-prime foi ${dPrime.toFixed(2)}, sugerindo sensibilidade perceptiva ${dPrimeBand}.`;

  if (dominantPattern === 'omissao')
    return `Há sinais ${severity} de perda de alvos, sugerindo desatenção visual ou lentidão de rastreio. ${dSentence}`;
  if (dominantPattern === 'tendencia_omissao')
    return `Tendência leve de perda de alvos sem excesso de erros em distratores. ${dSentence}`;
  if (dominantPattern === 'comissao')
    return `Há sinais ${severity} de cliques impulsivos em distratores, sugerindo falha de inibição. ${dSentence}`;
  if (dominantPattern === 'tendencia_comissao')
    return `Tendência leve de respostas a distratores sem perda significativa de alvos. ${dSentence}`;
  if (dominantPattern === 'misto')
    return `Há sinais ${severity} de instabilidade no filtro atencional, com perda de alvos e respostas a distratores. ${dSentence}`;
  return `O desempenho sugere atenção seletiva globalmente preservada. ${dSentence}`;
}

// ─── Interpretação da subescala de varredura visual ───────────────────────────

function buildScanningInterpretation(
  orgIndex: number | null,
  pattern: string | null
): string {
  if (orgIndex === null) return 'Dados de varredura visual não disponíveis.';
  const patternLabel = pattern === 'row-wise' ? 'em linhas' : pattern === 'column-wise' ? 'em colunas' : 'misto';
  if (orgIndex >= 70)
    return `Varredura organizada (índice ${orgIndex.toFixed(0)}/100), padrão predominante: ${patternLabel}.`;
  if (orgIndex >= 40)
    return `Varredura parcialmente sistemática (índice ${orgIndex.toFixed(0)}/100), padrão: ${patternLabel}.`;
  return `Varredura predominantemente errática (índice ${orgIndex.toFixed(0)}/100), padrão: ${patternLabel}.`;
}

// ─── Interpretação da subescala de assimetria espacial ────────────────────────

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
    return `Assimetria espacial pronunciada (índice ${asymIdx.toFixed(0)}), com maior perda de alvos no lado ${side}.`;
  if (asymIdx > 25)
    return `Leve tendência de assimetria espacial (índice ${asymIdx.toFixed(0)}).`;
  return `Distribuição espacial dos acertos equilibrada (assimetria ${asymIdx.toFixed(0)}).`;
}

// ─── Interpretação da subescala de velocidade ──────────────────────────────

function buildSpeedInterpretation(
  meanRT: number | null,
  stdDev: number | null
): string {
  if (meanRT === null) return 'Dados de tempo de resposta não disponíveis.';
  const cv = stdDev !== null ? stdDev / meanRT : null;
  const rtLabel = `${(meanRT / 1000).toFixed(1)}s`;
  const cvLabel = cv !== null ? ` (CV ${cv.toFixed(2)})` : '';
  if (meanRT > 4000 && cv !== null && cv > 0.5)
    return `Resposta lenta e irregular: média ${rtLabel}${cvLabel}, sugerindo dificuldade de ritmo atencional.`;
  if (meanRT > 4000)
    return `Resposta lenta: média ${rtLabel}. Ritmo adequado.`;
  if (cv !== null && cv > 0.5)
    return `Ritmo irregular de resposta${cvLabel}, apesar do tempo médio dentro do esperado (${rtLabel}).`;
  return `Tempo de resposta adequado: média ${rtLabel}${cvLabel}.`;
}

// ─── Função principal ──────────────────────────────────────────────────────────

export function buildVisualSearchTechnicalReport(
  session: VisualSearchSessionMetricsInput
): VisualSearchTechnicalReport {
  const m = calculateVisualSearchMetrics(session);
  const scale = buildVisualSearchScaleResult(session);
  const severity = getSeverity(m.omissionRate, m.commissionRate);

  return {
    title: 'Avaliação do Visual Search Hunt',
    question: 'O paciente tem dificuldade em filtrar distratores?',
    answer: scale.answer,
    dominantPattern: m.dominantPattern,
    severity,
    summary:
      `Score: ${scale.score}/100 | ` +
      `Erros: ${m.totalErrors} | Omissões: ${m.totalMissedTargets} | ` +
      `Comissão: ${(m.commissionRate * 100).toFixed(0)}% | ` +
      `Omissão: ${(m.omissionRate * 100).toFixed(0)}% | ` +
      `Organização: ${m.meanOrganizationIndex !== null ? m.meanOrganizationIndex.toFixed(0) : 'N/A'} | ` +
      `Assimetria: ${m.meanSpatialAsymmetryIndex !== null ? m.meanSpatialAsymmetryIndex.toFixed(0) : 'N/A'}`,
    interpretation: buildSelectiveAttentionInterpretation({
      dominantPattern: m.dominantPattern,
      severity,
      dPrime: m.dPrime,
      dPrimeBand: m.dPrimeBand
    }),
    subscalesSummary: {
      selectiveAttention: buildSelectiveAttentionInterpretation({
        dominantPattern: m.dominantPattern,
        severity,
        dPrime: m.dPrime,
        dPrimeBand: m.dPrimeBand
      }),
      visualScanning: buildScanningInterpretation(
        m.meanOrganizationIndex,
        m.predominantScanPattern
      ),
      spatialAsymmetry: buildAsymmetryInterpretation(
        m.meanSpatialAsymmetryIndex,
        m.totalLeftMisses,
        m.totalRightMisses
      ),
      speedConsistency: buildSpeedInterpretation(
        m.meanReactionTimeMs,
        m.reactionTimeStdDev
      )
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
      score: scale.score
    }
  };
}
