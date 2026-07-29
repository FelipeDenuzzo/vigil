// src/simulator/scenarios/fruitWatch.ts
// Cenários para Fruit Watch (Foco Ninja - contagem sustentada)

import { calculateFruitWatchScore } from '../../attentions/sustained/games/FruitWatch/logic';
import type { PhaseRawResult } from '../../attentions/sustained/games/FruitWatch/types';
import type { Scenario } from '../types';

const SESSION_ID_PREFIX = 'sim-fruitwatch-';

function buildPayload(results: PhaseRawResult[], sessionId: string) {
  const metrics = calculateFruitWatchScore(results);
  const severity =
    metrics.focoContinuo >= 80 ? 'minimo' :
    metrics.focoContinuo >= 60 ? 'leve' :
    metrics.focoContinuo >= 40 ? 'moderado' : 'importante';

  return {
    attentionType: 'sustentada',
    game: 'fruit-watch',
    sessionId,
    severity,
    focoContinuo: metrics.focoContinuo,
    controleCalma: metrics.controleCalma,
    focoMultitarefa: metrics.focoMultitarefa,
    conquistaSecreta: metrics.conquistaSecreta,
    rawResults: metrics.rawResults,
  } as any;
}

const perfectResults = (): PhaseRawResult[] => [
  { phase: 1, targetFigureId: 'apple', targetCount: 10, userAnswer: 10, commissionErrors: 0 },
  { phase: 2, targetFigureId: 'apple', targetCount: 12, userAnswer: 12, commissionErrors: 0 },
  { phase: 3, targetFigureId: 'apple', targetCount: 15, userAnswer: 15, commissionErrors: 0 },
  { phase: 4, targetFigureId: 'apple', targetCount: 8, userAnswer: 8, commissionErrors: 0 },
  { phase: 5, targetFigureId: 'apple', targetCount: 11, userAnswer: 11, bonusRealCount: 2, bonusUserAnswer: 2, commissionErrors: 0, bonusFigureId: 'star' },
  { phase: 6, targetFigureId: 'apple', targetCount: 9, userAnswer: 9, commissionErrors: 0, bonusFigureId: 'star' },
];

const highResults = (): PhaseRawResult[] => [
  { phase: 1, targetFigureId: 'apple', targetCount: 10, userAnswer: 10, commissionErrors: 0 },
  { phase: 2, targetFigureId: 'apple', targetCount: 12, userAnswer: 11, commissionErrors: 0 }, // off by 1 -> accuracy 80%
  { phase: 3, targetFigureId: 'apple', targetCount: 15, userAnswer: 15, commissionErrors: 1 },
  { phase: 4, targetFigureId: 'apple', targetCount: 8, userAnswer: 9, commissionErrors: 1 }, // off by 1 -> accuracy 70%
  { phase: 5, targetFigureId: 'apple', targetCount: 11, userAnswer: 10, bonusRealCount: 2, bonusUserAnswer: 2, commissionErrors: 0, bonusFigureId: 'star' }, // off by 1 -> accuracy 80%
  { phase: 6, targetFigureId: 'apple', targetCount: 9, userAnswer: 9, commissionErrors: 0, bonusFigureId: 'star' },
];

const lowResults = (): PhaseRawResult[] => [
  { phase: 1, targetFigureId: 'apple', targetCount: 10, userAnswer: 6, commissionErrors: 4 }, // off by 4 -> accuracy 0%
  { phase: 2, targetFigureId: 'apple', targetCount: 12, userAnswer: 15, commissionErrors: 5 }, // off by 3 -> accuracy 0%
  { phase: 3, targetFigureId: 'apple', targetCount: 15, userAnswer: 10, commissionErrors: 6 },
  { phase: 4, targetFigureId: 'apple', targetCount: 8, userAnswer: 12, commissionErrors: 4 },
  { phase: 5, targetFigureId: 'apple', targetCount: 11, userAnswer: 5, bonusRealCount: 2, bonusUserAnswer: 0, commissionErrors: 2, bonusFigureId: 'star' },
  { phase: 6, targetFigureId: 'apple', targetCount: 9, userAnswer: 4, commissionErrors: 3, bonusFigureId: 'star' },
];

export const fruitWatchScenarios: Scenario[] = [
  {
    id: 'fruitwatch-perfect',
    label: 'Perfeito (focoContinuo = 100)',
    description: 'Respostas 100% corretas em todas as fases, incluindo conquista secreta.',
    game: 'fruit-watch',
    attentionType: 'sustentada',
    expectedStatus: 200,
    expectedLevelEmoji: '🏆',
    localScore: calculateFruitWatchScore(perfectResults()).focoContinuo,
    buildPayload: () => buildPayload(perfectResults(), `${SESSION_ID_PREFIX}perfect-${Date.now()}`),
  },
  {
    id: 'fruitwatch-high',
    label: 'Alto desempenho (focoContinuo ≈ 80)',
    description: 'Pequenos desvios na contagem. Sem comprometer gravemente a atenção sustentada.',
    game: 'fruit-watch',
    attentionType: 'sustentada',
    expectedStatus: 200,
    expectedLevelEmoji: '⭐',
    localScore: calculateFruitWatchScore(highResults()).focoContinuo,
    buildPayload: () => buildPayload(highResults(), `${SESSION_ID_PREFIX}high-${Date.now()}`),
  },
  {
    id: 'fruitwatch-low',
    label: 'Baixo desempenho (focoContinuo < 30)',
    description: 'Múltiplos erros graves de contagem nas fases. Indica déficit importante.',
    game: 'fruit-watch',
    attentionType: 'sustentada',
    expectedStatus: 200,
    expectedLevelEmoji: '⚠️',
    localScore: calculateFruitWatchScore(lowResults()).focoContinuo,
    buildPayload: () => buildPayload(lowResults(), `${SESSION_ID_PREFIX}low-${Date.now()}`),
  },
  {
    id: 'fruitwatch-invalid',
    label: 'Payload inválido (sem focoContinuo)',
    description: 'Envia payload sem `focoContinuo` ou `severity`. Espera HTTP 400.',
    game: 'fruit-watch',
    attentionType: 'sustentada',
    expectedStatus: 400,
    expectedLevelEmoji: '🔴',
    localScore: null,
    buildPayload: () => ({
      attentionType: 'sustentada',
      game: 'fruit-watch',
      sessionId: `${SESSION_ID_PREFIX}invalid-${Date.now()}`,
      // focoContinuo e severity: OMITIDOS INTENCIONALMENTE
    }),
  },
];
