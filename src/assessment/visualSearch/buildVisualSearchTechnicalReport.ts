// src/assessment/visualSearch/buildVisualSearchTechnicalReport.ts
// Etapa 6 — Parecer técnico pós-sessão
// Usa shapeErrorRate, colorErrorRate, quadrantErrorMap e spatialNeglectIndex
// Tom clínico técnico, sem linguagem lúdica

import { calculateVisualSearchMetrics } from './calculateVisualSearchMetrics';
import type { VisualSearchScaleInput } from './types';

// ─── Tipos de saída ────────────────────────────────────────────────────────────

export type ReportAnswer = 'sim' | 'parcial' | 'nao' | 'insuficiente';
export type ReportSeverity = 'minimo' | 'leve' | 'moderado' | 'importante';

export interface VisualSearchTechnicalReport {
  answer: ReportAnswer;
  dominantErrorAttribute: 'forma' | 'cor' | 'duplo' | 'nenhum' | 'indeterminado';
  problemRegion: 'esquerda' | 'direita' | 'centro' | 'distribuido' | 'indeterminado';
  spatialNeglect: boolean;
  severity: ReportSeverity;
  interpretation: string;
  summary: string;
}

// ─── Utilitários ───────────────────────────────────────────────────────────────

function resolveDominantErrorAttribute(
  shapeErrorRate: number | null,
  colorErrorRate: number | null,
  doubleErrorRate: number | null
): VisualSearchTechnicalReport['dominantErrorAttribute'] {
  if (shapeErrorRate === null && colorErrorRate === null) return 'indeterminado';

  const shape = shapeErrorRate ?? 0;
  const color = colorErrorRate ?? 0;
  const both = doubleErrorRate ?? 0;

  if (both > 0.15) return 'duplo';
  if (shape > color && shape > 0.1) return 'forma';
  if (color > shape && color > 0.1) return 'cor';
  return 'nenhum';
}

function resolveProblemRegion(
  quadrantErrorMap: Record<string, number> | null | undefined,
  spatialNeglectIndex: number | null | undefined
): VisualSearchTechnicalReport['problemRegion'] {
  if (!quadrantErrorMap) return 'indeterminado';

  const tl = quadrantErrorMap['TL'] ?? 0;
  const tr = quadrantErrorMap['TR'] ?? 0;
  const bl = quadrantErrorMap['BL'] ?? 0;
  const br = quadrantErrorMap['BR'] ?? 0;

  const left = tl + bl;
  const right = tr + br;
  const total = left + right;

  if (total === 0) return 'indeterminado';

  const leftRatio = left / total;
  const rightRatio = right / total;

  if (spatialNeglectIndex !== null && spatialNeglectIndex !== undefined && spatialNeglectIndex > 50) {
    if (leftRatio >= 0.65) return 'esquerda';
    if (rightRatio >= 0.65) return 'direita';
  }

  if (leftRatio >= 0.6) return 'esquerda';
  if (rightRatio >= 0.6) return 'direita';
  return 'distribuido';
}

function resolveSeverity(
  omissionRate: number,
  commissionRate: number,
  spatialNeglect: boolean
): ReportSeverity {
  const maxRate = Math.max(omissionRate, commissionRate);
  if (spatialNeglect && maxRate >= 0.3) return 'importante';
  if (maxRate >= 0.3) return 'moderado';
  if (maxRate >= 0.15) return 'leve';
  return 'minimo';
}

function resolveAnswer(
  omissionRate: number,
  commissionRate: number,
  engagementStatus: 'suficiente' | 'insuficiente'
): ReportAnswer {
  if (engagementStatus === 'insuficiente') return 'insuficiente';
  const max = Math.max(omissionRate, commissionRate);
  if (max >= 0.25) return 'sim';
  if (max >= 0.1) return 'parcial';
  return 'nao';
}

function buildInterpretation(
  dominantAttr: VisualSearchTechnicalReport['dominantErrorAttribute'],
  problemRegion: VisualSearchTechnicalReport['problemRegion'],
  spatialNeglect: boolean,
  omissionRate: number,
  commissionRate: number
): string {
  const parts: string[] = [];

  // Padrão de erro por atributo
  if (dominantAttr === 'forma')
    parts.push('O atributo predominante nos erros é a forma — o usuário tende a ignorar diferenças de forma entre alvo e distratores.');
  else if (dominantAttr === 'cor')
    parts.push('O atributo predominante nos erros é a cor — a diferenciação por cor entre alvo e distratores mostra-se deficitária.');
  else if (dominantAttr === 'duplo')
    parts.push('Os erros envolvem simultaneamente forma e cor, sugerindo dificuldade generalizada de discriminação perceptual.');

  // Região de dificuldade
  if (problemRegion === 'esquerda')
    parts.push('A concentração de erros ocorre predominantemente na metade esquerda do campo visual.');
  else if (problemRegion === 'direita')
    parts.push('A concentração de erros ocorre predominantemente na metade direita do campo visual.');
  else if (problemRegion === 'distribuido')
    parts.push('Os erros estão distribuídos de forma relativamente uniforme pelo campo visual.');

  // Neglect espacial
  if (spatialNeglect)
    parts.push('O índice de negligência espacial está elevado, com assimetria marcada na cobertura do campo visual.');

  // Taxas gerais
  if (omissionRate >= 0.3)
    parts.push(`Taxa de omissão elevada (${(omissionRate * 100).toFixed(0)}%), indicando que alvos relevantes não foram detectados.`);
  if (commissionRate >= 0.2)
    parts.push(`Taxa de comissão elevada (${(commissionRate * 100).toFixed(0)}%), indicando cliques frequentes em distratores.`);

  if (parts.length === 0)
    return 'Desempenho dentro dos parâmetros esperados, sem padrão de erro predominante identificado.';

  return parts.join(' ');
}

// ─── Função principal ──────────────────────────────────────────────────────────

export function buildVisualSearchTechnicalReport(
  input: VisualSearchScaleInput
): VisualSearchTechnicalReport {
  const m = calculateVisualSearchMetrics(input);

  const dominantErrorAttribute = resolveDominantErrorAttribute(
    m.shapeErrorRate ?? null,
    m.colorErrorRate ?? null,
    m.doubleErrorRate ?? null
  );

  const spatialNeglect =
    m.spatialNeglectIndex !== null &&
    m.spatialNeglectIndex !== undefined &&
    m.spatialNeglectIndex > 50;

  const problemRegion = resolveProblemRegion(
    m.quadrantErrorMap,
    m.spatialNeglectIndex
  );

  const severity = resolveSeverity(m.omissionRate, m.commissionRate, spatialNeglect);
  const answer = resolveAnswer(m.omissionRate, m.commissionRate, m.engagementStatus);

  const interpretation = buildInterpretation(
    dominantErrorAttribute,
    problemRegion,
    spatialNeglect,
    m.omissionRate,
    m.commissionRate
  );

  return {
    answer,
    dominantErrorAttribute,
    problemRegion,
    spatialNeglect,
    severity,
    interpretation,
    summary:
      `Resposta: ${answer}. Atributo dominante: ${dominantErrorAttribute}. ` +
      `Região: ${problemRegion}. Neglect: ${spatialNeglect ? 'sim' : 'não'}. ` +
      `Severidade: ${severity}.`,
  };
}
