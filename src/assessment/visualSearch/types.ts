// src/assessment/visualSearch/types.ts
// Tipos exclusivos da análise de qualidade do erro (forma vs cor vs duplo)
// e perfil espacial por quadrante.
// Não duplica tipos já definidos em visualSearchScale.types.ts.

import type { VisualSearchClickLog } from '../../attentions/selective/games/VisualSearchHunt/assessment/visualSearchAssessment.types';

// ─── Qualidade do erro por atributo ─────────────────────────────────────────
// Classifica cada erro de acordo com qual atributo o usuário acertou/errou.

export type ErrorAttributeType =
  | 'shape_error'     // clicou na cor certa, forma errada
  | 'color_error'     // clicou na forma certa, cor errada
  | 'double_error';   // nenhum atributo correto (clique aleatório)

export type VisualSearchErrorProfile = {
  // contagens brutas
  shapeErrors: number;        // erros onde só a cor era certa
  colorErrors: number;        // erros onde só a forma era certa
  doubleErrors: number;       // erros sem nenhum atributo correto
  totalAnalyzedErrors: number;

  // taxas (0–1)
  shapeErrorRate: number;
  colorErrorRate: number;
  doubleErrorRate: number;

  // atributo predominante de dificuldade
  dominantErrorAttribute: 'forma' | 'cor' | 'duplo' | 'indisponivel';
};

// ─── Perfil espacial por quadrante ──────────────────────────────────────────
// Divide a grade em 4 quadrantes (TL/TR/BL/BR) e mapeia acertos e erros.

export type GridQuadrant = 'TL' | 'TR' | 'BL' | 'BR';

export type QuadrantStats = {
  hits: number;
  errors: number;
  total: number;
  errorRate: number; // erros / total de cliques no quadrante
};

export type VisualSearchSpatialProfile = {
  byQuadrant: Record<GridQuadrant, QuadrantStats>;
  // quadrante com maior concentração de erros (null se dados insuficientes)
  highestErrorQuadrant: GridQuadrant | null;
  // negligência lateral baseada em missedTargets
  leftMisses: number;
  rightMisses: number;
  spatialNeglectSide: 'esquerda' | 'direita' | 'simetrico' | 'indisponivel';
};

// ─── Input unificado para os builders ───────────────────────────────────────
// Agrega métricas já calculadas (vindas de calculateVisualSearchMetrics)
// com os perfis de erro e espacial.
// É o único tipo que os builders (scale e technical) recebem como input.

export type VisualSearchAnalysisInput = {
  // cliques brutos por rodada (fonte primária para os perfis)
  roundClicks: Array<{
    round: number;
    gridSize: number; // necessário para calcular o quadrante correto
    clicks: VisualSearchClickLog[];
    leftSideTargetMisses?: number;
    rightSideTargetMisses?: number;
  }>;

  // perfis calculados (preenchidos por calculateVisualSearchMetrics)
  errorProfile: VisualSearchErrorProfile;
  spatialProfile: VisualSearchSpatialProfile;
};
