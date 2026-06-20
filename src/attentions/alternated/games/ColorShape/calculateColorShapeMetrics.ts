import type { TrialResult, ColorShapeMetrics, ColorShapeSeverity } from './types';
import {
  SC_RT_MODERATE, SC_RT_HIGH,
  MC_RT_MODERATE, MC_RT_HIGH,
  PERSEV_FREQUENT,
} from './constants';

function avg(arr: number[]): number {
  if (arr.length === 0) return 0;
  return Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
}
function pct(correct: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((correct / total) * 100);
}
function rtOf(arr: TrialResult[]): number[] {
  return arr.filter(t => !t.timedOut && t.reactionMs > 0).map(t => t.reactionMs);
}
function errorRate(arr: TrialResult[]): number {
  if (arr.length === 0) return 0;
  return Math.round((arr.filter(t => !t.correct).length / arr.length) * 100);
}

export function classifySeverity(
  switchCostRt:   number,
  mixingCostRt:   number,
  perseverations: number,
  mixedAccuracy:  number,
): ColorShapeSeverity {
  if (perseverations > PERSEV_FREQUENT || mixedAccuracy <= 55) return 'importante';
  if (
    perseverations >= 3 ||
    switchCostRt  >  SC_RT_HIGH ||
    mixingCostRt  >  MC_RT_HIGH
  ) return 'moderado';
  if (
    perseverations >= 1 ||
    switchCostRt  >  SC_RT_MODERATE ||
    mixingCostRt  >  MC_RT_MODERATE
  ) return 'leve';
  return 'minimo';
}

export interface ColorShapeTrialGroups {
  /** Trials do bloco A (puro cor) + bloco B (puro forma) — baseline isolado */
  pureTrials:  TrialResult[];
  /** Trials do bloco Misto */
  mixedTrials: TrialResult[];
}

/**
 * Calcula todas as métricas do ColorShape.
 *
 * Recebe os grupos separados para garantir que o baseline puro
 * (mixing cost) venha exclusivamente dos blocos A e B,
 * sem misturar com trials do bloco misto.
 */
export function calculateColorShapeMetrics(
  { pureTrials, mixedTrials }: ColorShapeTrialGroups,
): ColorShapeMetrics {
  const allTrials = [...pureTrials, ...mixedTrials];

  if (allTrials.length === 0) {
    return {
      totalTrials: 0, accuracy: 0, avgRtMs: 0,
      switchTrials: 0, repeatTrials: 0,
      switchAccuracy: 0, repeatAccuracy: 0,
      switchAvgRtMs: 0, repeatAvgRtMs: 0,
      switchCostRtMs: 0, switchCostErrorPp: 0,
      pureTrials: 0, pureAccuracy: 0, pureAvgRtMs: 0,
      mixingCostRtMs: 0, mixingCostErrorPp: 0,
      perseverationErrors: 0, perseverationPct: 0,
      bivalentTrials: 0, bivalentAvgRtMs: 0,
      nonBivalentAvgRtMs: 0, bivalencyEffectMs: 0,
      colorAccuracy: 0, shapeAccuracy: 0,
      colorAvgRtMs: 0, shapeAvgRtMs: 0,
      timeoutCount: 0, timeoutPct: 0,
      severity: 'minimo',
    };
  }

  // ─ Switch / Repeat vem apenas do bloco misto ────────────────────────────────
  const repeats  = mixedTrials.filter(t => t.trialType === 'repeat');
  const switches = mixedTrials.filter(t => t.trialType === 'switch');

  const repeatRt    = avg(rtOf(repeats));
  const switchRt    = avg(rtOf(switches));
  const switchCostRt = switchRt - repeatRt;
  const switchErrPp  = errorRate(switches) - errorRate(repeats);

  // ─ Mixing Cost: baseline puro (A+B) vs repeat do misto ──────────────────────
  const pureRt      = avg(rtOf(pureTrials));
  const mixingCostRt = repeatRt - pureRt;
  const mixingErrPp  = errorRate(repeats) - errorRate(pureTrials);

  // ─ Perseveração (apenas switches do misto) ────────────────────────────────
  const perseverations = switches.filter(t => t.isPerseveration).length;

  // ─ Bivalência (todos os trials) ───────────────────────────────────────────
  const bivalent      = allTrials.filter(t => t.isBivalent);
  const nonBivalent   = allTrials.filter(t => !t.isBivalent && t.trialType !== 'first');
  const bivalentRt    = avg(rtOf(bivalent));
  const nonBivalentRt = avg(rtOf(nonBivalent));

  // ─ Por regra (todos os trials) ─────────────────────────────────────────────
  const colors = allTrials.filter(t => t.rule === 'color');
  const shapes = allTrials.filter(t => t.rule === 'shape');

  // ─ Acurácia do bloco misto (switch + repeat) ────────────────────────────
  const mixedWithoutFirst = mixedTrials.filter(t => t.trialType !== 'first');
  const mixedAccuracy = pct(
    mixedWithoutFirst.filter(t => t.correct).length,
    mixedWithoutFirst.length,
  );

  const timedOut = allTrials.filter(t => t.timedOut);

  const severity = classifySeverity(
    switchCostRt, mixingCostRt, perseverations, mixedAccuracy,
  );

  return {
    totalTrials:          allTrials.length,
    accuracy:             pct(allTrials.filter(t => t.correct).length, allTrials.length),
    avgRtMs:              avg(rtOf(allTrials)),
    switchTrials:         switches.length,
    repeatTrials:         repeats.length,
    switchAccuracy:       pct(switches.filter(t => t.correct).length, switches.length),
    repeatAccuracy:       pct(repeats.filter(t => t.correct).length, repeats.length),
    switchAvgRtMs:        switchRt,
    repeatAvgRtMs:        repeatRt,
    switchCostRtMs:       switchCostRt,
    switchCostErrorPp:    switchErrPp,
    pureTrials:           pureTrials.length,
    pureAccuracy:         pct(pureTrials.filter(t => t.correct).length, pureTrials.length),
    pureAvgRtMs:          pureRt,
    mixingCostRtMs:       mixingCostRt,
    mixingCostErrorPp:    mixingErrPp,
    perseverationErrors:  perseverations,
    perseverationPct:     pct(perseverations, switches.length || 1),
    bivalentTrials:       bivalent.length,
    bivalentAvgRtMs:      bivalentRt,
    nonBivalentAvgRtMs:   nonBivalentRt,
    bivalencyEffectMs:    bivalentRt - nonBivalentRt,
    colorAccuracy:        pct(colors.filter(t => t.correct).length, colors.length),
    shapeAccuracy:        pct(shapes.filter(t => t.correct).length, shapes.length),
    colorAvgRtMs:         avg(rtOf(colors)),
    shapeAvgRtMs:         avg(rtOf(shapes)),
    timeoutCount:         timedOut.length,
    timeoutPct:           pct(timedOut.length, allTrials.length),
    severity,
  };
}
