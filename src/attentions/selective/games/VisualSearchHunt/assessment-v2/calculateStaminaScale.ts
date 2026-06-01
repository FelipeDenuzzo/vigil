// assessment-v2/calculateStaminaScale.ts
import type { V2RoundInput, StaminaScaleResult } from "./visualSearchV2.types";

export function calculateStaminaScale(rounds: V2RoundInput[]): StaminaScaleResult {
  function roundAccuracy(r: V2RoundInput): number {
    const denom = r.hits + r.errors + r.missedTargets;
    return denom > 0 ? r.hits / denom : 0;
  }

  const accs = rounds.map(roundAccuracy);
  const n = accs.length;
  const third = Math.max(1, Math.floor(n / 3));

  const earlyAvg =
    accs.slice(0, third).reduce((s, v) => s + v, 0) / third;
  const lateAvg =
    accs.slice(-third).reduce((s, v) => s + v, 0) / third;
  const drop = earlyAvg - lateAvg;

  const score = Math.max(0, Math.min(100, Math.round((1 - drop) * 100)));
  const last3 = accs.slice(-3);
  const vigilanceDropDetected = drop > 0.35 || last3.every((a) => a < 0.4);

  return {
    score,
    vigilanceDropDetected,
    ...resolveStaminaLabel(score),
  };
}

function resolveStaminaLabel(score: number) {
  if (score >= 80)
    return {
      markerLabel: "Bateria Cheia",
      shortDescription: "Desempenho estável do início ao fim.",
      clinicalMeaning: "Atenção sustentada preservada; sem sinais de fadiga cognitiva.",
    };
  if (score >= 60)
    return {
      markerLabel: "Bateria Estável",
      shortDescription: "Pequena queda no final, dentro do esperado.",
      clinicalMeaning: "Leve declínio de vigilância, comum em tarefas prolongadas.",
    };
  if (score >= 40)
    return {
      markerLabel: "Bateria Fraca",
      shortDescription: "Queda relevante de desempenho na segunda metade.",
      clinicalMeaning:
        "Possível fadiga atencional. Recomendado avaliar padrão em múltiplas sessões.",
    };
  return {
    markerLabel: "Bateria Esgotada",
    shortDescription: "Colapso de desempenho nas rodadas finais.",
    clinicalMeaning:
      "Déficit de atenção sustentada; vigilância muito reduzida ao final da tarefa.",
  };
}
