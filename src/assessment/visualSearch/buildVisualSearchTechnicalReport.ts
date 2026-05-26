// src/assessment/visualSearch/buildVisualSearchTechnicalReport.ts
// Produz o relatório técnico completo da sessão Visual Search
// a partir de VisualSearchAnalysisInput (camada central).

import { buildErrorProfile, buildSpatialProfile } from './calculateVisualSearchMetrics';
import { buildVisualSearchScaleResult } from './buildVisualSearchScaleResult';
import { LOW_ORGANIZATION_IDX, ASYMMETRY_THRESHOLD } from './visualSearchScaleDefinitions';
import type { VisualSearchAnalysisInput } from './types';

// ─── Tipo de saída ────────────────────────────────────────────────────────────

export interface VisualSearchTechnicalReport {
  title: string;
  answer: string;
  score: number;
  bandLabel: string;
  dominantIssue: string;
  summary: string;
  subscalesSummary: {
    errorQuality: string;
    spatialDistribution: string;
    quadrantHighlight: string | null;
  };
  evidence: {
    totalErrors: number;
    shapeErrors: number;
    colorErrors: number;
    doubleErrors: number;
    dominantErrorAttribute: string;
    commissionRate: number;
    omissionRate: number;
    highestErrorQuadrant: string | null;
    leftMisses: number;
    rightMisses: number;
    spatialNeglectSide: string;
    score: number;
  };
}

// ─── Helpers de texto ─────────────────────────────────────────────────────────

function buildErrorQualityText(profile: ReturnType<typeof buildErrorProfile>): string {
  if (profile.totalAnalyzedErrors === 0) return 'Nenhum erro de comissão registrado.';
  const attr = profile.dominantErrorAttribute;
  if (attr === 'forma')
    return `Erros predominantes por confusão de forma (${(profile.shapeErrorRate * 100).toFixed(0)}%), com cor correta. Pode indicar dificuldade de discriminação visual de contorno.`;
  if (attr === 'cor')
    return `Erros predominantes por confusão de cor (${(profile.colorErrorRate * 100).toFixed(0)}%), com forma correta. Pode indicar dificuldade de discriminação cromática.`;
  return `Erros predominantemente aleatórios (${(profile.doubleErrorRate * 100).toFixed(0)}%), sem padrão de confusão claro. Sugere impulsividade ou fadiga atencional.`;
}

function buildSpatialText(profile: ReturnType<typeof buildSpatialProfile>): string {
  const side = profile.spatialNeglectSide;
  if (side === 'esquerda')
    return `Maior perda de alvos no lado esquerdo (${profile.leftMisses} vs ${profile.rightMisses} direita). Atenção ao hemicampo esquerdo reduzida.`;
  if (side === 'direita')
    return `Maior perda de alvos no lado direito (${profile.rightMisses} vs ${profile.leftMisses} esquerda). Atenção ao hemicampo direito reduzida.`;
  if (side === 'simetrico')
    return `Distribuição bilateral de perdas equilibrada (${profile.leftMisses} esq / ${profile.rightMisses} dir).`;
  return 'Dados insuficientes para análise de assimetria espacial.';
}

function buildQuadrantText(profile: ReturnType<typeof buildSpatialProfile>): string | null {
  const q = profile.highestErrorQuadrant;
  if (!q) return null;
  const stats = profile.byQuadrant[q];
  const labels: Record<string, string> = { TL: 'superior esquerdo', TR: 'superior direito', BL: 'inferior esquerdo', BR: 'inferior direito' };
  return `Concentração de erros no quadrante ${labels[q] ?? q} (${(stats.errorRate * 100).toFixed(0)}% de erro nesse quadrante).`;
}

// ─── Função principal ─────────────────────────────────────────────────────────

export function buildVisualSearchTechnicalReport(
  input: VisualSearchAnalysisInput
): VisualSearchTechnicalReport {
  const errorProfile   = buildErrorProfile(input.roundClicks);
  const spatialProfile = buildSpatialProfile(input.roundClicks);
  const scale          = buildVisualSearchScaleResult(input);

  const summary =
    `Score: ${scale.score}/100 (${scale.bandLabel}) | ` +
    `Comissão: ${(scale.commissionRate * 100).toFixed(0)}% | ` +
    `Omissão: ${(scale.omissionRate * 100).toFixed(0)}% | ` +
    `Erros: ${errorProfile.totalAnalyzedErrors} | ` +
    `Negligência: ${spatialProfile.spatialNeglectSide}`;

  return {
    title: 'Avaliação do Visual Search Hunt',
    answer: scale.answer,
    score: scale.score,
    bandLabel: scale.bandLabel,
    dominantIssue: scale.dominantIssue,
    summary,
    subscalesSummary: {
      errorQuality: buildErrorQualityText(errorProfile),
      spatialDistribution: buildSpatialText(spatialProfile),
      quadrantHighlight: buildQuadrantText(spatialProfile),
    },
    evidence: {
      totalErrors: errorProfile.totalAnalyzedErrors,
      shapeErrors: errorProfile.shapeErrors,
      colorErrors: errorProfile.colorErrors,
      doubleErrors: errorProfile.doubleErrors,
      dominantErrorAttribute: errorProfile.dominantErrorAttribute,
      commissionRate: scale.commissionRate,
      omissionRate: scale.omissionRate,
      highestErrorQuadrant: spatialProfile.highestErrorQuadrant,
      leftMisses: spatialProfile.leftMisses,
      rightMisses: spatialProfile.rightMisses,
      spatialNeglectSide: spatialProfile.spatialNeglectSide,
      score: scale.score,
    },
  };
}
