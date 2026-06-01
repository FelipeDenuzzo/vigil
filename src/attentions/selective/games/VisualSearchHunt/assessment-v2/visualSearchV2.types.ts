/* src/attentions/selective/games/VisualSearchHunt/assessment-v2/visualSearchV2.types.ts */
/* Avaliador V2 — Tipos estendidos com IES, Radar e Fôlego Mental */
/* Atualizado em: 01/06/2026 */

import type {
  VisualSearchRoundLog,
  VisualSearchSessionLog,
} from '../assessment/visualSearchAssessment.types';
import type { VisualSearchScaleResult } from '../assessment/visualSearchScale.types';
import type { VisualSearchAssessmentGraphPoint } from '../assessment/visualSearchAssessment.types';

// ─── Extensão de tipos do assessment v1 ──────────────────────────────────────

/**
 * Rodada do V2 — estende VisualSearchRoundLog com campos obrigatórios:
 * - level: nível do jogo (1-10)
 * - reactionTimes: array de ms de cada clique correto
 * - distractorOpportunities: total de distratores clicáveis na rodada
 */
export type VisualSearchV2RoundLog = VisualSearchRoundLog & {
  level: number;
  reactionTimes: number[];
  distractorOpportunities: number;
};

/**
 * Sessão do V2 — log com rodadas do tipo V2
 */
export type VisualSearchV2SessionLog = VisualSearchSessionLog & {
  rounds: VisualSearchV2RoundLog[];
};

// ─── Índice de Eficiência Inversa (IES) ────────────────────────────────────

export interface IESResult {
  /** Tempo médio de reação (ms) para todos os acertos */
  meanReactionTime: number;
  /** Taxa de acurácia = hits / (totalTargets + falseAlarms) */
  accuracyRate: number;
  /** IES = meanReactionTime / accuracyRate */
  ies: number;
  /** Score gamificado: 10_000_000 / ies (arredondado) */
  displayScore: number;
}

// ─── Régua de Visão de Radar (organização espacial) ────────────────────────

export interface RadarScaleResult {
  /** Score 0–100 baseado em consistência de organização */
  score: number;
  /** Label: "Radar Calibrado", "Oscilante", "em Pânico", "Perdido" */
  markerLabel: string;
  /** Descrição breve didática */
  shortDescription: string;
  /** Significado clínico em linguagem acessível */
  clinicalMeaning: string;
}

// ─── Régua de Fôlego Mental (sustentação) ───────────────────────────────────

export interface StaminaScaleResult {
  /** Score 0–100 baseado na queda de desempenho */
  score: number;
  /** Label: "Bateria Cheia", "Estável", "Fraca", "Esgotada" */
  markerLabel: string;
  /** Descrição breve didática */
  shortDescription: string;
  /** Significado clínico */
  clinicalMeaning: string;
  /** true se colapso detectado nos últimos 3 níveis */
  vigilanceDropDetected: boolean;
}

// ─── Eixo clínico A — Colapso em Conjunção ──────────────────────────────────

export interface ConjunctionBreakResult {
  /** true se queda abrupta detectada entre nível 4 e 5+ */
  detected: boolean;
  /** Nível em que ocorreu o colapso (ou null se não detectado) */
  collapseAtLevel: number | null;
  /** Descrição breve para apresentação */
  shortDescription: string;
  /** Significado clínico */
  clinicalMeaning: string;
}

// ─── Resultado completo do avaliador V2 ─────────────────────────────────────

export interface VisualSearchV2AssessmentResult {
  /** Identificador do jogo */
  gameKey: string;
  /** ID da sessão */
  sessionId: string;
  /** Timestamp de criação do resultado */
  createdAt: string;
  /** Versão do avaliador (sempre 2) */
  version: 2;
  /** Resultado do Índice de Eficiência Inversa */
  ies: IESResult;
  /** Régua Olho de Águia (do avaliador v1, reutilizada) */
  eagleScale: VisualSearchScaleResult;
  /** Régua Visão de Radar (organização) */
  radarScale: RadarScaleResult;
  /** Régua Fôlego Mental (sustentação) */
  staminaScale: StaminaScaleResult;
  /** Eixo clínico A: detecção de colapso em conjunção */
  conjunctionBreak: ConjunctionBreakResult;
  /** Série de pontos para gráficos de evolução */
  graphSeries: VisualSearchAssessmentGraphPoint[];
}
