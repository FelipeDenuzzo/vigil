/* src/attentions/selective/games/VisualSearchHunt/assessment-v2/index.ts */
/* Exporta o novo avaliador V2 */
/* Atualizado em: 01/06/2026 */

// ── Tipos ──
export type {
  VisualSearchV2RoundLog,
  VisualSearchV2SessionLog,
  VisualSearchV2AssessmentResult,
  IESResult,
  RadarScaleResult,
  StaminaScaleResult,
  ConjunctionBreakResult,
} from './visualSearchV2.types';

// ── Cálculos ──
export { calculateIES } from './calculateIES';
export { calculateRadarScale } from './calculateRadarScale';
export { calculateStaminaScale } from './calculateStaminaScale';
export { detectConjunctionBreak } from './detectConjunctionBreak';

// ── Orquestradores ──
export { buildVisualSearchV2Result } from './buildVisualSearchV2Result';

// ── Hook React ──
export { useVisualSearchV2Assessment } from './useVisualSearchV2Assessment';
export type { UseVisualSearchV2AssessmentResult } from './useVisualSearchV2Assessment';
