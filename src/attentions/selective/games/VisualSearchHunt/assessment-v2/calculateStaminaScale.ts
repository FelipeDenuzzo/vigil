/* src/attentions/selective/games/VisualSearchHunt/assessment-v2/calculateStaminaScale.ts */
/* Régua de Fôlego Mental — Sustentação */
/* Atualizado em: 01/06/2026 */

import type { V2RoundInput, StaminaScaleResult } from "./visualSearchV2.types";

// Mede queda de desempenho entre o início e o fim da sessão.
// Compara acurácia média do primeiro terço vs. último terço das rodadas.

function resolveStaminaLabel(score: number) {
  if (score >= 80) return {
    label: "Bateria Cheia",
    short: "Desempenho estável do início ao fim.",
    clinical: "Atenção sustentada preservada; sem sinais de fadiga cognitiva.",
  };
  if (score >= 60) return {
    label: "Bateria Estável",
    short: "Pequena queda no final, dentro do esperado.",
    clinical: "Leve declínio de vigilância, comum em tarefas prolongadas.",
  };
  if (score >= 40) return {
    label: "Bateria Fraca",
    short: "Queda relevante de desempenho na segunda metade.",
    clinical: "Possível fadiga atencional. Recomendado avaliar padrão em múltiplas sessões.",
  };
  return {
    label: "Bateria Esgotada",
    short: "Colapso de desempenho nas rodadas finais.",
    clinical: "Déficit de atenção sustentada; vigilância muito reduzida ao final da tarefa.",
  };
}

export function calculateStaminaScale(rounds: V2RoundInput[]): StaminaScaleResult {
  function roundAccuracy(r: V2RoundInput): number {
    const denom = r.hits + r.errors + r.missedTargets;
    return denom > 0 ? r.hits / denom : 0;
  }

  const accs = rounds.map(roundAccuracy);
  const n = accs.length;
  const third = Math.max(1, Math.floor(n / 3));

  const earlyAvg = accs.slice(0, third).reduce((s, v) => s + v, 0) / third;
  const lateAvg = accs.slice(-third).reduce((s, v) => s + v, 0) / third;
  const drop = earlyAvg - lateAvg;

  const score = Math.max(0, Math.min(100, Math.round((1 - drop) * 100)));

  const last3 = accs.slice(-3);
  const vigilanceDropDetected = drop > 0.35 || last3.every((a) => a < 0.4);

  const { label, short, clinical } = resolveStaminaLabel(score);

  return {
    score,
    markerLabel: label,
    shortDescription: short,
    clinicalMeaning: clinical,
    vigilanceDropDetected,
  };
}
