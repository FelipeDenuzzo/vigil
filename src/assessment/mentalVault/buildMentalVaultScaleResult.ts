// src/assessment/mentalVault/buildMentalVaultScaleResult.ts

import type { MentalVaultSessionMetrics } from './types';

export interface MentalVaultScaleResult {
  score: number;
  level: string;
}

export function buildMentalVaultScaleResult(
  metrics: MentalVaultSessionMetrics
): MentalVaultScaleResult {
  const levelClass =
    metrics.avgAbsoluteRecall >= 4.5 ? 'mínimo' :
    metrics.avgAbsoluteRecall >= 3.5 ? 'leve' :
    metrics.avgAbsoluteRecall >= 2.5 ? 'moderado' : 'importante';

  const score = metrics.ludicScore; // metrics.avgDigitIes
    
    

  return {
    score,
    level: levelClass,
  };
}
