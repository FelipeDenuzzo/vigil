// src/assessment/visualSearch/buildVisualSearchScaleResult.ts
// Produz o resultado em escala (score 0–100, faixa, resposta clínica resumida)
// a partir de VisualSearchAnalysisInput (camada central).

import { buildErrorProfile, buildSpatialProfile } from './calculateVisualSearchMetrics';
import { getScoreBand, getErrorProfileLabel, getSpatialNeglectLabel, COMMISSION_THRESHOLD, OMISSION_THRESHOLD } from './visualSearchScaleDefinitions';
import type { VisualSearchAnalysisInput } from './types';

// ─── Tipo de saída ────────────────────────────────────────────────────────────

export interface VisualSearchScaleResult {
  score: number;          // 0–100
  band: string;           // 'excelente' | 'bom' | 'regular' | 'fraco' | 'insuficiente'
  bandLabel: string;      // versão legível da faixa
  answer: string;         // resposta clínica resumida (1–2 frases)
  errorProfileLabel: string;
  spatialNeglectLabel: string;
  commissionRate: number;
  omissionRate: number;
  dominantIssue: 'comissao' | 'omissao' | 'misto' | 'preservado';
}

// ─── Cálculo de score ─────────────────────────────────────────────────────────
// Penaliza comissão (peso 0.5) e omissão (peso 0.5), cada uma até 100%.

function computeScore(
  commissionRate: number,
  omissionRate: number
): number {
  const commissionPenalty = Math.min(commissionRate, 1) * 50;
  const omissionPenalty   = Math.min(omissionRate,   1) * 50;
  return Math.max(0, Math.round(100 - commissionPenalty - omissionPenalty));
}

// ─── Função principal ─────────────────────────────────────────────────────────

export function buildVisualSearchScaleResult(
  input: VisualSearchAnalysisInput
): VisualSearchScaleResult {
  const errorProfile   = buildErrorProfile(input.roundClicks);
  const spatialProfile = buildSpatialProfile(input.roundClicks);

  // Totais brutos por rodada
  let totalHits    = 0;
  let totalErrors  = 0;
  let totalTargets = 0;
  let totalMissed  = 0;

  for (const { clicks } of input.roundClicks) {
    for (const c of clicks) {
      if (c.isTarget) totalHits++;
      else totalErrors++;
    }
  }
  // totalTargets estimado: acertos + alvos perdidos (via spatialProfile)
  totalMissed  = spatialProfile.leftMisses + spatialProfile.rightMisses;
  totalTargets = totalHits + totalMissed;

  const commissionRate = totalHits + totalErrors > 0
    ? totalErrors / (totalHits + totalErrors)
    : 0;

  const omissionRate = totalTargets > 0
    ? totalMissed / totalTargets
    : 0;

  const score = computeScore(commissionRate, omissionRate);
  const { band, label: bandLabel, description } = getScoreBand(score);

  // Padrão dominante
  const highCommission = commissionRate > COMMISSION_THRESHOLD;
  const highOmission   = omissionRate   > OMISSION_THRESHOLD;
  let dominantIssue: VisualSearchScaleResult['dominantIssue'] = 'preservado';
  if (highCommission && highOmission) dominantIssue = 'misto';
  else if (highCommission)            dominantIssue = 'comissao';
  else if (highOmission)              dominantIssue = 'omissao';

  // Resposta clínica
  let answer: string;
  if (dominantIssue === 'comissao')
    answer = `Sinais de impulsividade na seleção de alvos. ${description}`;
  else if (dominantIssue === 'omissao')
    answer = `Tendência a perder alvos durante a varredura. ${description}`;
  else if (dominantIssue === 'misto')
    answer = `Instabilidade no filtro atencional: erros de comissão e omissão. ${description}`;
  else
    answer = `Atenção seletiva preservada. ${description}`;

  return {
    score,
    band,
    bandLabel,
    answer,
    errorProfileLabel: getErrorProfileLabel(errorProfile),
    spatialNeglectLabel: getSpatialNeglectLabel(spatialProfile),
    commissionRate: Number(commissionRate.toFixed(2)),
    omissionRate:   Number(omissionRate.toFixed(2)),
    dominantIssue,
  };
}
