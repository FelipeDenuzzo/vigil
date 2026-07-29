// src/assessment/mentalVault/buildMentalVaultScaleResult.ts

import type { MentalVaultSessionMetrics } from './types';

export interface MentalVaultScaleResult {
  score: number;
  level: 'mínimo' | 'leve' | 'moderado' | 'importante';
}

export function buildMentalVaultScaleResult(
  metrics: MentalVaultSessionMetrics
): MentalVaultScaleResult {
  const levelClass =
    metrics.avgAbsoluteRecall >= 0.85 ? 'mínimo' :
    metrics.avgAbsoluteRecall >= 0.70 ? 'leve' :
    metrics.avgAbsoluteRecall >= 0.50 ? 'moderado' : 'importante';

  // Formula A: Cofre Mental (TBRS Cost)
  const tbrsCostPct = Math.max(0, (metrics.tbrsCost || 0) * 100);
  const clamp = (v: number, min = 0, max = 100) => Math.max(min, Math.min(max, v));
  const score = Math.round(clamp(100 - ((tbrsCostPct - 0) / (40 - 0)) * 100, 0, 100));

  return {
    score,
    level: levelClass,
  };
}
