/* src/attentions/selective/games/VisualSearchHunt/assessment/visualSearchAssessment.types.ts */
/* Atualizado em: 26/05/2026 */

import type {
  AssessmentBias,
  AssessmentQuestionId,
  AssessmentSeverity,
  QuestionEvidenceSummary,
} from '../../../assessment/assessment.types';
import type { ScanPattern } from './visualSearchScale.types';

// ─── Config do assessment ────────────────────────────────────────────────────

export type VisualSearchAssessmentConfig = {
  version: number;
  questionTitle: string;
  thresholds: {
    commissionBiasRatio: number;
    omissionBiasRatio: number;
    mildRate: number;
    moderateRate: number;
    highRate: number;
  };
};

// ─── Log de clique individual ────────────────────────────────────────────────

export type VisualSearchClickLog = {
  isTarget: boolean;
  clickedShape: string;
  clickedColor: string;
  targetShape: string;
  targetColor: string;
  row: number;
  col: number;
  screenHalf: 'left' | 'right';
};

// ─── Log de rodada ──────────────────────────────────────────────────────────

export type VisualSearchRoundLog = {
  round: number;
  level: number;
  targetsPresented: number;
  hits: number;
  errors: number;
  missedTargets: number;
  durationMs?: number;
  reactionTimes?: number[];
  gridSize?: number;
  // cliques detalhados (qualidade do erro e posição)
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

// ─── Log de sessão ───────────────────────────────────────────────────────────

export type VisualSearchSessionLog = {
  gameKey: string;
  sessionId: string;
  startedAt: string;
  finishedAt: string;
  userId?: string;
  rounds: VisualSearchRoundLog[];
};

// ─── Resultado de pergunta ───────────────────────────────────────────────────

export type VisualSearchAssessmentQuestionResult = {
  id: AssessmentQuestionId;
  title: string;
  answered: boolean;
  answer: 'sim' | 'nao' | 'parcial';
  severity: AssessmentSeverity;
  bias: AssessmentBias;
  confidence: number;
  summary: string;
  clinicalMeaning: string;
  evidence: QuestionEvidenceSummary;
  // subescalas
  subscaleNotes?: {
    selectiveAttention?: string;
    visualScanning?: string;
    spatialAsymmetry?: string;
    speedConsistency?: string;
  };
};

// ─── Ponto do gráfico de evolução ────────────────────────────────────────────

export type VisualSearchAssessmentGraphPoint = {
  round: number;
  score: number;
  hits: number;
  errors: number;
  missedTargets: number;
  targetsPresented: number;
  omissionRate: number;
  commissionRateProxy: number;
  bias: 'omissao' | 'comissao' | 'misto' | 'adequado';
  // adicionais para gráficos futuros
  organizationIndex?: number;
  spatialAsymmetryIndex?: number;
  meanReactionTimeMs?: number;
};

// ─── Resultado da sessão ─────────────────────────────────────────────────────

export type VisualSearchAssessmentResult = {
  gameKey: string;
  sessionId: string;
  createdAt: string;
  version: number;
  questions: VisualSearchAssessmentQuestionResult[];
  graphSeries: VisualSearchAssessmentGraphPoint[];
};
