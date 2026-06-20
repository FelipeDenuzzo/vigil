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
  return Math.round(((arr.filter(t => !t.correct).length) / arr.length) * 100);
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

export function calculateColorShapeMetrics(trials: TrialResult[]): ColorShapeMetrics {
  if (trials.length === 0) {
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

  const pure     = trials.filter(t => t.trialType === 'pure');
  const repeats  = trials.filter(t => t.trialType === 'repeat');
  const switches = trials.filter(t => t.trialType === 'switch');
  const colors   = trials.filter(t => t.rule === 'color');
  const shapes   = trials.filter(t => t.rule === 'shape');

  const bivalent    = trials.filter(t => t.isBivalent);
  const nonBivalent = trials.filter(t => !t.isBivalent && t.trialType !== 'first');
  const bivalentRt    = avg(rtOf(bivalent));
  const nonBivalentRt = avg(rtOf(nonBivalent));

  const perseverations = trials.filter(t => t.isPerseveration).length;

  const repeatRt    = avg(rtOf(repeats));
  const switchRt    = avg(rtOf(switches));
  const pureRt      = avg(rtOf(pure));
  const switchErrPp = errorRate(switches) - errorRate(repeats);
  const mixingErrPp = errorRate(repeats)  - errorRate(pure);

  const switchCostRt = switchRt - repeatRt;
  const mixingCostRt = repeatRt - pureRt;

  const mixed = [...repeats, ...switches];
  const mixedAccuracy = pct(mixed.filter(t => t.correct).length, mixed.length);

  const timedOut = trials.filter(t => t.timedOut);

  const severity = classifySeverity(
    switchCostRt, mixingCostRt, perseverations, mixedAccuracy,
  );

  return {
    totalTrials:          trials.length,
    accuracy:             pct(trials.filter(t => t.correct).length, trials.length),
    avgRtMs:              avg(rtOf(trials)),
    switchTrials:         switches.length,
    repeatTrials:         repeats.length,
    switchAccuracy:       pct(switches.filter(t => t.correct).length, switches.length),
    repeatAccuracy:       pct(repeats.filter(t => t.correct).length, repeats.length),
    switchAvgRtMs:        switchRt,
    repeatAvgRtMs:        repeatRt,
    switchCostRtMs:       switchCostRt,
    switchCostErrorPp:    switchErrPp,
    pureTrials:           pure.length,
    pureAccuracy:         pct(pure.filter(t => t.correct).length, pure.length),
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
    timeoutPct:           pct(timedOut.length, trials.length),
    severity,
  };
}
