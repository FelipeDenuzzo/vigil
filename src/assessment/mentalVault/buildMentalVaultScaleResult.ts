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

  // Formula A: Cofre Mental (TBRS Cost)
  const tbrsCostPct = Math.max(0, (metrics.tbrsCost || 0) * 100);
  const clamp = (v: number, min = 0, max = 100) => Math.max(min, Math.min(max, v));
  const score = Math.round(clamp(100 - ((tbrsCostPct - 0) / (40 - 0)) * 100, 0, 100));

  return {
    score,
    level: levelClass,
  };
}
