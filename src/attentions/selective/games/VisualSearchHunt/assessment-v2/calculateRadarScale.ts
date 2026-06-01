// assessment-v2/calculateRadarScale.ts
import type { V2RoundInput, RadarScaleResult } from "./visualSearchV2.types";

export function calculateRadarScale(rounds: V2RoundInput[]): RadarScaleResult {
  const rates = rounds.map((r) => {
    const denom = r.hits + r.errors;
    return denom > 0 ? r.errors / denom : 0;
  });

  const mean = rates.reduce((s, v) => s + v, 0) / rates.length;
  const variance =
    rates.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / rates.length;
  const stdev = Math.sqrt(variance);
  const normalizedStdev = mean > 0 ? stdev / mean : stdev;

  const score = Math.max(
    0,
    Math.min(100, Math.round((1 - Math.min(normalizedStdev, 1)) * 100))
  );

  return { score, ...resolveRadarLabel(score) };
}

function resolveRadarLabel(score: number) {
  if (score >= 80)
    return {
      markerLabel: "Radar Calibrado",
      shortDescription: "Erros consistentemente baixos em todos os níveis.",
      clinicalMeaning: "Controle inibitório estável ao longo da sessão.",
    };
  if (score >= 60)
    return {
      markerLabel: "Radar Oscilante",
      shortDescription: "Erros variaram entre rodadas sem padrão claro.",
      clinicalMeaning:
        "Controle inibitório instável; pode indicar fadiga ou impulsividade situacional.",
    };
  if (score >= 40)
    return {
      markerLabel: "Radar em Pânico",
      shortDescription: "Oscilação alta — do bom ao ruim dentro da mesma sessão.",
      clinicalMeaning: "Dificuldade em manter critério de seleção estável.",
    };
  return {
    markerLabel: "Radar Perdido",
    shortDescription: "Erros aumentaram drasticamente nas rodadas mais difíceis.",
    clinicalMeaning: "Colapso do controle inibitório sob carga cognitiva alta.",
  };
}
