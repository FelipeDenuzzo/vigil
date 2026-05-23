import { calculateVisualSearchMetrics } from "./calculateVisualSearchMetrics";
import {
  getVisualSearchScaleDefinition,
  VISUAL_SEARCH_CLINICAL_NAME,
  VISUAL_SEARCH_SCALE_NAME
} from "./visualSearchScaleDefinitions";
import type {
  VisualSearchScaleLevel,
  VisualSearchScaleResult,
  VisualSearchSessionMetricsInput
} from "./visualSearchScale.types";

function decideScaleLevel(params: {
  omissionRate: number;
  commissionRate: number;
  dPrime: number | null;
}): VisualSearchScaleLevel {
  const { omissionRate, commissionRate, dPrime } = params;

  if (
    omissionRate <= 0.08 &&
    commissionRate <= 0.12 &&
    (dPrime === null || dPrime >= 1.5)
  ) {
    return 1;
  }

  if (
    omissionRate <= 0.16 &&
    commissionRate <= 0.24 &&
    (dPrime === null || dPrime >= 1.0)
  ) {
    return 2;
  }

  if (
    omissionRate <= 0.28 &&
    commissionRate <= 0.38 &&
    (dPrime === null || dPrime >= 0.5)
  ) {
    return 3;
  }

  return 4;
}

function buildSummary(params: {
  label: string;
  dominantPattern: string;
  omissionRate: number;
  commissionRate: number;
  dPrime: number | null;
}) {
  const { label, dominantPattern, omissionRate, commissionRate, dPrime } = params;

  const dPrimeText =
    dPrime === null ? "d-prime indisponível" : `d-prime ${dPrime.toFixed(2)}`;

  return `${label}. Perfil ${dominantPattern}. Omissões ${omissionRate.toFixed(
    2
  )}, comissões ${commissionRate.toFixed(2)} e ${dPrimeText}.`;
}

export function buildVisualSearchScaleResult(
  session: VisualSearchSessionMetricsInput
): VisualSearchScaleResult {
  const metrics = calculateVisualSearchMetrics(session);

  const level = decideScaleLevel({
    omissionRate: metrics.omissionRate,
    commissionRate: metrics.commissionRate,
    dPrime: metrics.dPrime
  });

  const definition = getVisualSearchScaleDefinition(level);

  return {
    scaleName: VISUAL_SEARCH_SCALE_NAME,
    clinicalName: VISUAL_SEARCH_CLINICAL_NAME,
    level,
    label: definition.label,
    emoji: definition.emoji,
    colorToken: definition.colorToken,
    shortDescription: definition.shortDescription,
    clinicalMeaning: definition.clinicalMeaning,
    answer: metrics.hasRelevantDifficulty ? "sim" : "nao",
    dominantPattern: metrics.dominantPattern,
    dPrimeBand: metrics.dPrimeBand,
    summary: buildSummary({
      label: definition.label,
      dominantPattern: metrics.dominantPattern,
      omissionRate: metrics.omissionRate,
      commissionRate: metrics.commissionRate,
      dPrime: metrics.dPrime
    })
  };
}