// src/assessment/insetos/calculateInsetosMetrics.ts

import type { InsetosRawEvent, InsetosMetrics } from './types';

export function calculateInsetosMetrics(events: InsetosRawEvent[]): InsetosMetrics {
  const hits = events.filter(e => e.type === 'hit');
  const omissions = events.filter(e => e.type === 'omission');
  const commissions = events.filter(e => e.type === 'commission_error');

  const totalHits = hits.length;
  const totalOmissions = omissions.length;
  const totalTrials = totalHits + totalOmissions;
  const accuracyPct = totalTrials > 0 ? (totalHits / totalTrials) * 100 : null;

  // meanRT
  const rts = hits.filter(e => e.rt != null).map(e => e.rt as number);
  const meanRT = rts.length > 0 ? rts.reduce((a, b) => a + b, 0) / rts.length : null;

  // switchCost: RT médio pós-switch vs RT médio fora da janela
  const postSwitchHits = hits.filter(e => e.isPostSwitch && e.rt != null);
  const normalHits = hits.filter(e => !e.isPostSwitch && e.rt != null);
  const avgPostSwitch = postSwitchHits.length > 0
    ? postSwitchHits.reduce((a, e) => a + (e.rt ?? 0), 0) / postSwitchHits.length
    : null;
  const avgNormal = normalHits.length > 0
    ? normalHits.reduce((a, e) => a + (e.rt ?? 0), 0) / normalHits.length
    : null;
  const switchCostMs = avgPostSwitch != null && avgNormal != null
    ? avgPostSwitch - avgNormal
    : null;

  // multiTrackCost: precisão fases 1–2 vs 3–6
  const earlyTrials = events.filter(e =>
    (e.type === 'hit' || e.type === 'omission') && e.phase <= 2
  );
  const lateTrials = events.filter(e =>
    (e.type === 'hit' || e.type === 'omission') && e.phase >= 3
  );
  const earlyAcc = earlyTrials.length > 0
    ? (earlyTrials.filter(e => e.type === 'hit').length / earlyTrials.length) * 100
    : null;
  const lateAcc = lateTrials.length > 0
    ? (lateTrials.filter(e => e.type === 'hit').length / lateTrials.length) * 100
    : null;
  const multiTrackCostPct = earlyAcc != null && lateAcc != null
    ? earlyAcc - lateAcc
    : null;

  // vigilanceDecay: omission rate 1º terço vs 3º terço (por timestamp)
  const allTrialEvents = events.filter(e => e.type === 'hit' || e.type === 'omission');
  const third = Math.floor(allTrialEvents.length / 3);
  const firstThird = allTrialEvents.slice(0, third);
  const lastThird = allTrialEvents.slice(allTrialEvents.length - third);
  const omRateFirst = firstThird.length > 0
    ? (firstThird.filter(e => e.type === 'omission').length / firstThird.length) * 100
    : null;
  const omRateLast = lastThird.length > 0
    ? (lastThird.filter(e => e.type === 'omission').length / lastThird.length) * 100
    : null;
  const vigilanceDecayPct = omRateFirst != null && omRateLast != null
    ? omRateLast - omRateFirst  // positivo = piorou no final
    : null;

  return {
    meanRT,
    omissions: totalOmissions,
    commissionErrors: commissions.length,
    switchCostMs,
    multiTrackCostPct,
    vigilanceDecayPct,
    totalHits,
    totalTrials,
    accuracyPct,
  };
}
