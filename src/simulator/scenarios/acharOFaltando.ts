// src/simulator/scenarios/acharOFaltando.ts
// Cenários para Achar o Faltando (seletiva)

import { buildAcharOFaltandoTechnicalReport } from '../../assessment/acharOFaltando/buildAcharOFaltandoTechnicalReport';
import type { AcharOFaltandoMetrics, AcharOFaltandoScaleResult } from '../../assessment/acharOFaltando/types';
import type { Scenario } from '../types';

const SESSION_ID_PREFIX = 'sim-achar-o-faltando-';

function buildPayload(metrics: AcharOFaltandoMetrics, scaleResult: AcharOFaltandoScaleResult, sessionId: string) {
  return buildAcharOFaltandoTechnicalReport(sessionId, metrics, scaleResult) as any;
}

const perfectMetrics: AcharOFaltandoMetrics = {
  roundsPlayed: 30,
  totalHits: 30,
  totalOmissions: 0,
  totalFalsePositives: 0,
  totalCorrectRounds: 30,
  accuracyPerMinute: 30.0,
  averageResponseMs: 1200,
  roundCurve: [],
  speedStyle: 'efficient',
  hasFatigue: false,
  spatialAsymmetry: {
    leftOmissions: 0,
    rightOmissions: 0,
    asymmetryRatio: 0.0,
    dominant: 'symmetric',
  },
  phaseMetrics: [
    { phase: 1, phaseLabel: 'Busca Simples', roundsInPhase: 15, hits: 15, omissions: 0, falsePositives: 0, rtMean: 1100, rtSdrt: 100, dPrime: 3.5, postErrorSlowing: null, rtValues: [] },
    { phase: 2, phaseLabel: 'Busca Concorrente', roundsInPhase: 15, hits: 15, omissions: 0, falsePositives: 0, rtMean: 1300, rtSdrt: 120, dPrime: 3.5, postErrorSlowing: null, rtValues: [] },
  ],
  flagImpulsividade: false,
  flagLentificacao: false,
  flagSwitchCost: false,
  flagFadigaAtencional: false,
  firstHalfRtMean: 1100,
  secondHalfRtMean: 1300,
  firstHalfSdrt: 100,
  secondHalfSdrt: 120,
};

const perfectScaleResult: AcharOFaltandoScaleResult = {
  score: 100,
  level: 'mínimo',
  accuracyNote: 'Acurácia perfeita (100% acertos, zero erros).',
  speedNote: 'Velocidade visomotora excelente para o padrão do teste.',
};

const highMetrics: AcharOFaltandoMetrics = {
  roundsPlayed: 30,
  totalHits: 27,
  totalOmissions: 3,
  totalFalsePositives: 1,
  totalCorrectRounds: 26,
  accuracyPerMinute: 24.5,
  averageResponseMs: 1450,
  roundCurve: [],
  speedStyle: 'efficient',
  hasFatigue: false,
  spatialAsymmetry: {
    leftOmissions: 1,
    rightOmissions: 2,
    asymmetryRatio: 0.5,
    dominant: 'symmetric',
  },
  phaseMetrics: [
    { phase: 1, phaseLabel: 'Busca Simples', roundsInPhase: 15, hits: 14, omissions: 1, falsePositives: 0, rtMean: 1350, rtSdrt: 150, dPrime: 3.1, postErrorSlowing: 100, rtValues: [] },
    { phase: 2, phaseLabel: 'Busca Concorrente', roundsInPhase: 15, hits: 13, omissions: 2, falsePositives: 1, rtMean: 1550, rtSdrt: 180, dPrime: 2.8, postErrorSlowing: 120, rtValues: [] },
  ],
  flagImpulsividade: false,
  flagLentificacao: false,
  flagSwitchCost: false,
  flagFadigaAtencional: false,
  firstHalfRtMean: 1350,
  secondHalfRtMean: 1550,
  firstHalfSdrt: 150,
  secondHalfSdrt: 180,
};

const highScaleResult: AcharOFaltandoScaleResult = {
  score: 84,
  level: 'leve',
  accuracyNote: 'Acurácia preservada (90% acertos, poucos erros).',
  speedNote: 'Velocidade visomotora de processamento estável e eficiente.',
};

const lowMetrics: AcharOFaltandoMetrics = {
  roundsPlayed: 30,
  totalHits: 18,
  totalOmissions: 12,
  totalFalsePositives: 8,
  totalCorrectRounds: 14,
  accuracyPerMinute: 11.2,
  averageResponseMs: 2200,
  roundCurve: [],
  speedStyle: 'impulsive',
  hasFatigue: true,
  spatialAsymmetry: {
    leftOmissions: 10, // grande assimetria à esquerda
    rightOmissions: 2,
    asymmetryRatio: 5.0,
    dominant: 'left',
  },
  phaseMetrics: [
    { phase: 1, phaseLabel: 'Busca Simples', roundsInPhase: 15, hits: 11, omissions: 4, falsePositives: 3, rtMean: 1900, rtSdrt: 350, dPrime: 1.8, postErrorSlowing: 250, rtValues: [] },
    { phase: 2, phaseLabel: 'Busca Concorrente', roundsInPhase: 15, hits: 7, omissions: 8, falsePositives: 5, rtMean: 2500, rtSdrt: 480, dPrime: 1.2, postErrorSlowing: 400, rtValues: [] },
  ],
  flagImpulsividade: true,
  flagLentificacao: true,
  flagSwitchCost: true,
  flagFadigaAtencional: true,
  firstHalfRtMean: 1900,
  secondHalfRtMean: 2500,
  firstHalfSdrt: 350,
  secondHalfSdrt: 480,
};

const lowScaleResult: AcharOFaltandoScaleResult = {
  score: 42,
  level: 'moderado',
  accuracyNote: 'Acurácia reduzida com alta incidência de omissões e falsos alarmes.',
  speedNote: 'Lentificação motora e inconsistência de velocidade visível, sugerindo fadiga.',
};

export const acharOFaltandoScenarios: Scenario[] = [
  {
    id: 'acharofaltando-perfect',
    label: 'Perfeito (score = 100)',
    description: '30 rodadas, 100% acertos, zero erros e tempo de reação excelente.',
    game: 'achar-o-faltando',
    attentionType: 'seletiva',
    expectedStatus: 200,
    expectedLevelEmoji: '🏆',
    localScore: perfectScaleResult.score,
    buildPayload: () => buildPayload(perfectMetrics, perfectScaleResult, `${SESSION_ID_PREFIX}perfect-${Date.now()}`),
  },
  {
    id: 'acharofaltando-high',
    label: 'Alto desempenho (score = 84)',
    description: 'Poucas omissões. Padrão de velocidade eficiente e estável.',
    game: 'achar-o-faltando',
    attentionType: 'seletiva',
    expectedStatus: 200,
    expectedLevelEmoji: '⭐',
    localScore: highScaleResult.score,
    buildPayload: () => buildPayload(highMetrics, highScaleResult, `${SESSION_ID_PREFIX}high-${Date.now()}`),
  },
  {
    id: 'acharofaltando-low',
    label: 'Baixo desempenho (score = 42)',
    description: 'Mapeia alta taxa de omissões (principalmente na esquerda - assimetria) e impulsividade.',
    game: 'achar-o-faltando',
    attentionType: 'seletiva',
    expectedStatus: 200,
    expectedLevelEmoji: '⚠️',
    localScore: lowScaleResult.score,
    buildPayload: () => buildPayload(lowMetrics, lowScaleResult, `${SESSION_ID_PREFIX}low-${Date.now()}`),
  },
  {
    id: 'acharofaltando-invalid',
    label: 'Payload inválido (sem sessionId)',
    description: 'Envia payload sem `sessionId` que falha na rota básica. Espera HTTP 400.',
    game: 'achar-o-faltando',
    attentionType: 'seletiva',
    expectedStatus: 400,
    expectedLevelEmoji: '🔴',
    localScore: null,
    buildPayload: () => ({
      attentionType: 'seletiva',
      game: 'achar-o-faltando',
      severity: 'minimo',
      totalRounds: 30,
      // sessionId: OMITIDO INTENCIONALMENTE
    }),
  },
];
