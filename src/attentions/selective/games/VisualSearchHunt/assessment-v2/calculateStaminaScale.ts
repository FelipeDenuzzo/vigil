/* src/attentions/selective/games/VisualSearchHunt/assessment-v2/calculateStaminaScale.ts */
/* Régua de Fôlego Mental — Sustentação e Vigilância */
/* Atualizado em: 01/06/2026 */

import type { StaminaScaleResult, VisualSearchV2SessionLog } from './visualSearchV2.types';

/**
 * Calcula a Régua de Fôlego Mental (Stamina/Sustentação).
 *
 * Lógica:
 * - accuracyRate por rodada = hits / (hits + errors + missedTargets)
 * - Divide rodadas em primeiro e último terço
 * - staminaDrop = média(primeiro) - média(último)
 * - score = clamp((1 - staminaDrop) * 100, 0, 100)
 * - vigilanceDropDetected se últimas 3 rodadas < 0.4 accuracy OU staminaDrop > 0.35
 */
export function calculateStaminaScale(sessionLog: VisualSearchV2SessionLog): StaminaScaleResult {
  const { rounds } = sessionLog;

  if (rounds.length === 0) {
    return {
      score: 0,
      markerLabel: 'Bateria Esgotada',
      shortDescription: 'Sem dados de sustentação.',
      clinicalMeaning: 'Impossível avaliar resistência atencional.',
      vigilanceDropDetected: false,
    };
  }

  // ── Calcular accuracyRate por rodada ──
  const accuracyRates: number[] = [];
  for (const round of rounds) {
    const total = round.hits + round.errors + round.missedTargets;
    if (total > 0) {
      accuracyRates.push(round.hits / total);
    } else {
      accuracyRates.push(0);
    }
  }

  // ── Dividir em blocos: primeiro e último terço ──
  const thirdLength = Math.max(1, Math.ceil(accuracyRates.length / 3));

  const firstThird = accuracyRates.slice(0, thirdLength);
  const lastThird = accuracyRates.slice(-thirdLength);

  const firstThirdMean = firstThird.reduce((sum, r) => sum + r, 0) / firstThird.length;
  const lastThirdMean = lastThird.reduce((sum, r) => sum + r, 0) / lastThird.length;

  const staminaDrop = firstThirdMean - lastThirdMean;

  // ── Score: quanto menor a queda, melhor ──
  const clampedScore = Math.max(0, Math.min(100, (1 - staminaDrop) * 100));
  const score = Math.round(clampedScore);

  // ── Detectar colapso de vigilância ──
  let vigilanceDropDetected = false;

  // Verificar se as últimas 3 rodadas têm accuracy < 0.4
  const lastThreeAccuracy = accuracyRates.slice(-3);
  if (lastThreeAccuracy.length > 0) {
    const allBelowThreshold = lastThreeAccuracy.every((acc) => acc < 0.4);
    if (allBelowThreshold) vigilanceDropDetected = true;
  }

  // OU se a queda de stamina > 0.35
  if (staminaDrop > 0.35) {
    vigilanceDropDetected = true;
  }

  // ── Determinar label e significado ──
  let markerLabel: string;
  let shortDescription: string;
  let clinicalMeaning: string;

  if (score >= 80) {
    markerLabel = 'Bateria Cheia';
    shortDescription = 'Sustentação atencional excelente.';
    clinicalMeaning =
      'Desempenho mantém-se elevado ao longo da sessão. Vigilância preservada, sem sinais de fadiga atencional.';
  } else if (score >= 60) {
    markerLabel = 'Bateria Estável';
    shortDescription = 'Sustentação atencional adequada.';
    clinicalMeaning =
      'Desempenho ligeiramente reduzido nas últimas rodadas, mas sem colapso significativo. Resistência atencional aceitável.';
  } else if (score >= 40) {
    markerLabel = 'Bateria Fraca';
    shortDescription = 'Sustentação atencional comprometida.';
    clinicalMeaning =
      'Queda notável de desempenho nas últimas rodadas. Sinais de fadiga atencional, com dificuldade em manter vigilância.';
  } else {
    markerLabel = 'Bateria Esgotada';
    shortDescription = 'Sustentação atencional severamente reduzida.';
    clinicalMeaning =
      'Colapso significativo no final da sessão. Vigilância severamente comprometida, sugerindo esgotamento atencional.';
  }

  return {
    score,
    markerLabel,
    shortDescription,
    clinicalMeaning,
    vigilanceDropDetected,
  };
}
