// src/assessment/acharOFaltando/calculateAcharOFaltandoMetrics.ts
import { MissingItemRoundResult } from '../../attentions/selective/games/AcharOFaltando/types';
import { AcharOFaltandoMetrics, PhaseMetrics } from './types';
import { computeMetrics } from '../../attentions/selective/games/AcharOFaltando/logic';
import { FAST_THRESHOLD_MS, SLOW_THRESHOLD_MS, HIGH_FP_THRESHOLD } from './acharOFaltandoScaleDefinitions';

const PHASE_LABELS: Record<number, string> = {
  1: 'Símbolos Clássicos I',
  2: 'Símbolos Clássicos II',
  3: 'Triângulos e Círculos',
  4: 'Busca Q/O (mais Q)',
  5: 'Busca O/Q (mais O)',
  6: 'Busca Serial O/Q com Distratores',
  7: 'Dígitos 2/7',
  8: 'Busca 2/7 com Distratores',
  9: 'Letras Espelhadas d/p',
  10: 'Estímulos Mistos',
};

function normInv(p: number): number {
  const clamped = Math.max(0.001, Math.min(0.999, p));
  const a = [2.515517, 0.802853, 0.010328];
  const b = [1.432788, 0.189269, 0.001308];
  const t = Math.sqrt(-2 * Math.log(clamped <= 0.5 ? clamped : 1 - clamped));
  const num = a[0] + a[1] * t + a[2] * t * t;
  const den = 1 + b[0] * t + b[1] * t * t + b[2] * t * t * t;
  const z = t - num / den;
  return clamped <= 0.5 ? -z : z;
}

function calculateDPrime(hits: number, omissions: number, falsePositives: number, gridSize: number): number {
  const totalTargets = hits + omissions;
  const hitRate = totalTargets > 0 ? hits / totalTargets : 0.5;
  const totalDistractors = Math.max(1, gridSize * gridSize - 1);
  const falseAlarmRate = falsePositives / totalDistractors;
  return normInv(hitRate) - normInv(falseAlarmRate);
}

function calculateSd(values: number[], mean: number): number {
  if (values.length <= 1) return 0;
  const variance = values.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / (values.length - 1);
  return Math.sqrt(variance);
}

function classifySpeedStyle(averageResponseMs: number, totalFalsePositives: number): 'efficient' | 'impulsive' | 'slow' | 'disorganized' {
  const isFast = averageResponseMs < FAST_THRESHOLD_MS;
  const isSlow = averageResponseMs > SLOW_THRESHOLD_MS;
  const hasHighFP = totalFalsePositives > HIGH_FP_THRESHOLD;

  if (isFast && hasHighFP)  return 'impulsive';
  if (isSlow && !hasHighFP) return 'slow';
  if (!isSlow && !hasHighFP) return 'efficient';
  return 'disorganized';
}

function detectFatigue(roundCurve: Array<{ omissions: number }>): boolean {
  if (roundCurve.length < 4) return false;
  const mid = Math.floor(roundCurve.length / 2);
  const firstHalf  = roundCurve.slice(0, mid);
  const secondHalf = roundCurve.slice(mid);

  const omissionRateFirst  = firstHalf.reduce((s, r) => s + r.omissions, 0)  / firstHalf.length;
  const omissionRateSecond = secondHalf.reduce((s, r) => s + r.omissions, 0) / secondHalf.length;

  return omissionRateSecond >= omissionRateFirst * 2 && omissionRateSecond > 0;
}

function detectSpatialAsymmetry(
  results: MissingItemRoundResult[]
): { leftOmissions: number; rightOmissions: number; asymmetryRatio: number; dominant: 'left' | 'right' | 'symmetric' | 'insufficient-data' } {
  let leftOmissions = 0;
  let rightOmissions = 0;

  for (const result of results) {
    if (result.omissions === 0) continue;
    const cols = result.gridSize;

    for (const pos of result.differencePositions) {
      const col = pos % cols;
      const isLeft = col < cols / 2;
      if (isLeft) leftOmissions++;
      else rightOmissions++;
    }
  }

  const total = leftOmissions + rightOmissions;
  if (total < 3) {
    return { leftOmissions, rightOmissions, asymmetryRatio: 0, dominant: 'insufficient-data' };
  }

  const asymmetryRatio = Math.abs(leftOmissions - rightOmissions) / total;
  let dominant: 'left' | 'right' | 'symmetric' = 'symmetric';
  if (asymmetryRatio >= 0.5) {
    dominant = leftOmissions > rightOmissions ? 'left' : 'right';
  }

  return { leftOmissions, rightOmissions, asymmetryRatio, dominant };
}

export function calculateAcharOFaltandoMetrics(
  results: MissingItemRoundResult[],
  elapsedSec: number
): AcharOFaltandoMetrics {
  const m = computeMetrics(results, elapsedSec);

  // 1. Calcular PhaseMetrics agrupado por fase (1 a 10)
  const phaseMetrics: PhaseMetrics[] = [];
  const getRtsFromRounds = (rounds: typeof results) => {
    const rts: number[] = [];
    for (const r of rounds) {
      if (r.clickTimestamps && r.clickTimestamps.length > 0) {
        let prev = 0;
        for (const t of r.clickTimestamps) {
          rts.push(t - prev);
          prev = t;
        }
      } else {
        rts.push(r.responseTimeMs);
      }
    }
    return rts;
  };

  for (let phase = 1; phase <= 10; phase++) {
    const phaseRounds = results.filter(r => ((r.roundNumber - 1) % 10) + 1 === phase);
    if (phaseRounds.length === 0) continue;

    const hits = phaseRounds.reduce((s, r) => s + r.hits, 0);
    const omissions = phaseRounds.reduce((s, r) => s + r.omissions, 0);
    const falsePositives = phaseRounds.reduce((s, r) => s + r.falsePositives, 0);
    const rtValues = getRtsFromRounds(phaseRounds);

    const rtMean = rtValues.length > 0 ? rtValues.reduce((s, v) => s + v, 0) / rtValues.length : 0;
    const rtSdrt = calculateSd(rtValues, rtMean);
    const dPrimeVal = calculateDPrime(hits, omissions, falsePositives, phaseRounds[0]?.gridSize || 8);

    // Post-error slowing (diferença RT após erro vs. RT normal em ms)
    let postErrorRtSum = 0;
    let postErrorRtCount = 0;
    let normalRtSum = 0;
    let normalRtCount = 0;
    for (let i = 0; i < phaseRounds.length; i++) {
      const r = phaseRounds[i]!;
      const prevRound = i > 0 ? phaseRounds[i - 1] : null;
      if (prevRound && !prevRound.correct) {
        postErrorRtSum += r.responseTimeMs;
        postErrorRtCount++;
      } else {
        normalRtSum += r.responseTimeMs;
        normalRtCount++;
      }
    }
    const postErrorSlowing = postErrorRtCount > 0 && normalRtCount > 0
      ? (postErrorRtSum / postErrorRtCount) - (normalRtSum / normalRtCount)
      : null;

    phaseMetrics.push({
      phase,
      phaseLabel: PHASE_LABELS[phase] || `Fase ${phase}`,
      roundsInPhase: phaseRounds.length,
      hits,
      omissions,
      falsePositives,
      rtMean,
      rtSdrt,
      dPrime: dPrimeVal,
      postErrorSlowing,
      rtValues,
    });
  }

  // 2. Flags clínicas
  // flagImpulsividade -> RT < 1.500ms nas fases 5/8/9 + comissões > 3 nessas fases
  const p589 = phaseMetrics.filter(pm => pm.phase === 5 || pm.phase === 8 || pm.phase === 9);
  const totalRounds589 = p589.reduce((s, pm) => s + pm.roundsInPhase, 0);
  const meanRt589 = totalRounds589 > 0
    ? p589.reduce((s, pm) => s + pm.rtMean * pm.roundsInPhase, 0) / totalRounds589
    : 0;
  const fp589 = p589.reduce((s, pm) => s + pm.falsePositives, 0);
  const flagImpulsividade = !!(totalRounds589 > 0 && meanRt589 < 1500 && fp589 > 3);

  // flagLentificacao -> RT > 2.000ms nas fases 1–4 + < 10 rounds completados
  const p14 = phaseMetrics.filter(pm => pm.phase >= 1 && pm.phase <= 4);
  const totalRounds14 = p14.reduce((s, pm) => s + pm.roundsInPhase, 0);
  const meanRt14 = totalRounds14 > 0
    ? p14.reduce((s, pm) => s + pm.rtMean * pm.roundsInPhase, 0) / totalRounds14
    : 0;
  const flagLentificacao = !!(totalRounds14 > 0 && meanRt14 > 2000 && results.length < 10);

  // flagSwitchCost -> (RT médio fase 10) - (média RT fases 8+9) > 1.500ms
  const pm10 = phaseMetrics.find(pm => pm.phase === 10);
  const p89 = phaseMetrics.filter(pm => pm.phase === 8 || pm.phase === 9);
  const totalRounds89 = p89.reduce((s, pm) => s + pm.roundsInPhase, 0);
  const meanRt89 = totalRounds89 > 0
    ? p89.reduce((s, pm) => s + pm.rtMean * pm.roundsInPhase, 0) / totalRounds89
    : 0;
  const rt10 = pm10 ? pm10.rtMean : 0;
  const flagSwitchCost = !!(pm10 && totalRounds89 > 0 && (rt10 - meanRt89) > 1500);

  // flagFadigaAtencional -> SDRT fases 8–10 >> SDRT fases 1–2 + aumento de omissões
  const p12 = phaseMetrics.filter(pm => pm.phase === 1 || pm.phase === 2);
  const totalRounds12 = p12.reduce((s, pm) => s + pm.roundsInPhase, 0);
  const sdrt12 = totalRounds12 > 0
    ? p12.reduce((s, pm) => s + pm.rtSdrt * pm.roundsInPhase, 0) / totalRounds12
    : 0;

  const p810 = phaseMetrics.filter(pm => pm.phase >= 8 && pm.phase <= 10);
  const totalRounds810 = p810.reduce((s, pm) => s + pm.roundsInPhase, 0);
  const sdrt810 = totalRounds810 > 0
    ? p810.reduce((s, pm) => s + pm.rtSdrt * pm.roundsInPhase, 0) / totalRounds810
    : 0;

  const omissions15 = phaseMetrics.filter(pm => pm.phase >= 1 && pm.phase <= 5).reduce((s, pm) => s + pm.omissions, 0);
  const omissions610 = phaseMetrics.filter(pm => pm.phase >= 6 && pm.phase <= 10).reduce((s, pm) => s + pm.omissions, 0);
  const flagFadigaAtencional = !!(totalRounds12 > 0 && totalRounds810 > 0 && sdrt810 > sdrt12 * 1.5 && omissions610 > omissions15);

  // 3. Time-on-Task comparativo (split-half)
  const firstHalfRounds = results.filter(r => {
    const p = ((r.roundNumber - 1) % 10) + 1;
    return p >= 1 && p <= 5;
  });
  const secondHalfRounds = results.filter(r => {
    const p = ((r.roundNumber - 1) % 10) + 1;
    return p >= 6 && p <= 10;
  });

  const firstHalfRts = getRtsFromRounds(firstHalfRounds);
  const secondHalfRts = getRtsFromRounds(secondHalfRounds);

  const firstHalfRtMean = firstHalfRts.length > 0 ? firstHalfRts.reduce((s, v) => s + v, 0) / firstHalfRts.length : 0;
  const secondHalfRtMean = secondHalfRts.length > 0 ? secondHalfRts.reduce((s, v) => s + v, 0) / secondHalfRts.length : 0;

  const firstHalfSdrt = calculateSd(firstHalfRts, firstHalfRtMean);
  const secondHalfSdrt = calculateSd(secondHalfRts, secondHalfRtMean);

  const speedStyle = classifySpeedStyle(m.averageResponseMs, m.totalFalsePositives);
  const hasFatigue = detectFatigue(m.roundCurve);
  const spatialAsymmetry = detectSpatialAsymmetry(results);

  // Conversão Lúdica (Fôlego Mental)
  const fatigueIndex = secondHalfRtMean - firstHalfRtMean;
  const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));
  const ludicScore = Math.round(clamp(100 - (fatigueIndex / 5), 0, 100));

  return {
    roundsPlayed: m.roundsPlayed,
    totalHits: m.totalHits,
    totalOmissions: m.totalOmissions,
    totalFalsePositives: m.totalFalsePositives,
    totalCorrectRounds: m.totalCorrectRounds,
    accuracyPerMinute: m.accuracyPerMinute,
    averageResponseMs: m.averageResponseMs,
    roundCurve: m.roundCurve,
    speedStyle,
    hasFatigue,
    spatialAsymmetry,
    phaseMetrics,
    flagImpulsividade,
    flagLentificacao,
    flagSwitchCost,
    flagFadigaAtencional,
    firstHalfRtMean,
    secondHalfRtMean,
    firstHalfSdrt,
    secondHalfSdrt,
    fatigueIndex,
    ludicScore,
  };
}
