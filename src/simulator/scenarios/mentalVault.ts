// src/simulator/scenarios/mentalVault.ts
// Cenários para Cofre Mental (Dividida)

import { buildMentalVaultTechnicalReport } from '../../assessment/mentalVault/buildMentalVaultTechnicalReport';
import { buildMentalVaultScaleResult } from '../../assessment/mentalVault/buildMentalVaultScaleResult';
import type { MentalVaultSessionMetrics } from '../../assessment/mentalVault/types';
import type { Scenario } from '../types';

const SESSION_ID_PREFIX = 'sim-mentalvault-';
const STARTED_AT = new Date().toISOString();

function buildPayload(metrics: MentalVaultSessionMetrics, sessionId: string) {
  return buildMentalVaultTechnicalReport(sessionId, STARTED_AT, metrics) as any;
}

const perfectMetrics: MentalVaultSessionMetrics = {
  totalRodadas: 6,
  rodadasPuras: 3,
  rodadasMistas: 3,
  nivelMaximo: 6,
  avgAbsoluteRecall: 1.0,
  avgAbsoluteRecallPuras: 1.0,
  avgAbsoluteRecallMistas: 1.0,
  tbrsCost: 0.0,
  avgDigitAccuracy: 1.0,
  totalCommissionErrors: 0,
  totalOmissions: 0,
  avgDigitMeanRtMs: 450,
  avgDigitIes: 450,
  rodadas: [],
};

const highMetrics: MentalVaultSessionMetrics = {
  totalRodadas: 6,
  rodadasPuras: 3,
  rodadasMistas: 3,
  nivelMaximo: 5,
  avgAbsoluteRecall: 0.84,
  avgAbsoluteRecallPuras: 0.92,
  avgAbsoluteRecallMistas: 0.76,
  tbrsCost: 0.16,
  avgDigitAccuracy: 0.88,
  totalCommissionErrors: 1,
  totalOmissions: 0,
  avgDigitMeanRtMs: 650,
  avgDigitIes: 730,
  rodadas: [],
};

const lowMetrics: MentalVaultSessionMetrics = {
  totalRodadas: 6,
  rodadasPuras: 3,
  rodadasMistas: 3,
  nivelMaximo: 3,
  avgAbsoluteRecall: 0.42,
  avgAbsoluteRecallPuras: 0.58,
  avgAbsoluteRecallMistas: 0.26,
  tbrsCost: 0.32,
  avgDigitAccuracy: 0.52,
  totalCommissionErrors: 6,
  totalOmissions: 2,
  avgDigitMeanRtMs: 1100,
  avgDigitIes: 2100,
  rodadas: [],
};

export const mentalVaultScenarios: Scenario[] = [
  {
    id: 'mentalvault-perfect',
    label: 'Perfeito (Cofre Mental, score = 100)',
    description: 'Nível máximo 6 alcançado, recall absoluto impecável, custo TBRS zero.',
    game: 'cofre-mental',
    attentionType: 'dividida',
    expectedStatus: 200,
    expectedLevelEmoji: '🏆',
    localScore: buildMentalVaultScaleResult(perfectMetrics).score,
    buildPayload: () => buildPayload(perfectMetrics, `${SESSION_ID_PREFIX}perfect-${Date.now()}`),
  },
  {
    id: 'mentalvault-high',
    label: 'Alto desempenho (score ≈ 80)',
    description: 'Nível máximo 5 alcançado com baixo custo TBRS e poucos erros de dígitos.',
    game: 'cofre-mental',
    attentionType: 'dividida',
    expectedStatus: 200,
    expectedLevelEmoji: '⭐',
    localScore: buildMentalVaultScaleResult(highMetrics).score,
    buildPayload: () => buildPayload(highMetrics, `${SESSION_ID_PREFIX}high-${Date.now()}`),
  },
  {
    id: 'mentalvault-low',
    label: 'Baixo desempenho (score < 40)',
    description: 'Nível máximo 3. Alto custo TBRS (perda drástica de recall sob carga mistas).',
    game: 'cofre-mental',
    attentionType: 'dividida',
    expectedStatus: 200,
    expectedLevelEmoji: '⚠️',
    localScore: buildMentalVaultScaleResult(lowMetrics).score,
    buildPayload: () => buildPayload(lowMetrics, `${SESSION_ID_PREFIX}low-${Date.now()}`),
  },
  {
    id: 'mentalvault-invalid',
    label: 'Payload inválido (sem sessionId)',
    description: 'Envia payload sem `sessionId` que falha na rota básica. Espera HTTP 400.',
    game: 'cofre-mental',
    attentionType: 'dividida',
    expectedStatus: 400,
    expectedLevelEmoji: '🔴',
    localScore: null,
    buildPayload: () => ({
      attentionType: 'dividida',
      game: 'cofre-mental',
      severity: 'minimo',
      nivelMaximo: 6,
      // sessionId: OMITIDO INTENCIONALMENTE
    }),
  },
];
