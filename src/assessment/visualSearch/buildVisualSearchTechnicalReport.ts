// src/assessment/visualSearch/buildVisualSearchTechnicalReport.ts
// Parecer técnico pós-sessão — usa apenas errorProfile e spatialProfile.

import { calculateVisualSearchMetrics } from './calculateVisualSearchMetrics';
import type { VisualSearchAnalysisInput } from './types';

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

function resolveProblemRegion(
  _input: VisualSearchAnalysisInput['roundClicks'],
  spatialProfile: ReturnType<typeof calculateVisualSearchMetrics>['spatialProfile']
): VisualSearchTechnicalReport['problemRegion'] {
  const { byQuadrant } = spatialProfile;
  const left = (byQuadrant.TL?.errors ?? 0) + (byQuadrant.BL?.errors ?? 0);
  const right = (byQuadrant.TR?.errors ?? 0) + (byQuadrant.BR?.errors ?? 0);
  const total = left + right;

  if (total === 0) return 'indeterminado';

  const leftRatio = left / total;
  const rightRatio = right / total;

  if (leftRatio >= 0.6) return 'esquerda';
  if (rightRatio >= 0.6) return 'direita';
  return 'distribuido';
}

function resolveSeverity(
  commissionRate: number,
  spatialNeglect: boolean
): ReportSeverity {
  if (spatialNeglect && commissionRate >= 0.3) return 'importante';
  if (commissionRate >= 0.3) return 'moderado';
  if (commissionRate >= 0.15) return 'leve';
  return 'minimo';
}

function resolveAnswer(
  commissionRate: number,
  engagementStatus: 'suficiente' | 'insuficiente'
): ReportAnswer {
  if (engagementStatus === 'insuficiente') return 'insuficiente';
  if (commissionRate >= 0.25) return 'sim';
  if (commissionRate >= 0.1) return 'parcial';
  return 'nao';
}

function buildInterpretation(
  dominantAttr: VisualSearchTechnicalReport['dominantErrorAttribute'],
  problemRegion: VisualSearchTechnicalReport['problemRegion'],
  spatialNeglect: boolean,
  commissionRate: number
): string {
  const parts: string[] = [];

  if (dominantAttr === 'forma')
    parts.push('O atributo predominante nos erros é a forma — tendência a ignorar diferenças de forma entre alvo e distratores.');
  else if (dominantAttr === 'cor')
    parts.push('O atributo predominante nos erros é a cor — diferenciação por cor mostra-se deficitária.');
  else if (dominantAttr === 'duplo')
    parts.push('Os erros envolvem forma e cor simultaneamente, sugerindo dificuldade generalizada de discriminação perceptual.');

  if (problemRegion === 'esquerda')
    parts.push('Concentração de erros predominantemente na metade esquerda do campo visual.');
  else if (problemRegion === 'direita')
    parts.push('Concentração de erros predominantemente na metade direita do campo visual.');
  else if (problemRegion === 'distribuido')
    parts.push('Erros distribuídos de forma relativamente uniforme pelo campo visual.');

  if (spatialNeglect)
    parts.push('Índice de negligência espacial elevado, com assimetria marcada na cobertura do campo visual.');

  if (commissionRate >= 0.2)
    parts.push(`Taxa de cliques em distratores elevada (${(commissionRate * 100).toFixed(0)}%).`);

  if (parts.length === 0)
    return 'Desempenho dentro dos parâmetros esperados, sem padrão de erro predominante identificado.';

  return parts.join(' ');
}

export function buildVisualSearchTechnicalReport(
  roundClicks: VisualSearchAnalysisInput['roundClicks']
): VisualSearchTechnicalReport {
  const { errorProfile, spatialProfile } = calculateVisualSearchMetrics(roundClicks);

  const totalClicks = roundClicks.reduce((sum, r) => sum + r.clicks.length, 0);
  const commissionRate =
    totalClicks > 0 ? errorProfile.totalAnalyzedErrors / totalClicks : 0;

  const engagementStatus: 'suficiente' | 'insuficiente' =
    totalClicks < 3 ? 'insuficiente' : 'suficiente';

  const dominantAttr = errorProfile.dominantErrorAttribute;
  const dominantErrorAttribute: VisualSearchTechnicalReport['dominantErrorAttribute'] =
    dominantAttr === 'indisponivel' ? 'indeterminado' : dominantAttr;

  const spatialNeglect =
    spatialProfile.spatialNeglectSide === 'esquerda' ||
    spatialProfile.spatialNeglectSide === 'direita';

  const problemRegion = resolveProblemRegion(roundClicks, spatialProfile);
  const severity = resolveSeverity(commissionRate, spatialNeglect);
  const answer = resolveAnswer(commissionRate, engagementStatus);
  const interpretation = buildInterpretation(
    dominantErrorAttribute,
    problemRegion,
    spatialNeglect,
    commissionRate
  );

  return {
    answer,
    dominantErrorAttribute,
    problemRegion,
    spatialNeglect,
    severity,
    interpretation,
    summary:
      `Resposta: ${answer}. Atributo: ${dominantErrorAttribute}. ` +
      `Região: ${problemRegion}. Neglect: ${spatialNeglect ? 'sim' : 'não'}. ` +
      `Severidade: ${severity}.`,
  };
}
