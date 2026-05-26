// src/attentions/selective/games/VisualSearchHunt/assessment/visualSearchScale.types.ts
// Atualizado em: 26/05/2026

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
  // tempo
  meanReactionTimeMs?: number;
  durationMs?: number;
  // varredura
  organizationIndex?: number;
  scanPattern?: ScanPattern;
  erraticMoves?: number;
  systematicMoves?: number;
  // assimetria
  spatialAsymmetryIndex?: number;
  leftSideTargetMisses?: number;
  rightSideTargetMisses?: number;
};

// ─── Métricas globais da sessão ─────────────────────────────────────────────

export type VisualSearchMetrics = {
  // desempenho básico
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

  // tempo / velocidade
  meanReactionTimeMs: number | null;
  reactionTimeStdDev: number | null;
  totalDurationMs: number;

  // varredura visual (médias da sessão)
  meanOrganizationIndex: number | null;
  meanSystematicMoves: number | null;
  meanErraticMoves: number | null;
  dominantScanPattern: ScanPattern | null;

  // assimetria espacial (médias da sessão)
  meanSpatialAsymmetryIndex: number | null;
  hasSpatialAsymmetry: boolean;

  // por rodada
  rounds: VisualSearchRoundMetrics[];
};
