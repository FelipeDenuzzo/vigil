// src/assessment/visualSearch/buildVisualSearchTechnicalReport.ts
// Parecer técnico pós-sessão — usa errorProfile e spatialProfile.
// Frases e classificações via selectiveAttentionLanguageBank.

import { calculateVisualSearchMetrics } from './calculateVisualSearchMetrics';
import { selectiveAttentionLanguageBank as banco } from '../languageBanks/selectiveAttentionLanguageBank';
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
  positiveIndicators: string[];
  redFlag: string | null;
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
  commissionRate: number,
  severity: ReportSeverity
): string {
  const parts: string[] = [];

  // Frase de severidade do banco
  parts.push(banco.severidade[severity]);

  // Padrão de erro dominante do banco
  if (dominantAttr === 'forma')
    parts.push(banco.padroesDeerro.confusaoDeAtributo);
  else if (dominantAttr === 'cor')
    parts.push(banco.padroesDeerro.cliqueImpulsivo);
  else if (dominantAttr === 'duplo')
    parts.push(banco.padroesDeerro.vulnerabilidadeAInterferencia);

  // Região de problema
  if (problemRegion === 'esquerda')
    parts.push('Concentração de erros predominantemente na metade esquerda do campo visual.');
  else if (problemRegion === 'direita')
    parts.push('Concentração de erros predominantemente na metade direita do campo visual.');
  else if (problemRegion === 'distribuido')
    parts.push('Erros distribuídos de forma relativamente uniforme pelo campo visual.');

  // Sinal de alerta de negligência
  if (spatialNeglect)
    parts.push(banco.sinaisDeAlerta.assimetriaEspacial);

  // Taxa de comissão elevada
  if (commissionRate >= 0.2)
    parts.push(`Taxa de cliques em distratores elevada (${(commissionRate * 100).toFixed(0)}%).`);

  if (parts.length === 0)
    return 'Desempenho dentro dos parâmetros esperados, sem padrão de erro predominante identificado.';

  return parts.join(' ');
}

function resolveRedFlag(
  spatialNeglect: boolean,
  dominantAttr: VisualSearchTechnicalReport['dominantErrorAttribute'],
  commissionRate: number
): string | null {
  if (spatialNeglect) return banco.sinaisDeAlerta.assimetriaEspacial;
  if (dominantAttr === 'duplo' && commissionRate >= 0.3)
    return banco.sinaisDeAlerta.colapsoDeConjuncao;
  if (commissionRate >= 0.5)
    return banco.sinaisDeAlerta.impulsividadeSemCorrecao;
  return null;
}

function resolvePositiveIndicators(
  severity: ReportSeverity,
  commissionRate: number
): string[] {
  if (severity === 'minimo')
    return [
      banco.indicadoresPositivos[0], // Filtro atencional afiado
      banco.indicadoresPositivos[2], // Ótimo controle dos impulsos
      banco.indicadoresPositivos[3], // Precisão cirúrgica
    ];
  if (severity === 'leve')
    return [
      banco.indicadoresPositivos[0], // Filtro atencional afiado
      banco.indicadoresPositivos[4], // Automonitoramento ativo
    ];
  if (commissionRate < 0.5)
    return [banco.indicadoresPositivos[7]]; // Calibragem velocidade/precisão
  return [];
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
    commissionRate,
    severity
  );

  const positiveIndicators = resolvePositiveIndicators(severity, commissionRate);
  const redFlag = resolveRedFlag(spatialNeglect, dominantErrorAttribute, commissionRate);

  return {
    answer,
    dominantErrorAttribute,
    problemRegion,
    spatialNeglect,
    severity,
    interpretation,
    positiveIndicators,
    redFlag,
    summary:
      `Resposta: ${answer}. Atributo: ${dominantErrorAttribute}. ` +
      `Região: ${problemRegion}. Neglect: ${spatialNeglect ? 'sim' : 'não'}. ` +
      `Severidade: ${severity}.`,
  };
}
