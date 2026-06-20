import type { TrialResult, ColorShapeMetrics } from './types';

function avg(arr: number[]): number {
  if (arr.length === 0) return 0;
  return Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
}
function pct(correct: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((correct / total) * 100);
}

export function calculateColorShapeMetrics(trials: TrialResult[]): ColorShapeMetrics {
  // exclui 'first' trial e timeouts do cálculo de RT
  const scored   = trials.filter(t => t.trialType !== 'first');
  const repeats  = scored.filter(t => t.trialType === 'repeat');
  const switches = scored.filter(t => t.trialType === 'switch');
  const colors   = trials.filter(t => t.rule === 'color');
  const shapes   = trials.filter(t => t.rule === 'shape');

  const rtOf = (arr: TrialResult[]) =>
    arr.filter(t => !t.timedOut && t.reactionMs > 0).map(t => t.reactionMs);

  const repeatRt  = avg(rtOf(repeats));
  const switchRt  = avg(rtOf(switches));
  const repeatErr = 100 - pct(repeats.filter(t => t.correct).length, repeats.length);
  const switchErr = 100 - pct(switches.filter(t => t.correct).length, switches.length);

  const timedOut = trials.filter(t => t.timedOut);

  return {
    totalTrials:     trials.length,
    accuracy:        pct(trials.filter(t => t.correct).length, trials.length),
    avgRtMs:         avg(rtOf(trials)),
    repeatAccuracy:  pct(repeats.filter(t => t.correct).length, repeats.length),
    switchAccuracy:  pct(switches.filter(t => t.correct).length, switches.length),
    repeatAvgRtMs:   repeatRt,
    switchAvgRtMs:   switchRt,
    switchCostRtMs:  switchRt - repeatRt,
    switchCostError: switchErr - repeatErr,
    colorAccuracy:   pct(colors.filter(t => t.correct).length, colors.length),
    shapeAccuracy:   pct(shapes.filter(t => t.correct).length, shapes.length),
    colorAvgRtMs:    avg(rtOf(colors)),
    shapeAvgRtMs:    avg(rtOf(shapes)),
    timeoutCount:    timedOut.length,
    timeoutPct:      pct(timedOut.length, trials.length),
  };
}
