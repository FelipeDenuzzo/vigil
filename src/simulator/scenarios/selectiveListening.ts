// src/simulator/scenarios/selectiveListening.ts
// Cenários para Escuta Seletiva (Dividida)

import { buildSelectiveListeningTechnicalReport } from '../../assessment/selectiveListening/buildSelectiveListeningTechnicalReport';
import type { SelectiveListeningMetrics, SelectiveListeningScaleResult } from '../../assessment/selectiveListening/types';
import type { Scenario } from '../types';

const SESSION_ID_PREFIX = 'sim-selective-listening-';

function buildPayload(metrics: SelectiveListeningMetrics, scaleResult: SelectiveListeningScaleResult, sessionId: string) {
  return buildSelectiveListeningTechnicalReport(sessionId, metrics, scaleResult) as any;
}

const perfectMetrics: SelectiveListeningMetrics = {
  totalRounds: 6,
  serialAccuracy: 1.0,
  itemAccuracy: 1.0,
  omissions: 0,
  meanResponseTimeMs: 1400,
  distractorIntrusionRate: 0.0,
  loadCost: 0.0,
  avgReplayCount: 0.0,
};

const perfectScaleResult: SelectiveListeningScaleResult = {
  score: 100,
  level: 'mínimo',
  accuracyNote: 'Acurácia serial perfeita (100% de acertos).',
  intrusionNote: 'Zero intrusões de dígitos distratores.',
};

const highMetrics: SelectiveListeningMetrics = {
  totalRounds: 6,
  serialAccuracy: 0.82,
  itemAccuracy: 0.88,
  omissions: 0,
  meanResponseTimeMs: 1850,
  distractorIntrusionRate: 0.05,
  loadCost: 0.12,
  avgReplayCount: 0.17,
};

const highScaleResult: SelectiveListeningScaleResult = {
  score: 80,
  level: 'leve',
  accuracyNote: 'Acurácia serial boa (82% de acertos).',
  intrusionNote: 'Baixa taxa de intrusão do distrator.',
};

const lowMetrics: SelectiveListeningMetrics = {
  totalRounds: 6,
  serialAccuracy: 0.45,
  itemAccuracy: 0.60,
  omissions: 1,
  meanResponseTimeMs: 2900,
  distractorIntrusionRate: 0.28, // alto nível de intrusão auditiva
  loadCost: 0.35,
  avgReplayCount: 0.83,
};

const lowScaleResult: SelectiveListeningScaleResult = {
  score: 41,
  level: 'moderado',
  accuracyNote: 'Acurácia serial bastante reduzida, indicando falhas sob carga cognitiva concorrente.',
  intrusionNote: 'Alta taxa de intrusão de dígitos da voz concorrente (distratora).',
};

export const selectiveListeningScenarios: Scenario[] = [
  {
    id: 'selectivelistening-perfect',
    label: 'Perfeito (score = 100)',
    description: '100% de acerto serial, zero intrusão e tempo de resposta rápido.',
    game: 'escuta-seletiva',
    attentionType: 'dividida',
    expectedStatus: 200,
    expectedLevelEmoji: '🏆',
    localScore: perfectScaleResult.score,
    buildPayload: () => buildPayload(perfectMetrics, perfectScaleResult, `${SESSION_ID_PREFIX}perfect-${Date.now()}`),
  },
  {
    id: 'selectivelistening-high',
    label: 'Alto desempenho (score = 80)',
    description: 'Poucos erros, baixa intrusão e tempo de resposta funcional.',
    game: 'escuta-seletiva',
    attentionType: 'dividida',
    expectedStatus: 200,
    expectedLevelEmoji: '⭐',
    localScore: highScaleResult.score,
    buildPayload: () => buildPayload(highMetrics, highScaleResult, `${SESSION_ID_PREFIX}high-${Date.now()}`),
  },
  {
    id: 'selectivelistening-low',
    label: 'Baixo desempenho (score = 41)',
    description: 'Alta taxa de erro serial e de intrusão de dígitos da voz distratora concorrente.',
    game: 'escuta-seletiva',
    attentionType: 'dividida',
    expectedStatus: 200,
    expectedLevelEmoji: '⚠️',
    localScore: lowScaleResult.score,
    buildPayload: () => buildPayload(lowMetrics, lowScaleResult, `${SESSION_ID_PREFIX}low-${Date.now()}`),
  },
  {
    id: 'selectivelistening-invalid',
    label: 'Payload inválido (sem serialAccuracy)',
    description: 'Envia payload sem `serialAccuracy` que gera erro na validação. Espera HTTP 400.',
    game: 'escuta-seletiva',
    attentionType: 'dividida',
    expectedStatus: 400,
    expectedLevelEmoji: '🔴',
    localScore: null,
    buildPayload: () => ({
      game: 'escuta-seletiva',
      attentionType: 'dividida',
      sessionId: `${SESSION_ID_PREFIX}invalid-${Date.now()}`,
      severity: 'minimo',
      // serialAccuracy: OMITIDO INTENCIONALMENTE
    }),
  },
];
