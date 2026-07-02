// src/assessment/visualSearch/buildVisualSearchScaleResult.ts
// Nível lúdico: Olho de Águia (score + nível 1–4 + emoji)
// Lê apenas errorProfile e spatialProfile — único output de calculateVisualSearchMetrics.

import { calculateVisualSearchMetrics, calculateDPrimeVS } from './calculateVisualSearchMetrics';
import type { VisualSearchAnalysisInput } from './types';

export type EagleLevel = 1 | 2 | 3 | 4;
export type EagleColorToken = 'success' | 'warning' | 'danger';

export interface VisualSearchScaleResult {
  scaleName: string;
  emoji: string;
  score: number;
  positionPercent: number;
  level: EagleLevel;
  levelLabel: string;
  leftLabel: string;
  rightLabel: string;
  markerLabel: string;
  colorToken: EagleColorToken;
  shortDescription: string;
  engagementStatus: 'suficiente' | 'insuficiente';
}

function clamp(v: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, v));
}

function resolveLevel(score: number): EagleLevel {
  if (score >= 75) return 4;
  if (score >= 50) return 3;
  if (score >= 25) return 2;
  return 1;
}

const LEVEL_LABELS: Record<EagleLevel, string> = {
  4: 'Super Águia',
  3: 'Águia Atenta',
  2: 'Águia em Ajuste',
  1: 'Águia Cega',
};

function resolveColorToken(score: number): EagleColorToken {
  if (score >= 60) return 'success';
  if (score >= 35) return 'warning';
  return 'danger';
}

export function buildVisualSearchScaleResult(
  roundClicks: VisualSearchAnalysisInput['roundClicks']
): VisualSearchScaleResult {
  const { errorProfile, spatialProfile } = calculateVisualSearchMetrics(roundClicks);

  // Score baseado nos perfis disponíveis
  const totalAnalyzed = errorProfile.totalAnalyzedErrors;
  const totalClicks = roundClicks.reduce((sum, r) => sum + r.clicks.length, 0);

  // Taxa de comissão: erros / total de cliques
  const commissionRate = totalClicks > 0 ? totalAnalyzed / totalClicks : 0;

  // Negligencia espacial degrada score
  const hasNeglect =
    spatialProfile.spatialNeglectSide === 'esquerda' ||
    spatialProfile.spatialNeglectSide === 'direita';

  // Score simples: base 100 - penalidade por erros - penalidade por neglect
  // Formula B: Caça ao Alvo (dPrime)
  const dPrime = calculateDPrimeVS(roundClicks);
  let score = Math.round(clamp(((dPrime - (-1.0)) / (3.0 - (-1.0))) * 100, 0, 100));

  const engagementStatus: VisualSearchScaleResult['engagementStatus'] =
    totalClicks < 3 ? 'insuficiente' : 'suficiente';

  const level = resolveLevel(score);
  const levelLabel = LEVEL_LABELS[level];

  let shortDescription: string;
  if (engagementStatus === 'insuficiente')
    shortDescription = 'Dados insuficientes para avaliação completa.';
  else if (commissionRate >= 0.4)
    shortDescription = 'Tendência a clicar em distratores com frequência.';
  else if (score >= 75)
    shortDescription = 'Ótima identificação do alvo com poucos erros.';
  else if (score >= 50)
    shortDescription = 'Boa performance, com pequenas oscilações no filtro visual.';
  else if (score >= 25)
    shortDescription = 'Instabilidade moderada na separação entre alvo e distratores.';
  else
    shortDescription = 'Dificuldade acentuada para manter o foco no alvo visual.';

  return {
    scaleName: 'Olho de Águia',
    emoji: '🦅',
    score,
    positionPercent: score,
    level,
    levelLabel,
    leftLabel: 'Águia Cega',
    rightLabel: 'Super Águia',
    markerLabel: levelLabel,
    colorToken: resolveColorToken(score),
    shortDescription,
    engagementStatus,
  };
}
