// src/assessment/colorShape/calculateColorShapeMetrics.ts

import type { TrialResult, ColorShapeMetrics } from './types';

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

export interface ColorShapeTrialGroups {
  pureTrials:  TrialResult[];
  mixedTrials: TrialResult[];
}

export function calculateColorShapeMetrics(
  { pureTrials, mixedTrials }: ColorShapeTrialGroups,
): ColorShapeMetrics {
  const allTrials = [...pureTrials, ...mixedTrials];

  const empty: ColorShapeMetrics = {
    totalTrials: 0, accuracy: 0, avgRtMs: 0,
    switchTrials: 0, repeatTrials: 0,
    switchAccuracy: 0, repeatAccuracy: 0,
    switchAvgRtMs: 0, repeatAvgRtMs: 0,
    switchCostRtMs: 0, switchCostErrorPp: 0,
    pureTrials: 0, pureAccuracy: 0, pureAvgRtMs: 0,
    mixingCostRtMs: 0, mixingCostErrorPp: 0,
    perseverationErrors: 0, perseverationPct: 0,
    colorAccuracy: 0, shapeAccuracy: 0,
    colorAvgRtMs: 0, shapeAvgRtMs: 0,
    timeoutCount: 0, timeoutPct: 0,
  };
  if (allTrials.length === 0) return empty;

  // ─ Switch / Repeat — apenas bloco misto ──────────────────────────────────
  const repeats  = mixedTrials.filter(t => t.trialType === 'repeat');
  const switches = mixedTrials.filter(t => t.trialType === 'switch');
  const repeatRt     = avg(rtOf(repeats));
  const switchRt     = avg(rtOf(switches));
  const switchCostRt = switchRt - repeatRt;
  const switchErrPp  = errorRate(switches) - errorRate(repeats);

  // ─ Mixing Cost — baseline A+B vs repeat misto ────────────────────────────
  const pureRt       = avg(rtOf(pureTrials));
  const mixingCostRt = repeatRt - pureRt;
  const mixingErrPp  = errorRate(repeats) - errorRate(pureTrials);

  // ─ Perseveração ───────────────────────────────────────────────────────────
  const perseverations = switches.filter(t => t.isPerseveration).length;

  // ─ Por regra ──────────────────────────────────────────────────────────────
  const colors = allTrials.filter(t => t.rule === 'color');
  const shapes = allTrials.filter(t => t.rule === 'shape');

  // ─ Acurácia global ────────────────────────────────────────────────────────
  const totalCorrect = allTrials.filter(t => t.correct).length;
  const accuracy     = pct(totalCorrect, allTrials.length);
  const avgRt        = avg(rtOf(allTrials));
  const timedOut     = allTrials.filter(t => t.timedOut);

  // Conversão Lúdica (Agilidade de Adaptação)
  const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));
  const ludicScore = Math.round(clamp(100 - ((switchCostRt - 200) / 6), 0, 100));

  return {
    totalTrials:         allTrials.length,
    accuracy,
    avgRtMs:             avgRt,
    switchTrials:        switches.length,
    repeatTrials:        repeats.length,
    switchAccuracy:      pct(switches.filter(t => t.correct).length, switches.length),
    repeatAccuracy:      pct(repeats.filter(t => t.correct).length, repeats.length),
    switchAvgRtMs:       switchRt,
    repeatAvgRtMs:       repeatRt,
    switchCostRtMs:      switchCostRt,
    switchCostErrorPp:   switchErrPp,
    pureTrials:          pureTrials.length,
    pureAccuracy:        pct(pureTrials.filter(t => t.correct).length, pureTrials.length),
    pureAvgRtMs:         pureRt,
    mixingCostRtMs:      mixingCostRt,
    mixingCostErrorPp:   mixingErrPp,
    perseverationErrors: perseverations,
    perseverationPct:    pct(perseverations, switches.length || 1),
    colorAccuracy:       pct(colors.filter(t => t.correct).length, colors.length),
    shapeAccuracy:       pct(shapes.filter(t => t.correct).length, shapes.length),
    colorAvgRtMs:        avg(rtOf(colors)),
    shapeAvgRtMs:        avg(rtOf(shapes)),
    timeoutCount:        timedOut.length,
    timeoutPct:          pct(timedOut.length, allTrials.length),
    ludicScore,
  };
}
