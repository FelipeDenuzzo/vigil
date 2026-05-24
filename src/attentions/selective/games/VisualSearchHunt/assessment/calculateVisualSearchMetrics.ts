// src/attentions/selective/games/VisualSearchHunt/assessment/calculateVisualSearchMetrics.ts

import type {
  EngagementStatus,
  ScanPattern,
  VisualSearchDPrimeBand,
  VisualSearchDominantPattern,
  VisualSearchMetrics,
  VisualSearchRoundMetrics,
  VisualSearchSessionMetricsInput
} from './visualSearchScale.types';

// ─── Utilitários ──────────────────────────────────────────────────────────

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

function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function stdDev(values: number[], meanValue: number): number | null {
  if (values.length < 2) return null;
  const variance =
    values.reduce((acc, v) => acc + Math.pow(v - meanValue, 2), 0) /
    (values.length - 1);
  return Math.sqrt(variance);
}

// ─── d’ (d-prime) ────────────────────────────────────────────────────────

function inverseNormalCDF(p: number): number {
  const a = [
    -39.69683028665376, 220.9460984245205, -275.9285104469687,
    138.357751867269, -30.66479806614716, 2.506628277459239
  ];
  const b = [
    -54.47609879822406, 161.5858368580409, -155.6989798598866,
    66.80131188771972, -13.28068155288572
  ];
  const c = [
    -0.007784894002430293, -0.3223964580411365, -2.400758277161838,
    -2.549732539343734, 4.374664141464968, 2.938163982698783
  ];
  const d = [
    0.007784695709041462, 0.3224671290700398, 2.445134137142996,
    3.754408661907416
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

function getDPrimeBand(dPrime: number | null): VisualSearchDPrimeBand {
  if (dPrime === null || Number.isNaN(dPrime)) return 'indisponivel';
  if (dPrime >= 2) return 'alta';
  if (dPrime >= 1) return 'funcional';
  if (dPrime >= 0.5) return 'reduzida';
  return 'fraca';
}

// ─── Padrão dominante ────────────────────────────────────────────────────

function getDominantPattern(
  errors: number,
  missedTargets: number,
  omissionRate: number,
  commissionRate: number
): VisualSearchDominantPattern {
  if (errors === 0 && missedTargets === 0) return 'adequado';
  if (omissionRate <= 0.1 && commissionRate <= 0.1) {
    // tendencias leves
    if (omissionRate > commissionRate + 0.05) return 'tendencia_omissao';
    if (commissionRate > omissionRate + 0.05) return 'tendencia_comissao';
    return 'adequado';
  }
  const bothHigh = omissionRate >= 0.2 && commissionRate >= 0.2;
  if (bothHigh && Math.abs(omissionRate - commissionRate) <= 0.1) return 'misto';
  if (omissionRate >= 0.2 && omissionRate > commissionRate) return 'omissao';
  if (commissionRate >= 0.2 && commissionRate > omissionRate) return 'comissao';
  if (omissionRate >= 0.1 && omissionRate > commissionRate + 0.05) return 'tendencia_omissao';
  if (commissionRate >= 0.1 && commissionRate > omissionRate + 0.05) return 'tendencia_comissao';
  return 'adequado';
}

// ─── Engajamento ─────────────────────────────────────────────────────────

function getEngagementStatus(
  totalTargets: number,
  totalRounds: number,
  totalHits: number,
  totalErrors: number
): EngagementStatus {
  if (totalTargets < 20 || totalRounds < 3) return 'insuficiente';
  if (totalHits + totalErrors < 5) return 'insuficiente';
  return 'adequado';
}

// ─── Varredura visual dominante da sessão ─────────────────────────────────────

function getPredominantScanPattern(
  patterns: Array<ScanPattern | undefined>
): ScanPattern | null {
  const valid = patterns.filter(Boolean) as ScanPattern[];
  if (valid.length === 0) return null;
  const counts: Record<ScanPattern, number> = { 'row-wise': 0, 'column-wise': 0, mixed: 0 };
  valid.forEach((p) => counts[p]++);
  return (Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0] as ScanPattern);
}

// ─── Cálculo principal ──────────────────────────────────────────────────────────

export function calculateVisualSearchMetrics(
  session: VisualSearchSessionMetricsInput
): VisualSearchMetrics {
  const totalTargets = session.rounds.reduce((acc, r) => acc + r.totalTargets, 0);
  const totalHits = session.rounds.reduce((acc, r) => acc + r.hits, 0);
  const totalErrors = session.rounds.reduce((acc, r) => acc + r.errors, 0);
  const totalMissedTargets = session.rounds.reduce((acc, r) => acc + r.missedTargets, 0);
  const totalRounds = session.rounds.length;
  const totalDurationMs = session.rounds.reduce((acc, r) => acc + (r.durationMs ?? 0), 0);

  // distractorOpportunities
  const hasDistractorOpportunities = session.rounds.every(
    (r) => typeof r.distractorOpportunities === 'number'
  );
  const totalDistractorOpportunities = hasDistractorOpportunities
    ? session.rounds.reduce((acc, r) => acc + (r.distractorOpportunities ?? 0), 0)
    : null;

  // taxas
  const omissionRate = safeDivide(totalMissedTargets, totalTargets);
  const commissionRate = safeDivide(totalErrors, totalHits + totalErrors);
  const accuracyRate = safeDivide(totalHits, totalHits + totalErrors + totalMissedTargets);

  // hit rate / false alarm / d-prime
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

  // padrão / engajamento
  const dominantPattern = getDominantPattern(
    totalErrors, totalMissedTargets, omissionRate, commissionRate
  );
  const engagementStatus = getEngagementStatus(
    totalTargets, totalRounds, totalHits, totalErrors
  );
  const hasRelevantDifficulty =
    omissionRate >= 0.15 ||
    commissionRate >= 0.2 ||
    dominantPattern === 'omissao' ||
    dominantPattern === 'comissao' ||
    dominantPattern === 'misto';

  // ── tempo / velocidade
  const allReactionTimes = session.rounds.flatMap((r) => r.reactionTimes ?? []);
  const meanRT = mean(allReactionTimes);
  const reactionTimeStdDev = meanRT !== null ? stdDev(allReactionTimes, meanRT) : null;

  // ── varredura visual
  const orgIndexes = session.rounds
    .map((r) => r.organizationIndex)
    .filter((v): v is number => v !== undefined);
  const systematicArr = session.rounds
    .map((r) => r.systematicMoves)
    .filter((v): v is number => v !== undefined);
  const erraticArr = session.rounds
    .map((r) => r.erraticMoves)
    .filter((v): v is number => v !== undefined);
  const scanPatterns = session.rounds.map((r) => r.scanPattern);

  const meanOrganizationIndex = mean(orgIndexes);
  const meanSystematicMoves = mean(systematicArr);
  const meanErraticMoves = mean(erraticArr);
  const predominantScanPattern = getPredominantScanPattern(scanPatterns);

  // ── assimetria espacial
  const hasAsymmetryData = session.rounds.some(
    (r) => r.leftSideClicks !== undefined || r.rightSideClicks !== undefined
  );
  const totalLeftClicks = hasAsymmetryData
    ? session.rounds.reduce((acc, r) => acc + (r.leftSideClicks ?? 0), 0)
    : null;
  const totalRightClicks = hasAsymmetryData
    ? session.rounds.reduce((acc, r) => acc + (r.rightSideClicks ?? 0), 0)
    : null;
  const totalLeftMisses = hasAsymmetryData
    ? session.rounds.reduce((acc, r) => acc + (r.leftSideTargetMisses ?? 0), 0)
    : null;
  const totalRightMisses = hasAsymmetryData
    ? session.rounds.reduce((acc, r) => acc + (r.rightSideTargetMisses ?? 0), 0)
    : null;
  const asymmetryIndexes = session.rounds
    .map((r) => r.spatialAsymmetryIndex)
    .filter((v): v is number => v !== undefined);
  const meanSpatialAsymmetryIndex = mean(asymmetryIndexes);

  // ── métricas por rodada
  const rounds: VisualSearchRoundMetrics[] = session.rounds.map((r) => {
    const roundOmission = safeDivide(r.missedTargets, r.totalTargets);
    const roundCommission = safeDivide(r.errors, r.hits + r.errors);
    const roundAccuracy = safeDivide(
      r.hits, r.hits + r.errors + r.missedTargets
    );
    const roundMeanRT = r.reactionTimes ? mean(r.reactionTimes) : undefined;
    return {
      round: r.round,
      totalTargets: r.totalTargets,
      hits: r.hits,
      errors: r.errors,
      missedTargets: r.missedTargets,
      omissionRate: roundOmission,
      commissionRate: roundCommission,
      accuracyRate: roundAccuracy,
      dominantPattern: getDominantPattern(
        r.errors, r.missedTargets, roundOmission, roundCommission
      ),
      meanReactionTimeMs: roundMeanRT ?? undefined,
      durationMs: r.durationMs,
      organizationIndex: r.organizationIndex,
      scanPattern: r.scanPattern,
      erraticMoves: r.erraticMoves,
      systematicMoves: r.systematicMoves,
      spatialAsymmetryIndex: r.spatialAsymmetryIndex,
      leftSideTargetMisses: r.leftSideTargetMisses,
      rightSideTargetMisses: r.rightSideTargetMisses
    };
  });

  return {
    totalTargets,
    totalHits,
    totalErrors,
    totalMissedTargets,
    totalDistractorOpportunities,
    totalRounds,
    omissionRate,
    commissionRate,
    accuracyRate,
    hitRate,
    falseAlarmRate,
    dPrime,
    dPrimeBand: getDPrimeBand(dPrime),
    dominantPattern,
    hasRelevantDifficulty,
    engagementStatus,
    totalDurationMs,
    meanReactionTimeMs: meanRT,
    reactionTimeStdDev,
    meanOrganizationIndex,
    meanSystematicMoves,
    meanErraticMoves,
    predominantScanPattern,
    totalLeftClicks,
    totalRightClicks,
    totalLeftMisses,
    totalRightMisses,
    meanSpatialAsymmetryIndex,
    rounds
  };
}
