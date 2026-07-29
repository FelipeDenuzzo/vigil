// src/simulator/scenarios/colorShape.ts
// Cenários determinísticos para ColorShape (atenção alternada).

import { buildColorShapeScaleResult } from '../../assessment/colorShape/buildColorShapeScaleResult';
import type { ColorShapeMetrics } from '../../assessment/colorShape/types';
import type { Scenario } from '../types';

const SESSION_ID_PREFIX = 'sim-colorshape-';

function buildPayload(m: ColorShapeMetrics, sessionId: string) {
  const s = buildColorShapeScaleResult(m);

  return {
    game: 'color-shape',
    attentionType: 'alternada',
    sessionId,
    startedAt: new Date().toISOString(),
    severity: s.severity,
    totalTrials:         m.totalTrials,
    accuracy:            m.accuracy,
    avgRtMs:             m.avgRtMs,
    timeoutCount:        m.timeoutCount,
    timeoutPct:          m.timeoutPct,
    switchTrials:        m.switchTrials,
    repeatTrials:        m.repeatTrials,
    switchAccuracy:      m.switchAccuracy,
    repeatAccuracy:      m.repeatAccuracy,
    switchAvgRtMs:       m.switchAvgRtMs,
    repeatAvgRtMs:       m.repeatAvgRtMs,
    switchCostRtMs:      m.switchCostRtMs,
    switchCostErrorPp:   m.switchCostErrorPp,
    switchingCostNote:   s.switchingCostNote,
    pureTrials:          m.pureTrials,
    pureAccuracy:        m.pureAccuracy,
    pureAvgRtMs:         m.pureAvgRtMs,
    mixingCostRtMs:      m.mixingCostRtMs,
    mixingCostErrorPp:   m.mixingCostErrorPp,
    mixingCostNote:      s.mixingCostNote,
    perseverationErrors: m.perseverationErrors,
    perseverationPct:    m.perseverationPct,
    perseverationNote:   s.perseverationNote,
    accuracyNote:        s.accuracyNote,
    colorAccuracy:       m.colorAccuracy,
    shapeAccuracy:       m.shapeAccuracy,
    colorAvgRtMs:        m.colorAvgRtMs,
    shapeAvgRtMs:        m.shapeAvgRtMs,
  };
}

function perfectMetrics(): ColorShapeMetrics {
  return {
    totalTrials: 80, accuracy: 100, avgRtMs: 300,
    timeoutCount: 0, timeoutPct: 0,
    switchTrials: 40, repeatTrials: 40,
    switchAccuracy: 100, repeatAccuracy: 100,
    switchAvgRtMs: 320, repeatAvgRtMs: 280,
    switchCostRtMs: 40, switchCostErrorPp: 0,
    pureTrials: 20, pureAccuracy: 100, pureAvgRtMs: 260,
    mixingCostRtMs: 40, mixingCostErrorPp: 0,
    perseverationErrors: 0, perseverationPct: 0,
    colorAccuracy: 100, shapeAccuracy: 100,
    colorAvgRtMs: 270, shapeAvgRtMs: 290,
  };
}

function highMetrics(): ColorShapeMetrics {
  return {
    totalTrials: 80, accuracy: 88, avgRtMs: 430,
    timeoutCount: 2, timeoutPct: 2.5,
    switchTrials: 40, repeatTrials: 40,
    switchAccuracy: 85, repeatAccuracy: 91,
    switchAvgRtMs: 460, repeatAvgRtMs: 400,
    switchCostRtMs: 60, switchCostErrorPp: 6,
    pureTrials: 20, pureAccuracy: 92, pureAvgRtMs: 360,
    mixingCostRtMs: 70, mixingCostErrorPp: 4,
    perseverationErrors: 1, perseverationPct: 2.5,
    colorAccuracy: 90, shapeAccuracy: 86,
    colorAvgRtMs: 410, shapeAvgRtMs: 450,
  };
}

function lowMetrics(): ColorShapeMetrics {
  return {
    totalTrials: 60, accuracy: 55, avgRtMs: 780,
    timeoutCount: 10, timeoutPct: 16.7,
    switchTrials: 30, repeatTrials: 30,
    switchAccuracy: 50, repeatAccuracy: 60,
    switchAvgRtMs: 830, repeatAvgRtMs: 720,
    switchCostRtMs: 110, switchCostErrorPp: 10,
    pureTrials: 15, pureAccuracy: 70, pureAvgRtMs: 650,
    mixingCostRtMs: 130, mixingCostErrorPp: 8,
    perseverationErrors: 9, perseverationPct: 30,
    colorAccuracy: 60, shapeAccuracy: 50,
    colorAvgRtMs: 760, shapeAvgRtMs: 800,
  };
}

export const colorShapeScenarios: Scenario[] = [
  {
    id: 'colorshape-perfect',
    label: 'Perfeito (accuracy 100%)',
    description: '80 trials, 100% acurácia, 0 perseverações, switch cost 40ms.',
    game: 'color-shape',
    attentionType: 'alternada',
    expectedStatus: 200,
    expectedLevelEmoji: '🏆',
    localScore: buildColorShapeScaleResult(perfectMetrics()).score,
    buildPayload: () => buildPayload(perfectMetrics(), `${SESSION_ID_PREFIX}perfect-${Date.now()}`),
  },
  {
    id: 'colorshape-high',
    label: 'Alto desempenho (~88% accuracy)',
    description: '80 trials, 88% acurácia, 1 perseveração, switch cost 60ms.',
    game: 'color-shape',
    attentionType: 'alternada',
    expectedStatus: 200,
    expectedLevelEmoji: '⭐',
    localScore: buildColorShapeScaleResult(highMetrics()).score,
    buildPayload: () => buildPayload(highMetrics(), `${SESSION_ID_PREFIX}high-${Date.now()}`),
  },
  {
    id: 'colorshape-low',
    label: 'Baixo desempenho (~55% accuracy)',
    description: '60 trials, 55% acurácia, 9 perseverações, severity=importante.',
    game: 'color-shape',
    attentionType: 'alternada',
    expectedStatus: 200,
    expectedLevelEmoji: '⚠️',
    localScore: buildColorShapeScaleResult(lowMetrics()).score,
    buildPayload: () => buildPayload(lowMetrics(), `${SESSION_ID_PREFIX}low-${Date.now()}`),
  },
  {
    id: 'colorshape-invalid',
    label: 'Payload inválido (sem severity + totalTrials)',
    description: 'Envia payload sem `severity` e sem `totalTrials`. Espera HTTP 400.',
    game: 'color-shape',
    attentionType: 'alternada',
    expectedStatus: 400,
    expectedLevelEmoji: '🔴',
    localScore: null,
    buildPayload: () => ({
      game: 'color-shape',
      attentionType: 'alternada',
      sessionId: `${SESSION_ID_PREFIX}invalid-${Date.now()}`,
      startedAt: new Date().toISOString(),
      // severity e totalTrials: OMITIDOS INTENCIONALMENTE
      accuracy: 88,
    }),
  },
];
