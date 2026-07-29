// src/simulator/scenarios/longMazes.ts
// Cenários para Long Mazes (Labirintos Longos - planejamento sustentado)

import { calculateLongMazesMetrics } from '../../assessment/longMazes/calculateLongMazesMetrics';
import { buildLongMazesTechnicalReport } from '../../assessment/longMazes/buildLongMazesTechnicalReport';
import type { MazeFullSessionLog } from '../../attentions/sustained/games/LongMazes/types';
import type { Scenario } from '../types';

const SESSION_ID_PREFIX = 'sim-longmazes-';

function buildPayload(log: MazeFullSessionLog, sessionId: string) {
  const metrics = calculateLongMazesMetrics(log);
  return buildLongMazesTechnicalReport(metrics, sessionId) as any;
}

const perfectSession = (): MazeFullSessionLog => ({
  phases: [
    { levelId: 1, success: true, steps: 10, shortestPathLength: 10, revisits: 0, deadEndEntries: 0, longStops: 0, postErrorPause: 0, elapsedMs: 5000, efficiency: 100 },
    { levelId: 2, success: true, steps: 15, shortestPathLength: 15, revisits: 0, deadEndEntries: 0, longStops: 0, postErrorPause: 0, elapsedMs: 7000, efficiency: 100 },
    { levelId: 3, success: true, steps: 20, shortestPathLength: 20, revisits: 0, deadEndEntries: 0, longStops: 0, postErrorPause: 0, elapsedMs: 10000, efficiency: 100 },
  ],
});

const highSession = (): MazeFullSessionLog => ({
  phases: [
    { levelId: 1, success: true, steps: 12, shortestPathLength: 10, revisits: 1, deadEndEntries: 0, longStops: 0, postErrorPause: 200, elapsedMs: 6500, efficiency: 83 },
    { levelId: 2, success: true, steps: 18, shortestPathLength: 15, revisits: 1, deadEndEntries: 1, longStops: 0, postErrorPause: 300, elapsedMs: 9000, efficiency: 83 },
    { levelId: 3, success: true, steps: 22, shortestPathLength: 20, revisits: 0, deadEndEntries: 0, longStops: 0, postErrorPause: 0, elapsedMs: 11000, efficiency: 91 },
  ],
});

const lowSession = (): MazeFullSessionLog => ({
  phases: [
    { levelId: 1, success: true, steps: 25, shortestPathLength: 10, revisits: 6, deadEndEntries: 4, longStops: 2, postErrorPause: 1200, elapsedMs: 25000, efficiency: 40 },
    { levelId: 2, success: false, steps: 30, shortestPathLength: 15, revisits: 8, deadEndEntries: 5, longStops: 4, postErrorPause: 1500, elapsedMs: 40000, efficiency: 50 },
    { levelId: 3, success: false, steps: 10, shortestPathLength: 20, revisits: 2, deadEndEntries: 1, longStops: 1, postErrorPause: 800, elapsedMs: 15000, efficiency: 50 },
  ],
});

export const longMazesScenarios: Scenario[] = [
  {
    id: 'longmazes-perfect',
    label: 'Perfeito (score ≈ 100)',
    description: '3 fases concluídas com sucesso, caminhos ótimos, zero revisitas ou paradas.',
    game: 'long-mazes',
    attentionType: 'sustentada',
    expectedStatus: 200,
    expectedLevelEmoji: '🏆',
    localScore: calculateLongMazesMetrics(perfectSession()).avgEfficiencyPct,
    buildPayload: () => buildPayload(perfectSession(), `${SESSION_ID_PREFIX}perfect-${Date.now()}`),
  },
  {
    id: 'longmazes-high',
    label: 'Alto desempenho (score ≈ 75)',
    description: 'Fases concluídas com poucos desvios, poucas revisitas e eficiência média razoável.',
    game: 'long-mazes',
    attentionType: 'sustentada',
    expectedStatus: 200,
    expectedLevelEmoji: '⭐',
    localScore: calculateLongMazesMetrics(highSession()).avgEfficiencyPct,
    buildPayload: () => buildPayload(highSession(), `${SESSION_ID_PREFIX}high-${Date.now()}`),
  },
  {
    id: 'longmazes-low',
    label: 'Baixo desempenho (score < 30)',
    description: 'Apenas 1 fase concluída com sucesso. Alta taxa de revisitas e erros de beco sem saída.',
    game: 'long-mazes',
    attentionType: 'sustentada',
    expectedStatus: 200,
    expectedLevelEmoji: '⚠️',
    localScore: calculateLongMazesMetrics(lowSession()).avgEfficiencyPct,
    buildPayload: () => buildPayload(lowSession(), `${SESSION_ID_PREFIX}low-${Date.now()}`),
  },
  {
    id: 'longmazes-invalid',
    label: 'Payload inválido (sem completedPhases)',
    description: 'Envia payload sem completedPhases ou severity. Espera HTTP 400.',
    game: 'long-mazes',
    attentionType: 'sustentada',
    expectedStatus: 400,
    expectedLevelEmoji: '🔴',
    localScore: null,
    buildPayload: () => ({
      attentionType: 'sustentada',
      game: 'long-mazes',
      sessionId: `${SESSION_ID_PREFIX}invalid-${Date.now()}`,
      // completedPhases e severity: OMITIDOS INTENCIONALMENTE
    }),
  },
];
