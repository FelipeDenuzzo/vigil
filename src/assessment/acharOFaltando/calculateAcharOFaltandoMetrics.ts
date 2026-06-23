// src/assessment/acharOFaltando/calculateAcharOFaltandoMetrics.ts
import { MissingItemRoundResult } from '../../attentions/selective/games/AcharOFaltando/types';
import { AcharOFaltandoMetrics } from './types';
import { computeMetrics } from '../../attentions/selective/games/AcharOFaltando/logic';
import { FAST_THRESHOLD_MS, SLOW_THRESHOLD_MS, HIGH_FP_THRESHOLD } from './acharOFaltandoScaleDefinitions';

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
    const cols = result.gridSize; // gridSize é o número de colunas

    for (const pos of result.differencePositions) {
      const col = pos % cols;
      const isLeft = col < cols / 2;
      if (result.omissions > 0) {
        if (isLeft) leftOmissions++;
        else rightOmissions++;
      }
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

/**
 * Calcula as métricas de sessão de Achar o Faltando a partir dos resultados de rodada.
 */
export function calculateAcharOFaltandoMetrics(
  results: MissingItemRoundResult[],
  elapsedSec: number
): AcharOFaltandoMetrics {
  const m = computeMetrics(results, elapsedSec);
  
  const speedStyle = classifySpeedStyle(m.averageResponseMs, m.totalFalsePositives);
  const hasFatigue = detectFatigue(m.roundCurve);
  const spatialAsymmetry = detectSpatialAsymmetry(results);

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
  };
}
