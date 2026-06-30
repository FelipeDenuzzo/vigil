// src/assessment/colorShape/buildColorShapeScaleResult.ts
//
// Árvore de decisão exata das diretrizes do produto:
//
//   PASSO 1 — Perseveração é verificada PRIMEIRO (sintoma clínico mais grave).
//     Se Perseveration_Errors >= 8 → IMPORTANTE (independe de velocidade).
//     Se Accuracy < 60% no bloco misto → IMPORTANTE.
//
//   PASSO 2 — Perseveração frequente ou acurácia baixa.
//     Se Perseveration_Errors 4–7 → MODERADO.
//     Se Accuracy 60–79% no bloco misto → MODERADO.
//
//   PASSO 3 — Perseveração rara ou custo de velocidade alto.
//     Se Perseveration_Errors 2–3 → LEVE.
//     Se Switch_Cost > 0 OU Mixing_Cost > 0 (mesmo com perseveração ausente) → LEVE.
//
//   PASSO 4 — Default.
//     Perseveração ausente (0–1) E Switch_Cost ≤ 0 E Mixing_Cost ≤ 0 → MÍNIMO.

import type { ColorShapeMetrics, ColorShapeScaleResult, ColorShapeSeverity } from './types';
import {
  PERSEVERATION,
  MIXED_ACCURACY,
  SWITCH_COST_RT,
  MIXING_COST_RT,
  SEVERITY_BASE_SCORE,
  SEVERITY_UX_REPORT,
  PERSEVERATION_NOTES,
  SWITCH_COST_NOTES,
  MIXING_COST_NOTES,
  ACCURACY_NOTES,
} from './colorShapeScaleDefinitions';

type PersevKey   = keyof typeof PERSEVERATION_NOTES;
type SwitchKey   = keyof typeof SWITCH_COST_NOTES;
type MixingKey   = keyof typeof MIXING_COST_NOTES;
type AccuracyKey = keyof typeof ACCURACY_NOTES;

function resolvePersevKey(count: number): PersevKey {
  if (count <= PERSEVERATION.ausente.max)   return 'ausente';
  if (count <= PERSEVERATION.rara.max)      return 'rara';
  if (count <= PERSEVERATION.frequente.max) return 'frequente';
  return 'critica';
}

function resolveSwitchKey(rtMs: number): SwitchKey {
  return rtMs <= SWITCH_COST_RT.baixo.max ? 'baixo' : 'alto';
}

function resolveMixingKey(rtMs: number): MixingKey {
  return rtMs <= MIXING_COST_RT.baixo.max ? 'baixo' : 'alto';
}

function resolveAccuracyKey(pct: number): AccuracyKey {
  if (pct <= MIXED_ACCURACY.colapso.max)                              return 'colapso';
  if (pct >= MIXED_ACCURACY.baixa.min && pct <= MIXED_ACCURACY.baixa.max) return 'baixa';
  return 'boa';
}

function classifySeverity(
  persevKey:     PersevKey,
  switchKey:     SwitchKey,
  mixingKey:     MixingKey,
  accuracyKey:   AccuracyKey,
): ColorShapeSeverity {
  // Passo 1 — Perseveração crítica ou colapso de acurácia (mais grave, checar primeiro)
  if (persevKey === 'critica' || accuracyKey === 'colapso') return 'importante';

  // Passo 2 — Perseveração frequente ou acurácia comprometida
  if (persevKey === 'frequente' || accuracyKey === 'baixa') return 'moderado';

  // Passo 3 — Perseveração rara OU há custo de velocidade (switch ou mixing)
  if (persevKey === 'rara' || switchKey === 'alto' || mixingKey === 'alto') return 'leve';

  // Passo 4 — Tudo dentro do esperado
  return 'minimo';
}

function computeScore(severity: ColorShapeSeverity, mixedAccuracyPct: number): number {
  let score = SEVERITY_BASE_SCORE[severity];
  if (mixedAccuracyPct >= 90) score = Math.min(100, score + 5);
  return score;
}

export function buildColorShapeScaleResult(
  metrics: ColorShapeMetrics,
): ColorShapeScaleResult {
  // Calcula acurácia combinada do bloco misto (repeat + switch)
  const mixedTotal   = metrics.switchTrials + metrics.repeatTrials;
  const mixedCorrect =
    Math.round(metrics.switchAccuracy / 100 * metrics.switchTrials) +
    Math.round(metrics.repeatAccuracy / 100 * metrics.repeatTrials);
  const mixedAccuracyPct = mixedTotal > 0
    ? Math.round((mixedCorrect / mixedTotal) * 100)
    : 0;

  const persevKey   = resolvePersevKey(metrics.perseverationErrors);
  const switchKey   = resolveSwitchKey(metrics.switchCostRtMs);
  const mixingKey   = resolveMixingKey(metrics.mixingCostRtMs);
  const accuracyKey = resolveAccuracyKey(mixedAccuracyPct);

  const severity = classifySeverity(persevKey, switchKey, mixingKey, accuracyKey);
  const score    = metrics.ludicScore;

  return {
    severity,
    score,
    uxReport:          SEVERITY_UX_REPORT[severity],
    perseverationNote: PERSEVERATION_NOTES[persevKey],
    switchingCostNote: SWITCH_COST_NOTES[switchKey],
    mixingCostNote:    MIXING_COST_NOTES[mixingKey],
    accuracyNote:      ACCURACY_NOTES[accuracyKey],
  };
}
