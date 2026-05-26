// src/assessment/visualSearch/visualSearchScaleDefinitions.ts
// Definições da escala de pontuação e faixas de interpretação
// para o exercício Visual Search Hunt.

import type { VisualSearchErrorProfile, VisualSearchSpatialProfile } from './types';

// ─── Faixas de pontuação ──────────────────────────────────────────────────────

export type ScoreBand = 'excelente' | 'bom' | 'regular' | 'fraco' | 'insuficiente';

export interface ScoreBandDefinition {
  band: ScoreBand;
  label: string;
  minScore: number; // 0–100 (inclusive)
  maxScore: number; // 0–100 (inclusive)
  description: string;
}

export const SCORE_BANDS: ScoreBandDefinition[] = [
  {
    band: 'excelente',
    label: 'Excelente',
    minScore: 85,
    maxScore: 100,
    description: 'Atenção seletiva muito bem preservada, com alta precisão e rapidez.',
  },
  {
    band: 'bom',
    label: 'Bom',
    minScore: 70,
    maxScore: 84,
    description: 'Atenção seletiva preservada, com pequenas imprecisões ocasionais.',
  },
  {
    band: 'regular',
    label: 'Regular',
    minScore: 50,
    maxScore: 69,
    description: 'Atenção seletiva funcional, mas com sinais de dificuldade de filtragem.',
  },
  {
    band: 'fraco',
    label: 'Fraco',
    minScore: 30,
    maxScore: 49,
    description: 'Sinais moderados de dificuldade atencional. Treino regular recomendado.',
  },
  {
    band: 'insuficiente',
    label: 'Insuficiente',
    minScore: 0,
    maxScore: 29,
    description: 'Dificuldade importante de atenção seletiva. Considere avaliação profissional.',
  },
];

// ─── Thresholds de interpretação ─────────────────────────────────────────────

export const COMMISSION_THRESHOLD = 0.2;  // acima: excesso de cliques impulsivos
export const OMISSION_THRESHOLD   = 0.2;  // acima: excesso de alvos perdidos
export const ASYMMETRY_THRESHOLD  = 50;   // índice > 50 → assimetria pronunciada
export const LOW_ORGANIZATION_IDX = 40;   // abaixo: varredura errática

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function getScoreBand(score: number): ScoreBandDefinition {
  return (
    SCORE_BANDS.find((b) => score >= b.minScore && score <= b.maxScore) ??
    SCORE_BANDS[SCORE_BANDS.length - 1]
  );
}

export function getErrorProfileLabel(profile: VisualSearchErrorProfile): string {
  if (profile.totalAnalyzedErrors === 0) return 'Nenhum erro registrado.';
  const attr = profile.dominantErrorAttribute;
  if (attr === 'forma') return `Dificuldade predominante com forma (${(profile.shapeErrorRate * 100).toFixed(0)}% dos erros).`;
  if (attr === 'cor')   return `Dificuldade predominante com cor (${(profile.colorErrorRate * 100).toFixed(0)}% dos erros).`;
  if (attr === 'duplo') return `Cliques aleatórios predominam (${(profile.doubleErrorRate * 100).toFixed(0)}% dos erros).`;
  return 'Dados de erro indisponíveis.';
}

export function getSpatialNeglectLabel(profile: VisualSearchSpatialProfile): string {
  if (profile.spatialNeglectSide === 'esquerda') return `Negligência leve no lado esquerdo (${profile.leftMisses} alvos perdidos).`;
  if (profile.spatialNeglectSide === 'direita')  return `Negligência leve no lado direito (${profile.rightMisses} alvos perdidos).`;
  if (profile.spatialNeglectSide === 'simetrico') return 'Distribuição espacial equilibrada.';
  return 'Dados espaciais insuficientes.';
}
