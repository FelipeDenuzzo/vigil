// src/assessment/colorShape/buildColorShapeScaleResult.ts
// Aplica as faixas de colorShapeScaleDefinitions sobre as métricas calculadas
// e determina severity + score. Não conhece UI nem Gemini.

import type { ColorShapeMetrics, ColorShapeScaleResult, ColorShapeSeverity } from './types';
import {
  SWITCHING_COST_RT, MIXING_COST_RT, PERSEVERATION,
  BIVALENCY_EFFECT, MIXED_ACCURACY_FLOOR, SEVERITY_BASE_SCORE,
  SWITCHING_COST_NOTES, MIXING_COST_NOTES, PERSEVERATION_NOTES, BIVALENCY_NOTES,
} from './colorShapeScaleDefinitions';

function resolveSwitchingNote(rtMs: number): string {
  if (rtMs <= SWITCHING_COST_RT.baixo.max)    return 'baixo';
  if (rtMs <= SWITCHING_COST_RT.moderado.max) return 'moderado';
  if (rtMs <= SWITCHING_COST_RT.alto.max)     return 'alto';
  return 'muito alto';
}
function resolveMixingNote(rtMs: number): string {
  if (rtMs <= MIXING_COST_RT.baixo.max)    return 'baixo';
  if (rtMs <= MIXING_COST_RT.moderado.max) return 'moderado';
  if (rtMs <= MIXING_COST_RT.alto.max)     return 'alto';
  return 'muito alto';
}
function resolvePersonNote(count: number): string {
  if (count <= PERSEVERATION.ausente.max)   return 'ausente';
  if (count <= PERSEVERATION.rara.max)      return 'rara';
  if (count <= PERSEVERATION.frequente.max) return 'frequente';
  return 'critica';
}
function resolveBivalencyNote(ms: number): string {
  if (ms <= BIVALENCY_EFFECT.semEfeito.max) return 'sem efeito';
  if (ms <= BIVALENCY_EFFECT.leve.max)      return 'leve';
  return 'marcado';
}

function classifySeverity(
  m: ColorShapeMetrics,
  persevNote: string,
  switchNote: string,
  mixingNote: string,
  mixedAccuracy: number,
): ColorShapeSeverity {
  // 🔴 Importante: perseveração crítica OU acurácia mista ao acaso
  if (persevNote === 'critica' || mixedAccuracy <= MIXED_ACCURACY_FLOOR) return 'importante';

  // 🟠 Moderado
  if (
    persevNote === 'frequente' ||
    switchNote === 'muito alto' ||
    mixingNote === 'muito alto'
  ) return 'moderado';

  // 🟡 Leve
  if (
    persevNote === 'rara' ||
    switchNote === 'alto' ||
    mixingNote === 'alto'
  ) return 'leve';

  return 'minimo';
}

function computeScore(severity: ColorShapeSeverity, m: ColorShapeMetrics): number {
  let score = SEVERITY_BASE_SCORE[severity];
  // Bonus: acurácia global acima de 90% adiciona até +5
  if (m.accuracy >= 90) score = Math.min(100, score + 5);
  // Penàlidade: muitos timeouts
  if (m.timeoutPct >= 15) score = Math.max(0, score - 8);
  return score;
}

export function buildColorShapeScaleResult(
  metrics: ColorShapeMetrics
): ColorShapeScaleResult {
  const mixed = [
    ...Array(metrics.switchTrials).fill(null).map((_, i) => i), // proxy para calcular acurácia mista
  ];
  // Acurácia mista = média ponderada switch + repeat
  const mixedTotal   = metrics.switchTrials + metrics.repeatTrials;
  const mixedCorrect =
    Math.round(metrics.switchAccuracy  / 100 * metrics.switchTrials) +
    Math.round(metrics.repeatAccuracy  / 100 * metrics.repeatTrials);
  const mixedAccuracy = mixedTotal > 0
    ? Math.round((mixedCorrect / mixedTotal) * 100)
    : 0;

  const switchingNote  = resolveSwitchingNote(metrics.switchCostRtMs);
  const mixingNote     = resolveMixingNote(metrics.mixingCostRtMs);
  const persevNote     = resolvePersonNote(metrics.perseverationErrors);
  const bivalencyNote  = resolveBivalencyNote(metrics.bivalencyEffectMs);

  const severity = classifySeverity(
    metrics, persevNote, switchingNote, mixingNote, mixedAccuracy
  );
  const score = computeScore(severity, metrics);

  return {
    severity,
    score,
    switchingCostNote: SWITCHING_COST_NOTES[switchingNote as keyof typeof SWITCHING_COST_NOTES],
    mixingCostNote:    MIXING_COST_NOTES[mixingNote as keyof typeof MIXING_COST_NOTES],
    perseverationNote: PERSEVERATION_NOTES[persevNote as keyof typeof PERSEVERATION_NOTES],
    bivalencyNote:     BIVALENCY_NOTES[bivalencyNote as keyof typeof BIVALENCY_NOTES],
  };
}
