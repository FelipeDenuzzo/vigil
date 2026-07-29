// src/simulator/scenarios/visualSearch.ts
// Cenários para Visual Search (Olho de Águia - seletiva)

import { calculateVisualSearchMetrics } from '../../attentions/selective/games/VisualSearchHunt/assessment/calculateVisualSearchMetrics';
import { buildVisualSearchScaleResult } from '../../attentions/selective/games/VisualSearchHunt/assessment/buildVisualSearchScaleResult';
import { buildVisualSearchTechnicalReport } from '../../attentions/selective/games/VisualSearchHunt/assessment/buildVisualSearchTechnicalReport';
import { buildEvaluatorInput } from '../../lib/evaluatorClient';
import type { VisualSearchSessionMetricsInput } from '../../attentions/selective/games/VisualSearchHunt/assessment/visualSearchScale.types';
import type { Scenario } from '../types';

const SESSION_ID_PREFIX = 'sim-visual-search-';

function buildPayload(sessionMetricsInput: VisualSearchSessionMetricsInput, sessionId: string) {
  const metrics = calculateVisualSearchMetrics(sessionMetricsInput);
  const technicalReport = buildVisualSearchTechnicalReport(sessionMetricsInput);
  const roundCount = sessionMetricsInput.rounds.length;
  const totalClicks = sessionMetricsInput.rounds.reduce((sum, r) => sum + r.hits + r.errors, 0);

  return buildEvaluatorInput(
    sessionId,
    metrics,
    technicalReport,
    roundCount,
    totalClicks
  ) as any;
}

const perfectSessionInput = (): VisualSearchSessionMetricsInput => ({
  rounds: [
    { round: 1, totalTargets: 5, hits: 5, errors: 0, missedTargets: 0, durationMs: 4000, distractorOpportunities: 25, reactionTimes: [600, 700, 650, 800, 750], systematicMoves: 4, erraticMoves: 0, organizationIndex: 0.9, scanPattern: 'row-wise', leftSideClicks: 2, rightSideClicks: 3, leftSideTargetMisses: 0, rightSideTargetMisses: 0 },
    { round: 2, totalTargets: 5, hits: 5, errors: 0, missedTargets: 0, durationMs: 4200, distractorOpportunities: 25, reactionTimes: [620, 680, 640, 790, 730], systematicMoves: 4, erraticMoves: 0, organizationIndex: 0.95, scanPattern: 'row-wise', leftSideClicks: 3, rightSideClicks: 2, leftSideTargetMisses: 0, rightSideTargetMisses: 0 },
  ],
});

const highSessionInput = (): VisualSearchSessionMetricsInput => ({
  rounds: [
    { round: 1, totalTargets: 5, hits: 4, errors: 1, missedTargets: 1, durationMs: 5000, distractorOpportunities: 25, reactionTimes: [800, 950, 780, 1100], systematicMoves: 3, erraticMoves: 1, organizationIndex: 0.75, scanPattern: 'mixed', leftSideClicks: 2, rightSideClicks: 3, leftSideTargetMisses: 0, rightSideTargetMisses: 1 },
    { round: 2, totalTargets: 5, hits: 5, errors: 0, missedTargets: 0, durationMs: 4800, distractorOpportunities: 25, reactionTimes: [720, 840, 750, 920, 880], systematicMoves: 4, erraticMoves: 0, organizationIndex: 0.85, scanPattern: 'row-wise', leftSideClicks: 3, rightSideClicks: 2, leftSideTargetMisses: 0, rightSideTargetMisses: 0 },
  ],
});

const lowSessionInput = (): VisualSearchSessionMetricsInput => ({
  rounds: [
    { round: 1, totalTargets: 5, hits: 2, errors: 5, missedTargets: 3, durationMs: 10000, distractorOpportunities: 25, reactionTimes: [1400, 1950], systematicMoves: 1, erraticMoves: 5, organizationIndex: 0.3, scanPattern: 'mixed', leftSideClicks: 1, rightSideClicks: 6, leftSideTargetMisses: 3, rightSideTargetMisses: 0 }, // assimetria de omissões esquerda (negligência)
    { round: 2, totalTargets: 5, hits: 1, errors: 4, missedTargets: 4, durationMs: 12000, distractorOpportunities: 25, reactionTimes: [2200], systematicMoves: 0, erraticMoves: 4, organizationIndex: 0.2, scanPattern: 'mixed', leftSideClicks: 0, rightSideClicks: 5, leftSideTargetMisses: 4, rightSideTargetMisses: 0 },
  ],
});

export const visualSearchScenarios: Scenario[] = [
  {
    id: 'visualsearch-perfect',
    label: 'Perfeito (Eagle Eye, score = 100)',
    description: '100% acertos, zero erros, tempo de resposta baixo e consistência espacial perfeita.',
    game: 'visual-search',
    attentionType: 'seletiva',
    expectedStatus: 200,
    expectedLevelEmoji: '🏆',
    localScore: buildVisualSearchScaleResult(perfectSessionInput()).score,
    buildPayload: () => buildPayload(perfectSessionInput(), `${SESSION_ID_PREFIX}perfect-${Date.now()}`),
  },
  {
    id: 'visualsearch-high',
    label: 'Desempenho bom (score ≈ 80)',
    description: 'Poucos erros, padrão sistemático de busca ainda mantido.',
    game: 'visual-search',
    attentionType: 'seletiva',
    expectedStatus: 200,
    expectedLevelEmoji: '⭐',
    localScore: buildVisualSearchScaleResult(highSessionInput()).score,
    buildPayload: () => buildPayload(highSessionInput(), `${SESSION_ID_PREFIX}high-${Date.now()}`),
  },
  {
    id: 'visualsearch-low',
    label: 'Baixo desempenho (score < 40)',
    description: 'Muitas omissões e erros, forte padrão caótico de busca e negligência espacial à esquerda.',
    game: 'visual-search',
    attentionType: 'seletiva',
    expectedStatus: 200,
    expectedLevelEmoji: '⚠️',
    localScore: buildVisualSearchScaleResult(lowSessionInput()).score,
    buildPayload: () => buildPayload(lowSessionInput(), `${SESSION_ID_PREFIX}low-${Date.now()}`),
  },
  {
    id: 'visualsearch-invalid',
    label: 'Payload inválido (sem commissionRate)',
    description: 'Envia payload sem `commissionRate`. Espera HTTP 400.',
    game: 'visual-search',
    attentionType: 'seletiva',
    expectedStatus: 400,
    expectedLevelEmoji: '🔴',
    localScore: null,
    buildPayload: () => ({
      game: 'visual-search',
      attentionType: 'seletiva',
      sessionId: `${SESSION_ID_PREFIX}invalid-${Date.now()}`,
      severity: 'minimo',
      // commissionRate: OMITIDO INTENCIONALMENTE
    }),
  },
];
