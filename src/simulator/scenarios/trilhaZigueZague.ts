// src/simulator/scenarios/trilhaZigueZague.ts
// Cenários determinísticos para TrilhaZigueZague.
// Importa as funções reais de assessment — nenhum valor hardcoded além dos inputs de teste.

import { buildTrilhaZigueZagueScaleResult } from '../../assessment/trilhaZigueZague/buildTrilhaZigueZagueScaleResult';
import type { TrilhaZigueZagueSessionMetrics } from '../../assessment/trilhaZigueZague/types';
import type { Scenario } from '../types';

const SESSION_ID_PREFIX = 'sim-trilha-';

function buildPayload(metrics: TrilhaZigueZagueSessionMetrics, sessionId: string) {
  const scale = buildTrilhaZigueZagueScaleResult(metrics);
  const severity =
    scale.score >= 80 ? 'minimo' :
    scale.score >= 60 ? 'leve' :
    scale.score >= 40 ? 'moderado' : 'importante';

  return {
    game: 'trilha-zigue-zague',
    attentionType: 'alternada',
    sessionId,
    startedAt: new Date().toISOString(),
    severity,
    totalTrials: 0,
    timePhase1:       metrics.timePhase1,
    timePhase2:       metrics.timePhase2,
    shiftingErrors:   metrics.shiftingErrors,
    sequencingErrors: metrics.sequencingErrors,
    totalErrors:      metrics.totalErrors,
    switchCostRtMs:   metrics.switchingCost,
  };
}

// BEST_COST=10, WORST_COST=100, ERROR_PENALTY=2
// score = clamp(100 - ((switchingCost - 10) / 90) * 100 - totalErrors * 2, 0, 100)

export const trilhaZigueZagueScenarios: Scenario[] = [
  {
    id: 'trilha-perfect',
    label: 'Perfeito (score ≈ 100)',
    description: 'Tempo mínimo de alternância (10s), zero erros. Espera score=100, severity=minimo.',
    game: 'trilha-zigue-zague',
    attentionType: 'alternada',
    expectedStatus: 200,
    expectedLevelEmoji: '🏆',
    localScore: 100,
    buildPayload: () => buildPayload(
      { timePhase1: 20, timePhase2: 30, switchingCost: 10, shiftingErrors: 0, sequencingErrors: 0, totalErrors: 0 },
      `${SESSION_ID_PREFIX}perfect-${Date.now()}`
    ),
  },
  {
    id: 'trilha-high',
    label: 'Alto desempenho (score ≈ 80)',
    description: 'Switching cost 28s, 0 erros → score ≈ 80, severity=minimo.',
    game: 'trilha-zigue-zague',
    attentionType: 'alternada',
    expectedStatus: 200,
    expectedLevelEmoji: '⭐',
    localScore: 80,
    buildPayload: () => buildPayload(
      { timePhase1: 20, timePhase2: 48, switchingCost: 28, shiftingErrors: 0, sequencingErrors: 0, totalErrors: 0 },
      `${SESSION_ID_PREFIX}high-${Date.now()}`
    ),
  },
  {
    id: 'trilha-low',
    label: 'Baixo desempenho (score ≈ 20)',
    description: 'Switching cost 78s, 6 erros → score ≈ 20, severity=importante.',
    game: 'trilha-zigue-zague',
    attentionType: 'alternada',
    expectedStatus: 200,
    expectedLevelEmoji: '⚠️',
    localScore: 20,
    buildPayload: () => buildPayload(
      { timePhase1: 20, timePhase2: 98, switchingCost: 78, shiftingErrors: 3, sequencingErrors: 3, totalErrors: 6 },
      `${SESSION_ID_PREFIX}low-${Date.now()}`
    ),
  },
  {
    id: 'trilha-invalid',
    label: 'Payload inválido (sem severity)',
    description: 'Envia payload sem o campo `severity`. Espera HTTP 400 do dispatcher.',
    game: 'trilha-zigue-zague',
    attentionType: 'alternada',
    expectedStatus: 400,
    expectedLevelEmoji: '🔴',
    localScore: null,
    buildPayload: () => ({
      game: 'trilha-zigue-zague',
      attentionType: 'alternada',
      sessionId: `${SESSION_ID_PREFIX}invalid-${Date.now()}`,
      startedAt: new Date().toISOString(),
      // severity: OMITIDO INTENCIONALMENTE
      totalTrials: 0,
      timePhase1: 20,
      timePhase2: 30,
      switchCostRtMs: 10,
    }),
  },
];
