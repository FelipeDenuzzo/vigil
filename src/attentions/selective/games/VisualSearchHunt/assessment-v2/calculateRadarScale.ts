/* src/attentions/selective/games/VisualSearchHunt/assessment-v2/calculateRadarScale.ts */
/* Régua de Visão de Radar — Organização Espacial */
/* Atualizado em: 01/06/2026 */

import type { RadarScaleResult, VisualSearchV2SessionLog } from './visualSearchV2.types';

/**
 * Calcula a Régua de Visão de Radar (organização espacial).
 *
 * Proxy: consistência do padrão de erro entre rodadas.
 * - commissionRate por rodada: errors / (hits + errors)
 * - consistencyScore: 1 - desvio padrão normalizado
 * - score: clamp(consistencyScore * 100, 0, 100)
 */
export function calculateRadarScale(sessionLog: VisualSearchV2SessionLog): RadarScaleResult {
  const { rounds } = sessionLog;

  if (rounds.length === 0) {
    return {
      score: 0,
      markerLabel: 'Radar Perdido',
      shortDescription: 'Sem dados de organização visual.',
      clinicalMeaning: 'Impossível avaliar padrão de busca visual.',
    };
  }

  // ── Calcular commissionRate por rodada ──
  const commissionRates: number[] = [];
  for (const round of rounds) {
    const totalActions = round.hits + round.errors;
    if (totalActions > 0) {
      commissionRates.push(round.errors / totalActions);
    }
  }

  if (commissionRates.length === 0) {
    return {
      score: 0,
      markerLabel: 'Radar Perdido',
      shortDescription: 'Sem ações registradas para análise.',
      clinicalMeaning: 'Dados insuficientes para avaliação.',
    };
  }

  // ── Calcular média e desvio padrão ──
  const mean = commissionRates.reduce((sum, r) => sum + r, 0) / commissionRates.length;
  const variance = commissionRates.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / commissionRates.length;
  const stdDev = Math.sqrt(variance);

  // ── Normalizar desvio padrão (máximo 1) ──
  // Se stdDev > 1, clampar a 1 para evitar consistencyScore negativo
  const maxStdDev = 1;
  const normalizedStdDev = Math.min(stdDev, maxStdDev);

  // ── Consistência: 1 - desvio normalizado ──
  const consistencyScore = 1 - normalizedStdDev;
  const clampedScore = Math.max(0, Math.min(100, consistencyScore * 100));
  const score = Math.round(clampedScore);

  // ── Determinar label e significado ──
  let markerLabel: string;
  let shortDescription: string;
  let clinicalMeaning: string;

  if (score >= 80) {
    markerLabel = 'Radar Calibrado';
    shortDescription = 'Organização visual consistente e eficaz.';
    clinicalMeaning =
      'Padrão de busca visual bem organizado e estável. Estratégia de rastreio preservada.';
  } else if (score >= 60) {
    markerLabel = 'Radar Oscilante';
    shortDescription = 'Organização visual com variações moderadas.';
    clinicalMeaning =
      'Padrão de busca visual oscila, com períodos de desorganização leve. Controle atencional em transição.';
  } else if (score >= 40) {
    markerLabel = 'Radar em Pânico';
    shortDescription = 'Organização visual irregular e desorganizada.';
    clinicalMeaning =
      'Padrão de busca visual desorganizado. Estratégia de rastreio comprometida, com alternâncias frequentes.';
  } else {
    markerLabel = 'Radar Perdido';
    shortDescription = 'Organização visual severamente prejudicada.';
    clinicalMeaning =
      'Ausência de organização visual coerente. Busca caótica e ineficiente, sugerindo perda de foco atencional.';
  }

  return {
    score,
    markerLabel,
    shortDescription,
    clinicalMeaning,
  };
}
