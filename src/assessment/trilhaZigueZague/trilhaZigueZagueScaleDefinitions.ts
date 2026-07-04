// src/assessment/trilhaZigueZague/trilhaZigueZagueScaleDefinitions.ts

// Conforme as diretrizes fornecidas na documentação (UX / Lúdico) e prompt
export const TRILHA_ZIGUE_ZAGUE_SCALE = {
  BEST_COST: 10,
  WORST_COST: 100,
  ERROR_PENALTY: 2
};

export type FlexScoreLevel = 
  | 'Excepcional'
  | 'Muito Ágil'
  | 'Bom Desempenho'
  | 'Em Desenvolvimento'
  | 'Continue Treinando';

export function getQualitativeLabel(score: number): FlexScoreLevel {
  if (score >= 90) return 'Excepcional';
  if (score >= 70) return 'Muito Ágil';
  if (score >= 50) return 'Bom Desempenho';
  if (score >= 30) return 'Em Desenvolvimento';
  return 'Continue Treinando';
}
