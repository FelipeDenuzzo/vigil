// src/simulator/scenarios/salaDeVigilia.ts
// Cenários para Sala de Vigília (sustentada contínua)

import { buildSalaDeVigiliaTechnicalReport } from '../../assessment/salaDeVigilia/buildSalaDeVigiliaTechnicalReport';
import type { SalaDeVigiliaMetrics, SalaDeVigiliaScaleResult } from '../../assessment/salaDeVigilia/types';
import type { Scenario } from '../types';

const SESSION_ID_PREFIX = 'sim-saladevigilia-';
const DURATION_MS = 180000; // 3 minutos

function buildPayload(metrics: SalaDeVigiliaMetrics, scales: SalaDeVigiliaScaleResult, sessionId: string) {
  const report = buildSalaDeVigiliaTechnicalReport(DURATION_MS, metrics, scales);
  return {
    ...report,
    sessionId,
  };
}

const perfectMetrics: SalaDeVigiliaMetrics = {
  omissions: 0,
  commissions: 0,
  hits: 20,
  hitRate: 1.0,
  meanRT: 380,
  sdRT: 40,
  block1HitRate: 1.0,
  block2HitRate: 1.0,
  vigilanceDecrement: 0,
  block1MeanRT: 375,
  block2MeanRT: 385,
  rtDecrement: 10,
};

const perfectScales: SalaDeVigiliaScaleResult = {
  omissionSeverity: 'normal',
  commissionSeverity: 'normal',
  vigilanceDecrementSeverity: 'none',
  rtVariabilitySeverity: 'low',
  score: 100,
  level: 'Vigilância Estável',
};

const highMetrics: SalaDeVigiliaMetrics = {
  omissions: 2,
  commissions: 1,
  hits: 18,
  hitRate: 0.9,
  meanRT: 440,
  sdRT: 75,
  block1HitRate: 0.9,
  block2HitRate: 0.9,
  vigilanceDecrement: 0,
  block1MeanRT: 430,
  block2MeanRT: 450,
  rtDecrement: 20,
};

const highScales: SalaDeVigiliaScaleResult = {
  omissionSeverity: 'mild',
  commissionSeverity: 'mild',
  vigilanceDecrementSeverity: 'none',
  rtVariabilitySeverity: 'moderate',
  score: 82,
  level: 'Vigilância Estável com Pequenas Flutuações',
};

const lowMetrics: SalaDeVigiliaMetrics = {
  omissions: 9,
  commissions: 6,
  hits: 11,
  hitRate: 0.55,
  meanRT: 620,
  sdRT: 180,
  block1HitRate: 0.7,
  block2HitRate: 0.4,
  vigilanceDecrement: 0.3,
  block1MeanRT: 530,
  block2MeanRT: 710,
  rtDecrement: 180,
};

const lowScales: SalaDeVigiliaScaleResult = {
  omissionSeverity: 'severe',
  commissionSeverity: 'moderate',
  vigilanceDecrementSeverity: 'severe',
  rtVariabilitySeverity: 'high',
  score: 35,
  level: 'Vigilância Instável e Fadiga Acentuada',
};

export const salaDeVigiliaScenarios: Scenario[] = [
  {
    id: 'saladevigilia-perfect',
    label: 'Perfeito (Vigilância Estável, score = 100)',
    description: 'Zero omissões, zero falsos alarmes, tempo de reação rápido e consistente.',
    game: 'SalaDeVigilia',
    attentionType: 'sustentada',
    expectedStatus: 200,
    expectedLevelEmoji: '🏆',
    localScore: perfectScales.score,
    buildPayload: () => buildPayload(perfectMetrics, perfectScales, `${SESSION_ID_PREFIX}perfect-${Date.now()}`),
  },
  {
    id: 'saladevigilia-high',
    label: 'Desempenho regular (score = 82)',
    description: 'Poucas omissões/comissões. Flutuações normais de tempo de reação.',
    game: 'SalaDeVigilia',
    attentionType: 'sustentada',
    expectedStatus: 200,
    expectedLevelEmoji: '⭐',
    localScore: highScales.score,
    buildPayload: () => buildPayload(highMetrics, highScales, `${SESSION_ID_PREFIX}high-${Date.now()}`),
  },
  {
    id: 'saladevigilia-low',
    label: 'Baixo desempenho (score = 35)',
    description: 'Muitas omissões e falsos alarmes. Piora acentuada na segunda metade do teste (fadiga).',
    game: 'SalaDeVigilia',
    attentionType: 'sustentada',
    expectedStatus: 200,
    expectedLevelEmoji: '⚠️',
    localScore: lowScales.score,
    buildPayload: () => buildPayload(lowMetrics, lowScales, `${SESSION_ID_PREFIX}low-${Date.now()}`),
  },
  {
    id: 'saladevigilia-invalid',
    label: 'Payload inválido (sem durationMs)',
    description: 'Envia payload sem `durationMs` ou `severity`. Espera HTTP 400.',
    game: 'SalaDeVigilia',
    attentionType: 'sustentada',
    expectedStatus: 400,
    expectedLevelEmoji: '🔴',
    localScore: null,
    buildPayload: () => ({
      attentionType: 'sustentada',
      game: 'SalaDeVigilia',
      sessionId: `${SESSION_ID_PREFIX}invalid-${Date.now()}`,
      // durationMs e severity: OMITIDOS INTENCIONALMENTE
    }),
  },
];
