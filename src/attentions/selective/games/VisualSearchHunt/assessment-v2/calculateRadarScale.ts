/* src/attentions/selective/games/VisualSearchHunt/assessment-v2/calculateRadarScale.ts */
/* Régua de Visão de Radar — Organização */
/* Atualizado em: 01/06/2026 */

import type { V2RoundInput, RadarScaleResult } from "./visualSearchV2.types";

// Mede consistência do commissionRate entre rodadas.
// Baixa variância = radar calibrado. Alta variância = radar caótico.

function resolveRadarLabel(score: number) {
  if (score >= 80) return {
    label: "Radar Calibrado",
    short: "Erros consistentemente baixos em todos os níveis.",
    clinical: "Controle inibitório estável ao longo da sessão.",
  };
  if (score >= 60) return {
    label: "Radar Oscilante",
    short: "Erros variaram entre rodadas sem padrão claro.",
    clinical: "Controle inibitório instável; pode indicar fadiga ou impulsividade situacional.",
  };
  if (score >= 40) return {
    label: "Radar em Pânico",
    short: "Oscilação alta — do bom ao ruim dentro da mesma sessão.",
    clinical: "Dificuldade em manter critério de seleção estável.",
  };
  return {
    label: "Radar Perdido",
    short: "Erros aumentaram drasticamente nas rodadas mais difíceis.",
    clinical: "Colapso do controle inibitório sob carga cognitiva alta.",
  };
}

export function calculateRadarScale(rounds: V2RoundInput[]): RadarScaleResult {
  const rates = rounds.map((r) => {
    const denom = r.hits + r.errors;
    return denom > 0 ? r.errors / denom : 0;
  });

  const mean = rates.reduce((s, v) => s + v, 0) / rates.length;
  const variance = rates.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / rates.length;
  const stdev = Math.sqrt(variance);
  const normalizedStdev = mean > 0 ? stdev / mean : stdev;

  const score = Math.max(0, Math.min(100, Math.round((1 - Math.min(normalizedStdev, 1)) * 100)));

  const { label, short, clinical } = resolveRadarLabel(score);

  return {
    score,
    markerLabel: label,
    shortDescription: short,
    clinicalMeaning: clinical,
  };
}
