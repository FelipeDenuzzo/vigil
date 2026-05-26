// src/assessment/visualSearch/buildVisualSearchScaleResult.ts
// Etapa 5 — Nível lúdico: Olho de Águia (score + nível 1–4 + emoji + colorToken)
// Sem texto clínico — apenas resultado do "jogo"

import { calculateVisualSearchMetrics } from './calculateVisualSearchMetrics';
import type { VisualSearchScaleInput } from './types';

// ─── Tipos de saída ────────────────────────────────────────────────────────────

export type EagleLevel = 1 | 2 | 3 | 4;
export type EagleColorToken = 'success' | 'warning' | 'danger';

export interface VisualSearchScaleResult {
  scaleName: string;
  emoji: string;
  score: number;           // 0–100
  positionPercent: number; // 0–100, posição na régua
  level: EagleLevel;
  levelLabel: string;      // ex: 'Águia Atenta'
  leftLabel: string;
  rightLabel: string;
  markerLabel: string;
  colorToken: EagleColorToken;
  shortDescription: string; // 1–2 frases, sem jargão clínico
  engagementStatus: 'suficiente' | 'insuficiente';
}

// ─── Utilitários ───────────────────────────────────────────────────────────────

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

function calculateEagleScore(
  omissionRate: number,
  commissionRate: number,
  dPrime: number | null,
  orgIndex: number | null,
  asymIndex: number | null
): number {
  if (omissionRate >= 1.0) return 0;

  let score = 100;
  score -= omissionRate * 40;
  score -= commissionRate * 30;

  if (dPrime !== null) {
    if (dPrime < 0.5) score -= 20;
    else if (dPrime < 1) score -= 10;
    else if (dPrime < 1.5) score -= 5;
  } else if (omissionRate >= 1.0) {
    score -= 20;
  }

  if (orgIndex !== null && orgIndex < 40) score -= 5;
  if (asymIndex !== null && asymIndex > 50) score -= 5;

  return clamp(Math.round(score));
}

function resolveLevel(score: number): EagleLevel {
  if (score >= 75) return 4;
  if (score >= 50) return 3;
  if (score >= 25) return 2;
  return 1;
}

const LEVEL_LABELS: Record<EagleLevel, string> = {
  4: 'Super Águia',
  3: 'Águia Atenta',
  2: 'Águia em Ajuste',
  1: 'Águia Cega',
};

function resolveColorToken(score: number): EagleColorToken {
  if (score >= 60) return 'success';
  if (score >= 35) return 'warning';
  return 'danger';
}

function getShortDescription(score: number, omissionRate: number, commissionRate: number): string {
  if (omissionRate >= 0.4 && commissionRate >= 0.25)
    return 'Dificuldade para localizar alvos e para ignorar distratores ao mesmo tempo.';
  if (omissionRate >= 0.4)
    return 'Muitos alvos passaram despercebidos durante a sessão.';
  if (commissionRate >= 0.25)
    return 'Tendência a clicar em distratores com frequência.';
  if (score >= 75) return 'Ótima identificação do alvo com poucos erros.';
  if (score >= 50) return 'Boa performance, com pequenas oscilações no filtro visual.';
  if (score >= 25) return 'Instabilidade moderada na separação entre alvo e distratores.';
  return 'Dificuldade acentuada para manter o foco no alvo visual.';
}

// ─── Função principal ──────────────────────────────────────────────────────────

export function buildVisualSearchScaleResult(
  input: VisualSearchScaleInput
): VisualSearchScaleResult {
  const m = calculateVisualSearchMetrics(input);

  const score = calculateEagleScore(
    m.omissionRate,
    m.commissionRate,
    m.dPrime,
    m.meanOrganizationIndex,
    m.meanSpatialAsymmetryIndex
  );

  const level = resolveLevel(score);
  const levelLabel = LEVEL_LABELS[level];

  return {
    scaleName: 'Olho de Águia',
    emoji: '🦅',
    score,
    positionPercent: score,
    level,
    levelLabel,
    leftLabel: 'Águia Cega',
    rightLabel: 'Super Águia',
    markerLabel: levelLabel,
    colorToken: resolveColorToken(score),
    shortDescription: getShortDescription(score, m.omissionRate, m.commissionRate),
    engagementStatus: m.engagementStatus,
  };
}
