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
