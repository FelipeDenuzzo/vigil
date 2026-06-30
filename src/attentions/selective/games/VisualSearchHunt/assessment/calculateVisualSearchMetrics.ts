// src/attentions/selective/games/VisualSearchHunt/assessment/calculateVisualSearchMetrics.ts

import type {
  EngagementStatus,
  ScanPattern,
  VisualSearchDominantPattern,
  VisualSearchMetrics,
  VisualSearchRoundMetrics,
  VisualSearchSessionMetricsInput,
} from './visualSearchScale.types';

// ─── Utilitários ──────────────────────────────────────────────────────────────

function mean(values: number[]): number | null {
  if (!values.length) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function stdDev(values: number[], avg: number): number {
  if (values.length < 2) return 0;
  const variance =
    values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) /
    (values.length - 1);
  return Math.sqrt(variance);
}

function zScore(hitRate: number, faRate: number): number | null {
  const clamp = (v: number) => Math.max(0.001, Math.min(0.999, v));
  const clamped_hr = clamp(hitRate);
  const clamped_fa = clamp(faRate);
  // aproximação z via logit (sem tabela normal)
  const logitHR = Math.log(clamped_hr / (1 - clamped_hr));
  const logitFA = Math.log(clamped_fa / (1 - clamped_fa));
  return (logitHR - logitFA) / 1.7; // escala aproximada
}

// ─── Classificação do padrão dominante ───────────────────────────────────────

function classifyDominantPattern(
  omissionRate: number,
  commissionRate: number
): VisualSearchDominantPattern {
  const omit = omissionRate;
  const comm = commissionRate;

  if (omit < 0.1 && comm < 0.1) return 'adequado';
  if (omit >= 0.2 && comm >= 0.2) return 'misto';
  if (omit >= 0.2) return 'omissao';
  if (comm >= 0.2) return 'comissao';
  if (omit >= 0.1 && omit > comm * 1.5) return 'tendencia_omissao';
  if (comm >= 0.1 && comm > omit * 1.5) return 'tendencia_comissao';
  return 'adequado';
}

// ─── Classificação do d-prime ────────────────────────────────────────────────

export function getDPrimeBand(
  dPrime: number | null
): VisualSearchMetrics['dPrimeBand'] {
  if (dPrime === null) return 'indisponivel';
  if (dPrime >= 3.0) return 'alta';
  if (dPrime >= 2.0) return 'funcional';
  if (dPrime >= 1.0) return 'reduzida';
  return 'fraca';
}

// ─── Engajamento ─────────────────────────────────────────────────────────────

function classifyEngagement(
  totalTargets: number,
  totalRounds: number,
  totalHits: number,
  totalErrors: number
): EngagementStatus {
  if (totalTargets < 10 || totalRounds < 2 || totalHits + totalErrors < 3) {
    return 'insuficiente';
  }
  return 'adequado';
}

// ─── Scan pattern predominante ───────────────────────────────────────────────

function getPredominantScanPattern(
  patterns: (ScanPattern | undefined)[]
): ScanPattern | null {
  const valid = patterns.filter(Boolean) as ScanPattern[];
  if (!valid.length) return null;
  const counts: Record<ScanPattern, number> = {
    'row-wise': 0,
    'column-wise': 0,
    mixed: 0,
  };
  for (const p of valid) counts[p]++;
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return sorted[0][0] as ScanPattern;
}

// ─── Métricas por rodada ──────────────────────────────────────────────────────

function buildRoundMetrics(
  r: VisualSearchSessionMetricsInput['rounds'][number],
  idx: number
): VisualSearchRoundMetrics {
  const omissionRate =
    r.totalTargets > 0 ? r.missedTargets / r.totalTargets : 0;
  const commissionRate =
    r.totalTargets > 0 ? r.errors / r.totalTargets : 0;
  const accuracyRate =
    r.totalTargets > 0 ? r.hits / r.totalTargets : 0;
  const dominantPattern = classifyDominantPattern(omissionRate, commissionRate);
  const reactionTimes = r.reactionTimes ?? [];
  const meanRT =
    reactionTimes.length > 0
      ? reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length
      : undefined;

  return {
    round: r.round ?? idx + 1,
    totalTargets: r.totalTargets,
    hits: r.hits,
    errors: r.errors,
    missedTargets: r.missedTargets,
    omissionRate,
    commissionRate,
    accuracyRate,
    dominantPattern,
    meanReactionTimeMs: meanRT,
    durationMs: r.durationMs,
    organizationIndex: r.organizationIndex,
    scanPattern: r.scanPattern,
    erraticMoves: r.erraticMoves,
    systematicMoves: r.systematicMoves,
    spatialAsymmetryIndex: r.spatialAsymmetryIndex,
    leftSideTargetMisses: r.leftSideTargetMisses,
    rightSideTargetMisses: r.rightSideTargetMisses,
  };
}

// ─── Cálculo principal ────────────────────────────────────────────────────────

export function calculateVisualSearchMetrics(
  session: VisualSearchSessionMetricsInput
): VisualSearchMetrics {
  const { rounds } = session;

  // ── Totais básicos ──
  const totalTargets = rounds.reduce((s, r) => s + r.totalTargets, 0);
  const totalHits = rounds.reduce((s, r) => s + r.hits, 0);
  const totalErrors = rounds.reduce((s, r) => s + r.errors, 0);
  const totalMissedTargets = rounds.reduce((s, r) => s + r.missedTargets, 0);
  const totalRounds = rounds.length;

  const hasDistractorData = rounds.some(
    (r) => r.distractorOpportunities !== undefined
  );
  const totalDistractorOpportunities = hasDistractorData
    ? rounds.reduce((s, r) => s + (r.distractorOpportunities ?? 0), 0)
    : null;

  // ── Taxas ──
  const omissionRate = totalTargets > 0 ? totalMissedTargets / totalTargets : 0;
  const commissionRate = totalTargets > 0 ? totalErrors / totalTargets : 0;
  const accuracyRate = totalTargets > 0 ? totalHits / totalTargets : 0;
  const hitRate = totalTargets > 0 ? totalHits / totalTargets : 0;

  const falseAlarmRate =
    totalDistractorOpportunities && totalDistractorOpportunities > 0
      ? totalErrors / totalDistractorOpportunities
      : null;

  const dPrime =
    falseAlarmRate !== null
      ? zScore(hitRate, falseAlarmRate)
      : null;

  // ── Padrão dominante ──
  const dominantPattern = classifyDominantPattern(omissionRate, commissionRate);
  const hasRelevantDifficulty = dominantPattern !== 'adequado';
  const engagementStatus = classifyEngagement(
    totalTargets,
    totalRounds,
    totalHits,
    totalErrors
  );

  // ── Tempo ──
  const allRTs = rounds.flatMap((r) => r.reactionTimes ?? []);
  const meanRT = allRTs.length > 0 ? mean(allRTs) : null;
  const reactionTimeStdDev =
    meanRT !== null && allRTs.length >= 2
      ? stdDev(allRTs, meanRT)
      : null;
  const totalDurationMs = rounds.reduce((s, r) => s + (r.durationMs ?? 0), 0);

  // ── Varredura visual ──
  const orgIndexes = rounds
    .map((r) => r.organizationIndex)
    .filter((v): v is number => v !== undefined);
  const meanOrganizationIndex = mean(orgIndexes);

  const sysMovesArr = rounds
    .map((r) => r.systematicMoves)
    .filter((v): v is number => v !== undefined);
  const meanSystematicMoves = mean(sysMovesArr);

  const erraticMovesArr = rounds
    .map((r) => r.erraticMoves)
    .filter((v): v is number => v !== undefined);
  const meanErraticMoves = mean(erraticMovesArr);

  const predominantScanPattern = getPredominantScanPattern(
    rounds.map((r) => r.scanPattern)
  );

  // ── Assimetria espacial ──
  const hasAsymmetryData = rounds.some(
    (r) =>
      r.leftSideClicks !== undefined || r.rightSideClicks !== undefined
  );

  const totalLeftClicks = hasAsymmetryData
    ? rounds.reduce((s, r) => s + (r.leftSideClicks ?? 0), 0)
    : null;
  const totalRightClicks = hasAsymmetryData
    ? rounds.reduce((s, r) => s + (r.rightSideClicks ?? 0), 0)
    : null;
  const totalLeftMisses = hasAsymmetryData
    ? rounds.reduce((s, r) => s + (r.leftSideTargetMisses ?? 0), 0)
    : null;
  const totalRightMisses = hasAsymmetryData
    ? rounds.reduce((s, r) => s + (r.rightSideTargetMisses ?? 0), 0)
    : null;

  const asymmetryIndexes = rounds
    .map((r) => r.spatialAsymmetryIndex)
    .filter((v): v is number => v !== undefined);
  const meanSpatialAsymmetryIndex = mean(asymmetryIndexes);

  // ── Perfil de Erros (Atributos) ──
  let shapeErrors = 0;
  let colorErrors = 0;
  let doubleErrors = 0;

  for (const r of rounds) {
    if (!r.clicks) continue;
    for (const click of r.clicks) {
      if (click.isTarget) continue;
      // Trata cliques que não são alvos (erros)
      const shapeMatch = click.clickedShape === click.targetShape;
      const colorMatch = click.clickedColor === click.targetColor;

      if (!shapeMatch && colorMatch) shapeErrors++;
      else if (shapeMatch && !colorMatch) colorErrors++;
      else doubleErrors++;
    }
  }

  const totalAnalyzedErrors = shapeErrors + colorErrors + doubleErrors;
  const shapeErrorRate = totalAnalyzedErrors > 0 ? shapeErrors / totalAnalyzedErrors : 0;
  const colorErrorRate = totalAnalyzedErrors > 0 ? colorErrors / totalAnalyzedErrors : 0;
  const doubleErrorRate = totalAnalyzedErrors > 0 ? doubleErrors / totalAnalyzedErrors : 0;

  // ── Métricas por rodada ──
  const roundMetrics: VisualSearchRoundMetrics[] = rounds.map((r, i) =>
    buildRoundMetrics(r, i)
  );

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
    ludicScore: dPrime !== null ? Math.max(0, Math.min(100, Math.round((dPrime / 4.0) * 100))) : null,
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
    hasSpatialAsymmetry: meanSpatialAsymmetryIndex !== null,
    shapeErrorRate,
    colorErrorRate,
    doubleErrorRate,
    rounds: roundMetrics,
  };
}
