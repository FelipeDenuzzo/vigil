// assessment-v2/visualSearchV2.types.ts
// Tipos do avaliador v2 — não altera nada do assessment v1

export interface V2RoundInput {
  level: number;
  totalTargets: number;
  hits: number;
  errors: number;          // falsos alarmes
  missedTargets: number;
  reactionTimes: number[]; // ms de cada hit correto
}

export interface IESResult {
  meanReactionTime: number;  // ms
  accuracyRate: number;      // hits / (totalTargets + errors) global
  ies: number;               // meanReactionTime / accuracyRate
  displayScore: number;      // Math.round(10_000_000 / ies)
}

export interface RadarScaleResult {
  score: number;             // 0–100
  markerLabel: string;
  shortDescription: string;
  clinicalMeaning: string;
}

export interface StaminaScaleResult {
  score: number;             // 0–100
  markerLabel: string;
  shortDescription: string;
  clinicalMeaning: string;
  vigilanceDropDetected: boolean;
}

export interface ConjunctionBreakResult {
  detected: boolean;
  collapseAtLevel: number | null;
  shortDescription: string;
  clinicalMeaning: string;
}

export interface VisualSearchV2Result {
  version: 2;
  sessionId: string;
  gameId: string;
  createdAt: string;
  ies: IESResult;
  radarScale: RadarScaleResult;
  staminaScale: StaminaScaleResult;
  conjunctionBreak: ConjunctionBreakResult;
  eagleScore: number;
  eagleLabel: string;
}
