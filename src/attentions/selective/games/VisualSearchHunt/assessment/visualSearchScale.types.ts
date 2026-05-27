// src/attentions/selective/games/VisualSearchHunt/assessment/visualSearchScale.types.ts
// Atualizado em: 26/05/2026

import type { VisualSearchClickLog } from './visualSearchAssessment.types';

// ─── Primitivos de avaliação ────────────────────────────────────────────────

export type VisualSearchScaleLevel = 1 | 2 | 3 | 4;

export type SubscaleStatus = 'nao' | 'parcial' | 'sim';
export type SubscaleSeverity = 'minimo' | 'leve' | 'moderado' | 'importante';
export type EngagementStatus = 'adequado' | 'insuficiente';

export type VisualSearchDominantPattern =
  | 'adequado'
  | 'omissao'
  | 'comissao'
  | 'misto'
  | 'tendencia_omissao'
  | 'tendencia_comissao';

export type VisualSearchDPrimeBand =
  | 'alta'
  | 'funcional'
  | 'reduzida'
  | 'fraca'
  | 'indisponivel';

export type ScanPattern = 'row-wise' | 'column-wise' | 'mixed';

// ─── Definição da escala visual ─────────────────────────────────────────────

export interface VisualSearchScaleDefinition {
  level: VisualSearchScaleLevel;
  id: string;
  label: string;
  emoji: string;
  colorToken: string;
  shortDescription: string;
  clinicalMeaning: string;
}

// ─── Resultado de cada subescala ────────────────────────────────────────────

export type SubscaleResult = {
  status: SubscaleStatus;
  severity: SubscaleSeverity;
  notes?: string;
};

// ─── Resultado composto da escala ───────────────────────────────────────────

export type VisualSearchScaleResult = {
  scaleName: 'Olho de Águia';
  clinicalName: 'Controle Inibitório e Atenção Seletiva';
  score: number;
  positionPercent: number;
  leftLabel: 'Águia Cega';
  rightLabel: 'Super Águia';
  markerLabel: string;
  emoji: string;
  colorToken: string;
  engagementStatus: EngagementStatus;
  answer: 'sim' | 'parcial' | 'nao' | 'insuficiente';
  dominantPattern: VisualSearchDominantPattern;
  dPrimeBand: VisualSearchDPrimeBand;
  subscales: {
    selectiveAttention: SubscaleResult;
    visualScanning: SubscaleResult;
    spatialAsymmetry: SubscaleResult;
    speedConsistency: SubscaleResult;
  };
  shortDescription: string;
  clinicalMeaning: string;
  summary: string;
};

// ─── Inputs de métricas ─────────────────────────────────────────────────────

export type VisualSearchRoundMetricsInput = {
  round: number;
  totalTargets: number;
  hits: number;
  errors: number;
  missedTargets: number;
  durationMs?: number;
  distractorOpportunities?: number;
  reactionTimes?: number[];
  gridSize?: number;
  // cliques detalhados — necessários para análise de qualidade do erro e posição espacial
  clicks?: VisualSearchClickLog[];
  // varredura visual
  systematicMoves?: number;
  erraticMoves?: number;
  organizationIndex?: number;
  scanPattern?: ScanPattern;
  // assimetria espacial
  leftSideClicks?: number;
  rightSideClicks?: number;
  leftSideTargetMisses?: number;
  rightSideTargetMisses?: number;
  spatialAsymmetryIndex?: number;
};

export type VisualSearchSessionMetricsInput = {
  sessionId?: string;
  gameId?: string;
  startedAt?: string;
  completedAt?: string;
  rounds: VisualSearchRoundMetricsInput[];
};

// ─── Métricas por rodada (calculadas) ───────────────────────────────────────

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
  meanReactionTimeMs?: number;
  durationMs?: number;
  organizationIndex?: number;
  scanPattern?: ScanPattern;
  erraticMoves?: number;
  systematicMoves?: number;
  spatialAsymmetryIndex?: number;
  leftSideTargetMisses?: number;
  rightSideTargetMisses?: number;
};

// ─── Métricas globais da sessão ─────────────────────────────────────────────

export type VisualSearchMetrics = {
  totalTargets: number;
  totalHits: number;
  totalErrors: number;
  totalMissedTargets: number;
  totalDistractorOpportunities: number | null;
  totalRounds: number;
  omissionRate: number;
  commissionRate: number;
  accuracyRate: number;
  hitRate: number;
  falseAlarmRate: number | null;
  dPrime: number | null;
  dPrimeBand: VisualSearchDPrimeBand;
  dominantPattern: VisualSearchDominantPattern;
  hasRelevantDifficulty: boolean;
  engagementStatus: EngagementStatus;
  meanReactionTimeMs: number | null;
  reactionTimeStdDev: number | null;
  totalDurationMs: number;
  meanOrganizationIndex: number | null;
  meanSystematicMoves: number | null;
  meanErraticMoves: number | null;
  predominantScanPattern: ScanPattern | null;
  meanSpatialAsymmetryIndex: number | null;
  hasSpatialAsymmetry: boolean;
  totalLeftClicks: number | null;
  totalRightClicks: number | null;
  totalLeftMisses: number | null;
  totalRightMisses: number | null;
  rounds: VisualSearchRoundMetrics[];
  // perfis de qualidade de erro e espacial (camada central)
  shapeErrorRate?: number;
  colorErrorRate?: number;
  doubleErrorRate?: number;
  quadrantErrorMap?: Record<string, number>;
  spatialNeglectIndex?: number;
};

// ─── Relatório técnico ───────────────────────────────────────────────────────────

export type VisualSearchTechnicalReport = {
  title: string;
  question: string;
  answer: 'sim' | 'parcial' | 'nao' | 'insuficiente';
  dominantPattern: VisualSearchDominantPattern;
  severity: SubscaleSeverity;
  summary: string;
  interpretation: string;
  subscalesSummary: {
    selectiveAttention: string;
    visualScanning: string;
    spatialAsymmetry: string;
    speedConsistency: string;
  };
  evidence: {
    totalTargets: number;
    totalHits: number;
    totalErrors: number;
    totalMissedTargets: number;
    totalRounds: number;
    omissionRate: number;
    commissionRate: number;
    accuracyRate: number;
    hitRate: number;
    falseAlarmRate: number | null;
    dPrime: number | null;
    dPrimeBand: VisualSearchDPrimeBand;
    meanReactionTimeMs: number | null;
    reactionTimeStdDev: number | null;
    meanOrganizationIndex: number | null;
    predominantScanPattern: ScanPattern | null;
    meanSpatialAsymmetryIndex: number | null;
    totalLeftMisses: number | null;
    totalRightMisses: number | null;
    score: number;
  };
};
