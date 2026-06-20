// src/assessment/colorShape/buildColorShapeScaleResult.ts
//
// Árvore de decisão (definida pelo responsável do produto):
//   1. Perseveração crítica (≥8) ou acurácia mista < 60%  → IMPORTANTE
//   2. Perseveração frequente (4–7) OU Switch/Mixing muito altos → MODERADO
//   3. Perseveração rara (2–3) OU Switch/Mixing altos          → LEVE
//   4. Perseveração ausente (0–1) e custos baixos               → MÍNIMO

import type { ColorShapeMetrics, ColorShapeScaleResult, ColorShapeSeverity } from './types';
import {
  SWITCHING_COST_RT, MIXING_COST_RT, PERSEVERATION,
  BIVALENCY_EFFECT, IES_THRESHOLDS, VIGILANCE_THRESHOLDS,
  MIXED_ACCURACY_FLOOR, SEVERITY_BASE_SCORE,
  SWITCHING_COST_NOTES, MIXING_COST_NOTES,
  PERSEVERATION_NOTES, BIVALENCY_NOTES,
  IES_NOTES, VIGILANCE_NOTES,
  SEVERITY_UX_REPORT,
} from './colorShapeScaleDefinitions';

type SwitchKey   = keyof typeof SWITCHING_COST_NOTES;
type MixingKey   = keyof typeof MIXING_COST_NOTES;
type PersevKey   = keyof typeof PERSEVERATION_NOTES;
type BivalKey    = keyof typeof BIVALENCY_NOTES;
type IesKey      = keyof typeof IES_NOTES;
type VigKey      = keyof typeof VIGILANCE_NOTES;

function resolveSwitchKey(rtMs: number): SwitchKey {
  if (rtMs <= SWITCHING_COST_RT.baixo.max)    return 'baixo';
  if (rtMs <= SWITCHING_COST_RT.moderado.max) return 'moderado';
  if (rtMs <= SWITCHING_COST_RT.alto.max)     return 'alto';
  return 'muitoAlto';
}
function resolveMixingKey(rtMs: number): MixingKey {
  if (rtMs <= MIXING_COST_RT.baixo.max)    return 'baixo';
  if (rtMs <= MIXING_COST_RT.moderado.max) return 'moderado';
  if (rtMs <= MIXING_COST_RT.alto.max)     return 'alto';
  return 'muitoAlto';
}
function resolvePersevKey(count: number): PersevKey {
  if (count <= PERSEVERATION.ausente.max)   return 'ausente';
  if (count <= PERSEVERATION.rara.max)      return 'rara';
  if (count <= PERSEVERATION.frequente.max) return 'frequente';
  return 'critica';
}
function resolveBivalKey(ms: number): BivalKey {
  if (ms <= BIVALENCY_EFFECT.semEfeito.max) return 'semEfeito';
  if (ms <= BIVALENCY_EFFECT.leve.max)      return 'leve';
  return 'marcado';
}
function resolveIesKey(ies: number): IesKey {
  if (ies === 0)                             return 'eficiente';
  if (ies <= IES_THRESHOLDS.eficiente.max)  return 'eficiente';
  if (ies <= IES_THRESHOLDS.moderado.max)   return 'moderado';
  if (ies <= IES_THRESHOLDS.lento.max)      return 'lento';
  return 'muitoLento';
}
function resolveVigKey(declineMs: number): VigKey {
  if (declineMs <= VIGILANCE_THRESHOLDS.semFadiga.max) return 'semFadiga';
  if (declineMs <= VIGILANCE_THRESHOLDS.leve.max)      return 'leve';
  if (declineMs <= VIGILANCE_THRESHOLDS.moderada.max)  return 'moderada';
  return 'acentuada';
}

/**
 * Árvore de decisão das diretrizes:
 * 1. Perseveração crítica (≥8) ou acurácia < 60% → IMPORTANTE
 * 2. Perseveração frequente (4–7) ou Switch/Mixing muito altos → MODERADO
 * 3. Perseveração rara (2–3), ou Switch/Mixing altos, fadiga acentuada → LEVE
 * 4. Default → MÍNIMO
 */
function classifySeverity(
  persevKey:     PersevKey,
  switchKey:     SwitchKey,
  mixingKey:     MixingKey,
  mixedAccuracy: number,
  iesKey:        IesKey,
  vigKey:        VigKey,
): ColorShapeSeverity {
  // Passo 1 — Perseveração é sempre checada primeiro (sintoma clínico mais grave)
  if (persevKey === 'critica' || mixedAccuracy < MIXED_ACCURACY_FLOOR) return 'importante';

  // Passo 2
  if (
    persevKey === 'frequente' ||
    switchKey === 'muitoAlto' ||
    mixingKey === 'muitoAlto' ||
    iesKey    === 'muitoLento'
  ) return 'moderado';

  // Passo 3
  if (
    persevKey === 'rara'       ||
    switchKey === 'alto'       ||
    mixingKey === 'alto'       ||
    iesKey    === 'lento'      ||
    vigKey    === 'acentuada'
  ) return 'leve';

  return 'minimo';
}

function computeScore(severity: ColorShapeSeverity, metrics: ColorShapeMetrics): number {
  let score = SEVERITY_BASE_SCORE[severity];
  if (metrics.accuracy >= 90)   score = Math.min(100, score + 5);
  if (metrics.timeoutPct >= 15) score = Math.max(0,   score - 8);
  return score;
}

export function buildColorShapeScaleResult(
  metrics: ColorShapeMetrics
): ColorShapeScaleResult {
  const mixedTotal   = metrics.switchTrials + metrics.repeatTrials;
  const mixedCorrect =
    Math.round(metrics.switchAccuracy / 100 * metrics.switchTrials) +
    Math.round(metrics.repeatAccuracy / 100 * metrics.repeatTrials);
  const mixedAccuracy = mixedTotal > 0
    ? Math.round((mixedCorrect / mixedTotal) * 100)
    : 0;

  const switchKey = resolveSwitchKey(metrics.switchCostRtMs);
  const mixingKey = resolveMixingKey(metrics.mixingCostRtMs);
  const persevKey = resolvePersevKey(metrics.perseverationErrors);
  const bivalKey  = resolveBivalKey(metrics.bivalencyEffectMs);
  const iesKey    = resolveIesKey(metrics.ies);
  const vigKey    = resolveVigKey(metrics.vigilanceDeclineMs);

  const severity = classifySeverity(
    persevKey, switchKey, mixingKey, mixedAccuracy, iesKey, vigKey,
  );
  const score = computeScore(severity, metrics);

  return {
    severity,
    score,
    uxReport:          SEVERITY_UX_REPORT[severity],
    switchingCostNote: SWITCHING_COST_NOTES[switchKey],
    mixingCostNote:    MIXING_COST_NOTES[mixingKey],
    perseverationNote: PERSEVERATION_NOTES[persevKey],
    bivalencyNote:     BIVALENCY_NOTES[bivalKey],
    iesNote:           IES_NOTES[iesKey],
    vigilanceNote:     VIGILANCE_NOTES[vigKey],
  };
}
