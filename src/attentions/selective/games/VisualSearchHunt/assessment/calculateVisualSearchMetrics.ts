import type {
  VisualSearchDPrimeBand,
  VisualSearchDominantPattern,
  VisualSearchMetrics,
  VisualSearchSessionMetricsInput
} from "./visualSearchScale.types";

function safeDivide(numerator: number, denominator: number): number {
  if (!denominator) return 0;
  return numerator / denominator;
}

function clampProbability(p: number, n: number): number {
  if (n <= 1) return Math.min(0.99, Math.max(0.01, p));
  const min = 1 / n;
  const max = (n - 1) / n;
  return Math.min(max, Math.max(min, p));
}

/**
 * Acklam approximation for inverse normal CDF.
 * Útil para calcular d-prime = z(hitRate) - z(falseAlarmRate).
 */
function inverseNormalCDF(p: number): number {
  const a = [
    -3.969683028665376e+01,
    2.209460984245205e+02,
    -2.759285104469687e+02,
    1.38357751867269e+02,
    -3.066479806614716e+01,
    2.506628277459239e+00
  ];

  const b = [
    -5.447609879822406e+01,
    1.615858368580409e+02,
    -1.556989798598866e+02,
    6.680131188771972e+01,
    -1.328068155288572e+01
  ];

  const c = [
    -7.784894002430293e-03,
    -3.223964580411365e-01,
    -2.400758277161838e+00,
    -2.549732539343734e+00,
    4.374664141464968e+00,
    2.938163982698783e+00
  ];

  const d = [
    7.784695709041462e-03,
    3.224671290700398e-01,
    2.445134137142996e+00,
    3.754408661907416e+00
  ];

  const plow = 0.02425;
  const phigh = 1 - plow;

  if (p < plow) {
    const q = Math.sqrt(-2 * Math.log(p));
    return (
      (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
    );
  }

  if (p > phigh) {
    const q = Math.sqrt(-2 * Math.log(1 - p));
    return -(
      (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
    );
  }

  const q = p - 0.5;
  const r = q * q;

  return (
    (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) *
    q /
    (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1)
  );
}

function getDominantPattern(
  errors: number,
  missedTargets: number,
  omissionRate: number,
  commissionRate: number
): VisualSearchDominantPattern {
  if (errors === 0 && missedTargets === 0) return "adequado";

  if (omissionRate <= 0.1 && commissionRate <= 0.1) return "adequado";
  if (missedTargets > errors * 1.2) return "omissao";
  if (errors > missedTargets * 1.2) return "comissao";

  return "misto";
}

function getDPrimeBand(dPrime: number | null): VisualSearchDPrimeBand {
  if (dPrime === null || Number.isNaN(dPrime)) return "indisponivel";
  if (dPrime >= 2) return "alta";
  if (dPrime >= 1) return "funcional";
  if (dPrime >= 0.5) return "reduzida";
  return "fraca";
}

export function calculateVisualSearchMetrics(
  session: VisualSearchSessionMetricsInput
): VisualSearchMetrics {
  const totalTargets = session.rounds.reduce((acc, round) => acc + round.totalTargets, 0);
  const totalHits = session.rounds.reduce((acc, round) => acc + round.hits, 0);
  const totalErrors = session.rounds.reduce((acc, round) => acc + round.errors, 0);
  const totalMissedTargets = session.rounds.reduce(
    (acc, round) => acc + round.missedTargets,
    0
  );

  const hasDistractorOpportunities = session.rounds.every(
    (round) => typeof round.distractorOpportunities === "number"
  );

  const totalDistractorOpportunities = hasDistractorOpportunities
    ? session.rounds.reduce(
        (acc, round) => acc + (round.distractorOpportunities ?? 0),
        0
      )
    : null;

  const omissionRate = safeDivide(totalMissedTargets, totalTargets);
  const commissionRate = safeDivide(totalErrors, totalHits + totalErrors);
  const accuracyRate = safeDivide(
    totalHits,
    totalHits + totalErrors + totalMissedTargets
  );

  const hitRateRaw = safeDivide(totalHits, totalTargets);
  const hitRate = totalTargets > 0 ? clampProbability(hitRateRaw, totalTargets) : 0;

  const falseAlarmRateRaw =
    totalDistractorOpportunities && totalDistractorOpportunities > 0
      ? safeDivide(totalErrors, totalDistractorOpportunities)
      : null;

  const falseAlarmRate =
    falseAlarmRateRaw !== null && totalDistractorOpportunities
      ? clampProbability(falseAlarmRateRaw, totalDistractorOpportunities)
      : null;

  const dPrime =
    falseAlarmRate !== null
      ? inverseNormalCDF(hitRate) - inverseNormalCDF(falseAlarmRate)
      : null;

  const dominantPattern = getDominantPattern(
    totalErrors,
    totalMissedTargets,
    omissionRate,
    commissionRate
  );

  const rounds = session.rounds.map((round) => {
    const omissionRate = safeDivide(round.missedTargets, round.totalTargets);
    const commissionRate = safeDivide(round.errors, round.hits + round.errors);
    const accuracyRate = safeDivide(
      round.hits,
      round.hits + round.errors + round.missedTargets
    );

    return {
      round: round.round,
      totalTargets: round.totalTargets,
      hits: round.hits,
      errors: round.errors,
      missedTargets: round.missedTargets,
      omissionRate,
      commissionRate,
      accuracyRate,
      dominantPattern: getDominantPattern(
        round.errors,
        round.missedTargets,
        omissionRate,
        commissionRate
      )
    };
  });

  const hasRelevantDifficulty =
    omissionRate >= 0.15 ||
    commissionRate >= 0.2 ||
    dominantPattern === "omissao" ||
    dominantPattern === "comissao" ||
    dominantPattern === "misto";

  return {
    totalTargets,
    totalHits,
    totalErrors,
    totalMissedTargets,
    totalDistractorOpportunities,

    omissionRate,
    commissionRate,
    accuracyRate,

    hitRate,
    falseAlarmRate,
    dPrime,
    dPrimeBand: getDPrimeBand(dPrime),

    dominantPattern,
    hasRelevantDifficulty,

    rounds
  };
}