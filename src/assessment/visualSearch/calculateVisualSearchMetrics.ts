// src/assessment/visualSearch/calculateVisualSearchMetrics.ts
// Calcula VisualSearchErrorProfile e VisualSearchSpatialProfile
// a partir dos cliques brutos de cada rodada.
// Não depende de nenhum estado React — função pura.

import type { VisualSearchClickLog } from '../../attentions/selective/games/VisualSearchHunt/assessment/visualSearchAssessment.types';
import type {
  ErrorAttributeType,
  GridQuadrant,
  QuadrantStats,
  VisualSearchAnalysisInput,
  VisualSearchErrorProfile,
  VisualSearchSpatialProfile,
} from './types';

// ─── Classificação do tipo de erro ──────────────────────────────────────────

function classifyErrorAttribute(click: VisualSearchClickLog): ErrorAttributeType {
  const shapeMatch = click.clickedShape === click.targetShape;
  const colorMatch = click.clickedColor === click.targetColor;

  if (!shapeMatch && colorMatch) return 'shape_error';  // cor certa, forma errada
  if (shapeMatch && !colorMatch) return 'color_error';  // forma certa, cor errada
  return 'double_error';                                // nenhum atributo correto
}

// ─── Perfil de erro por atributo ────────────────────────────────────────────

export function buildErrorProfile(
  roundClicks: VisualSearchAnalysisInput['roundClicks']
): VisualSearchErrorProfile {
  let shapeErrors = 0;
  let colorErrors = 0;
  let doubleErrors = 0;

  for (const { clicks } of roundClicks) {
    for (const click of clicks) {
      if (click.isTarget) continue; // só analisa erros (cliques em distratores)
      const type = classifyErrorAttribute(click);
      if (type === 'shape_error') shapeErrors++;
      else if (type === 'color_error') colorErrors++;
      else doubleErrors++;
    }
  }

  const total = shapeErrors + colorErrors + doubleErrors;

  if (total === 0) {
    return {
      shapeErrors: 0,
      colorErrors: 0,
      doubleErrors: 0,
      totalAnalyzedErrors: 0,
      shapeErrorRate: 0,
      colorErrorRate: 0,
      doubleErrorRate: 0,
      dominantErrorAttribute: 'indisponivel',
    };
  }

  const shapeErrorRate = shapeErrors / total;
  const colorErrorRate = colorErrors / total;
  const doubleErrorRate = doubleErrors / total;

  let dominantErrorAttribute: VisualSearchErrorProfile['dominantErrorAttribute'] = 'indisponivel';
  const max = Math.max(shapeErrors, colorErrors, doubleErrors);
  if (max === shapeErrors) dominantErrorAttribute = 'forma';
  else if (max === colorErrors) dominantErrorAttribute = 'cor';
  else dominantErrorAttribute = 'duplo';

  return {
    shapeErrors,
    colorErrors,
    doubleErrors,
    totalAnalyzedErrors: total,
    shapeErrorRate,
    colorErrorRate,
    doubleErrorRate,
    dominantErrorAttribute,
  };
}

// ─── Cálculo do quadrante ────────────────────────────────────────────────────
// Divide a grade em 4 quadrantes iguais com base no gridSize da rodada.

function getQuadrant(row: number, col: number, gridSize: number): GridQuadrant {
  const mid = gridSize / 2;
  const isTop = row < mid;
  const isLeft = col < mid;
  if (isTop && isLeft) return 'TL';
  if (isTop && !isLeft) return 'TR';
  if (!isTop && isLeft) return 'BL';
  return 'BR';
}

// ─── Perfil espacial por quadrante ──────────────────────────────────────────

export function buildSpatialProfile(
  roundClicks: VisualSearchAnalysisInput['roundClicks']
): VisualSearchSpatialProfile {
  const stats: Record<GridQuadrant, QuadrantStats> = {
    TL: { hits: 0, errors: 0, total: 0, errorRate: 0 },
    TR: { hits: 0, errors: 0, total: 0, errorRate: 0 },
    BL: { hits: 0, errors: 0, total: 0, errorRate: 0 },
    BR: { hits: 0, errors: 0, total: 0, errorRate: 0 },
  };

  let leftMisses = 0;
  let rightMisses = 0;
  let hasClickData = false;

  for (const { clicks, gridSize, leftSideTargetMisses, rightSideTargetMisses } of roundClicks) {
    if (clicks.length > 0) hasClickData = true;

    leftMisses += leftSideTargetMisses ?? 0;
    rightMisses += rightSideTargetMisses ?? 0;

    for (const click of clicks) {
      const quadrant = getQuadrant(click.row, click.col, gridSize);
      stats[quadrant].total++;
      if (click.isTarget) stats[quadrant].hits++;
      else stats[quadrant].errors++;
    }
  }

  // calcula errorRate por quadrante
  for (const q of Object.keys(stats) as GridQuadrant[]) {
    stats[q].errorRate = stats[q].total > 0 ? stats[q].errors / stats[q].total : 0;
  }

  // quadrante com maior errorRate (mínimo 2 cliques para ser considerado)
  let highestErrorQuadrant: GridQuadrant | null = null;
  if (hasClickData) {
    let maxRate = 0;
    for (const q of Object.keys(stats) as GridQuadrant[]) {
      if (stats[q].total >= 2 && stats[q].errorRate > maxRate) {
        maxRate = stats[q].errorRate;
        highestErrorQuadrant = q;
      }
    }
  }

  // negligência lateral
  let spatialNeglectSide: VisualSearchSpatialProfile['spatialNeglectSide'] = 'indisponivel';
  const totalMisses = leftMisses + rightMisses;
  if (totalMisses >= 3) {
    const leftRatio = leftMisses / totalMisses;
    if (leftRatio >= 0.65) spatialNeglectSide = 'esquerda';
    else if (leftRatio <= 0.35) spatialNeglectSide = 'direita';
    else spatialNeglectSide = 'simetrico';
  }

  return {
    byQuadrant: stats,
    highestErrorQuadrant,
    leftMisses,
    rightMisses,
    spatialNeglectSide,
  };
}

// ─── Função principal exportada ──────────────────────────────────────────────
// Recebe o input bruto e retorna os dois perfis prontos para os builders.

export function calculateVisualSearchMetrics(
  input: VisualSearchAnalysisInput['roundClicks']
): Pick<VisualSearchAnalysisInput, 'errorProfile' | 'spatialProfile'> {
  return {
    errorProfile: buildErrorProfile(input),
    spatialProfile: buildSpatialProfile(input),
  };
}


function normInv(p: number): number {
  if (p <= 0.0001) return -3.719;
  if (p >= 0.9999) return 3.719;
  const a1 = -3.969683028665376e1, a2 = 2.209460984245205e2;
  const a3 = -2.759285104469687e2, a4 = 1.383577518672690e2;
  const a5 = -3.066479806614716e1, a6 = 2.506628277459239e0;
  const b1 = -5.447609879822406e1, b2 = 1.615858368580409e2;
  const b3 = -1.556989798598866e2, b4 = 6.680131188771972e1;
  const b5 = -1.328068155288572e1;
  const c1 = -7.784894002430293e-3, c2 = -3.223964580411365e-1;
  const c3 = -2.400758277161838e0, c4 = -2.549732539343734e0;
  const c5 = 4.374664141464968e0, c6 = 2.938163982698783e0;
  const d1 = 7.784695709041462e-3, d2 = 3.224671290700398e-1;
  const d3 = 2.445134137142996e0, d4 = 3.754408661907416e0;
  let q, r;
  if (p < 0.02425) {
    q = Math.sqrt(-2 * Math.log(p));
    return (((((c1 * q + c2) * q + c3) * q + c4) * q + c5) * q + c6) /
           ((((d1 * q + d2) * q + d3) * q + d4) * q + 1);
  } else if (p > 1 - 0.02425) {
    q = Math.sqrt(-2 * Math.log(1 - p));
    return -(((((c1 * q + c2) * q + c3) * q + c4) * q + c5) * q + c6) /
            ((((d1 * q + d2) * q + d3) * q + d4) * q + 1);
  } else {
    q = p - 0.5;
    r = q * q;
    return (((((a1 * r + a2) * r + a3) * r + a4) * r + a5) * r + a6) * q /
           (((((b1 * r + b2) * r + b3) * r + b4) * r + b5) * r + 1);
  }
}

export function calculateDPrimeVS(roundClicks: any[]): number {
  let hits = 0; let errors = 0; let totalTargets = 0; let totalDistractors = 0;
  for (const r of roundClicks) {
    totalTargets += (r.gridSize * r.gridSize) / 2; // approximation
    totalDistractors += (r.gridSize * r.gridSize) / 2;
    for (const c of r.clicks) {
      if (c.isTarget) hits++;
      else errors++;
    }
  }
  const hr = totalTargets > 0 ? Math.max(0.01, Math.min(0.99, hits / totalTargets)) : 0.5;
  const far = totalDistractors > 0 ? Math.max(0.01, Math.min(0.99, errors / totalDistractors)) : 0.5;
  return normInv(hr) - normInv(far);
}
