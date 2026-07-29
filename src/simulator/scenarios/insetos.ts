// src/simulator/scenarios/insetos.ts
// Cenários determinísticos para Insetos.

import { buildInsetosScaleResult } from '../../assessment/insetos/buildInsetosScaleResult';
import type { InsetosMetrics } from '../../assessment/insetos/types';
import type { Scenario } from '../types';

const SESSION_ID_PREFIX = 'sim-insetos-';

function buildPayload(metrics: InsetosMetrics, sessionId: string) {
  const scale = buildInsetosScaleResult(metrics);

  return {
    game: 'insetos',
    attentionType: 'alternada',
    sessionId,
    startedAt: new Date().toISOString(),
    severity: scale.level,
    totalTrials:      metrics.totalTrials,
    totalHits:        metrics.totalHits,
    accuracy:         metrics.accuracyPct,
    omissions:        metrics.omissions,
    commissionErrors: metrics.commissionErrors,
    meanRT:           metrics.meanRT,
    switchCostRtMs:   metrics.switchCostMs,
    switchingCostNote: scale.switchCostNote,
    accuracyNote:     scale.accuracyNote,
    speedNote:        scale.speedNote,
    multiTrackCostPct: metrics.multiTrackCostPct,
    vigilanceDecayPct: metrics.vigilanceDecayPct,
  };
}

export const insetosScenarios: Scenario[] = [
  {
    id: 'insetos-perfect',
    label: 'Perfeito (accuracy 100%)',
    description: '100 hits, 0 omissões, RT rápido (250ms), switchCost mínimo (30ms).',
    game: 'insetos',
    attentionType: 'alternada',
    expectedStatus: 200,
    expectedLevelEmoji: '🏆',
    localScore: 100,
    buildPayload: () => buildPayload(
      {
        totalTrials: 100, totalHits: 100, omissions: 0,
        commissionErrors: 0, accuracyPct: 100,
        meanRT: 250, switchCostMs: 30,
        multiTrackCostPct: 0, vigilanceDecayPct: 0,
      },
      `${SESSION_ID_PREFIX}perfect-${Date.now()}`
    ),
  },
  {
    id: 'insetos-high',
    label: 'Alto desempenho (accuracy ~85%)',
    description: '85 hits / 100 trials, RT 380ms, switchCost 80ms → score ~85.',
    game: 'insetos',
    attentionType: 'alternada',
    expectedStatus: 200,
    expectedLevelEmoji: '⭐',
    localScore: 85,
    buildPayload: () => buildPayload(
      {
        totalTrials: 100, totalHits: 85, omissions: 15,
        commissionErrors: 2, accuracyPct: 85,
        meanRT: 380, switchCostMs: 80,
        multiTrackCostPct: 5, vigilanceDecayPct: 8,
      },
      `${SESSION_ID_PREFIX}high-${Date.now()}`
    ),
  },
  {
    id: 'insetos-low',
    label: 'Baixo desempenho (accuracy ~40%)',
    description: '40 hits / 100 trials, RT lento 650ms, switchCost 300ms → score penalizado.',
    game: 'insetos',
    attentionType: 'alternada',
    expectedStatus: 200,
    expectedLevelEmoji: '⚠️',
    localScore: 27, // ~acc 40 - penalty (300-50)/(600-50)*20 ≈ 40 - 9 = 31, arredondado
    buildPayload: () => buildPayload(
      {
        totalTrials: 100, totalHits: 40, omissions: 60,
        commissionErrors: 12, accuracyPct: 40,
        meanRT: 650, switchCostMs: 300,
        multiTrackCostPct: 25, vigilanceDecayPct: 35,
      },
      `${SESSION_ID_PREFIX}low-${Date.now()}`
    ),
  },
  {
    id: 'insetos-invalid',
    label: 'Payload inválido (sem severity)',
    description: 'Envia payload sem o campo `severity`. Espera HTTP 400.',
    game: 'insetos',
    attentionType: 'alternada',
    expectedStatus: 400,
    expectedLevelEmoji: '🔴',
    localScore: null,
    buildPayload: () => ({
      game: 'insetos',
      attentionType: 'alternada',
      sessionId: `${SESSION_ID_PREFIX}invalid-${Date.now()}`,
      startedAt: new Date().toISOString(),
      // severity: OMITIDO INTENCIONALMENTE
      totalTrials: 100,
      totalHits: 85,
      accuracy: 85,
    }),
  },
];
