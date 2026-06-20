// src/assessment/colorShape/buildColorShapeScaleResult.ts
import type { ColorShapeMetrics, ColorShapeScaleResult, ColorShapeSeverity } from './types';
import {
  SWITCHING_COST_RT, MIXING_COST_RT, PERSEVERATION,
  BIVALENCY_EFFECT, IES_THRESHOLDS, VIGILANCE_THRESHOLDS,
  MIXED_ACCURACY_FLOOR, SEVERITY_BASE_SCORE,
  SWITCHING_COST_NOTES, MIXING_COST_NOTES,
  PERSEVERATION_NOTES, BIVALENCY_NOTES,
  IES_NOTES, VIGILANCE_NOTES,
} from './colorShapeScaleDefinitions';

function resolveSwitchingNote(rtMs: number): keyof typeof SWITCHING_COST_NOTES {
  if (rtMs <= SWITCHING_COST_RT.baixo.max)    return 'baixo';
  if (rtMs <= SWITCHING_COST_RT.moderado.max) return 'moderado';
  if (rtMs <= SWITCHING_COST_RT.alto.max)     return 'alto';
  return 'muitoAlto';
}
function resolveMixingNote(rtMs: number): keyof typeof MIXING_COST_NOTES {
  if (rtMs <= MIXING_COST_RT.baixo.max)    return 'baixo';
  if (rtMs <= MIXING_COST_RT.moderado.max) return 'moderado';
  if (rtMs <= MIXING_COST_RT.alto.max)     return 'alto';
  return 'muitoAlto';
}
function resolvePersonNote(count: number): keyof typeof PERSEVERATION_NOTES {
  if (count <= PERSEVERATION.ausente.max)   return 'ausente';
  if (count <= PERSEVERATION.rara.max)      return 'rara';
  if (count <= PERSEVERATION.frequente.max) return 'frequente';
  return 'critica';
}
function resolveBivalencyNote(ms: number): keyof typeof BIVALENCY_NOTES {
  if (ms <= BIVALENCY_EFFECT.semEfeito.max) return 'semEfeito';
  if (ms <= BIVALENCY_EFFECT.leve.max)      return 'leve';
  return 'marcado';
}
function resolveIesNote(ies: number): keyof typeof IES_NOTES {
  if (ies === 0)                              return 'eficiente';
  if (ies <= IES_THRESHOLDS.eficiente.max)   return 'eficiente';
  if (ies <= IES_THRESHOLDS.moderado.max)    return 'moderado';
  if (ies <= IES_THRESHOLDS.lento.max)       return 'lento';
  return 'muitoLento';
}
function resolveVigilanceNote(declineMs: number): keyof typeof VIGILANCE_NOTES {
  if (declineMs <= VIGILANCE_THRESHOLDS.semFadiga.max) return 'semFadiga';
  if (declineMs <= VIGILANCE_THRESHOLDS.leve.max)      return 'leve';
  if (declineMs <= VIGILANCE_THRESHOLDS.moderada.max)  return 'moderada';
  return 'acentuada';
}

function classifySeverity(
  persevKey:     keyof typeof PERSEVERATION_NOTES,
  switchKey:     keyof typeof SWITCHING_COST_NOTES,
  mixingKey:     keyof typeof MIXING_COST_NOTES,
  mixedAccuracy: number,
  iesKey:        keyof typeof IES_NOTES,
  vigilanceKey:  keyof typeof VIGILANCE_NOTES,
): ColorShapeSeverity {
  if (persevKey === 'critica' || mixedAccuracy <= MIXED_ACCURACY_FLOOR) return 'importante';
  if (
    persevKey   === 'frequente' ||
    switchKey   === 'muitoAlto' ||
    mixingKey   === 'muitoAlto' ||
    iesKey      === 'muitoLento'
  ) return 'moderado';
  if (
    persevKey    === 'rara'      ||
    switchKey    === 'alto'      ||
    mixingKey    === 'alto'      ||
    iesKey       === 'lento'     ||
    vigilanceKey === 'acentuada'
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

  const switchKey  = resolveSwitchingNote(metrics.switchCostRtMs);
  const mixingKey  = resolveMixingNote(metrics.mixingCostRtMs);
  const persevKey  = resolvePersonNote(metrics.perseverationErrors);
  const bivalKey   = resolveBivalencyNote(metrics.bivalencyEffectMs);
  const iesKey     = resolveIesNote(metrics.ies);
  const vigilKey   = resolveVigilanceNote(metrics.vigilanceDeclineMs);

  const severity = classifySeverity(
    persevKey, switchKey, mixingKey, mixedAccuracy, iesKey, vigilKey,
  );
  const score = computeScore(severity, metrics);

  return {
    severity,
    score,
    switchingCostNote: SWITCHING_COST_NOTES[switchKey],
    mixingCostNote:    MIXING_COST_NOTES[mixingKey],
    perseverationNote: PERSEVERATION_NOTES[persevKey],
    bivalencyNote:     BIVALENCY_NOTES[bivalKey],
    iesNote:           IES_NOTES[iesKey],
    vigilanceNote:     VIGILANCE_NOTES[vigilKey],
  };
}
