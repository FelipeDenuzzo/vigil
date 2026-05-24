// src/attentions/selective/games/VisualSearchHunt/assessment/visualSearchScale.types.ts

import type { AssessmentBias, AssessmentSeverity } from '../../../assessment/assessment.types';

/** Nível da escala visual (1-4) */
export type VisualSearchScaleLevel = 1 | 2 | 3 | 4;

/** Definição de um nível da escala visual */
export interface VisualSearchScaleDefinition {
  level: VisualSearchScaleLevel;
  id: string;
  label: string;
  emoji: string;
  colorToken: string;
  shortDescription: string;
  clinicalMeaning: string;
}

/** Resultado da escala visual com interpretação clínica */
export type VisualSearchScaleResult = {
  scaleName: "Olho de Águia";
  clinicalName: "Controle Inibitório e Atenção Seletiva";

  score: number;
  positionPercent: number;

  leftLabel: "Águia Cega";
  rightLabel: "Super Águia";

  markerLabel: string;
  emoji: string;
  colorToken: string;

  answer: "sim" | "nao";
  dominantPattern: VisualSearchDominantPattern;
  dPrimeBand: VisualSearchDPrimeBand;

  shortDescription: string;
  clinicalMeaning: string;
  summary: string;
};

export type VisualSearchDominantPattern =
  | "adequado"
  | "omissao"
  | "comissao"
  | "misto";

export type VisualSearchDPrimeBand =
  | "alta"
  | "funcional"
  | "reduzida"
  | "fraca"
  | "indisponivel";

export type VisualSearchRoundMetricsInput = {
  round: number;
  totalTargets: number;
  hits: number;
  errors: number;
  missedTargets: number;
  durationMs?: number;
  distractorOpportunities?: number;
};

export type VisualSearchSessionMetricsInput = {
  sessionId?: string;
  gameId?: string;
  startedAt?: string;
  completedAt?: string;
  rounds: VisualSearchRoundMetricsInput[];
};

export type VisualSearchRoundMetrics = {
  round: number;
  totalTargets: number;
  hits: number;
  errors: number;
  missedTargets: number;
  omissionRate: number;
  commissionRate: number;
  accuracyRate: number;
  dominantPattern: VisualSearchDominantPattern;
};

export type VisualSearchMetrics = {
  totalTargets: number;
  totalHits: number;
  totalErrors: number;
  totalMissedTargets: number;
  totalDistractorOpportunities: number | null;

  omissionRate: number;
  commissionRate: number;
  accuracyRate: number;

  hitRate: number;
  falseAlarmRate: number | null;
  dPrime: number | null;
  dPrimeBand: VisualSearchDPrimeBand;

  dominantPattern: VisualSearchDominantPattern;
  hasRelevantDifficulty: boolean;

  rounds: VisualSearchRoundMetrics[];
};

/** Relatório técnico detalhado */
export type VisualSearchTechnicalReport = {
  title: string;
  question: string;
  answer: "sim" | "nao";
  dominantPattern: VisualSearchDominantPattern;
  severity: "minimo" | "leve" | "moderado" | "importante";
  summary: string;
  interpretation: string;
  evidence: {
    totalTargets: number;
    totalHits: number;
    totalErrors: number;
    totalMissedTargets: number;
    omissionRate: number;
    commissionRate: number;
    accuracyRate: number;
    hitRate: number;
    falseAlarmRate: number | null;
    dPrime: number | null;
    dPrimeBand: VisualSearchDPrimeBand;
    score: number;
  };
};