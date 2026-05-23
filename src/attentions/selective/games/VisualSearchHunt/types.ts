import type { BaseTrainingSessionLog } from '../../../../shared/types';

export type VisualSearchShape = 'circle' | 'square' | 'triangle';
export type VisualSearchColor = 'red' | 'blue' | 'green' | 'yellow';
export type VisualSearchClickAction = 'mark' | 'unmark';

export type VisualSearchClickLog = {
  timestampMs: number;
  action: VisualSearchClickAction;
  isTarget: boolean;
  tileId: string;
  roundIndex: number;
  phaseLevel: number;
  clickedShape: VisualSearchShape;
  clickedColor: VisualSearchColor;
  targetShape: VisualSearchShape;
  targetColor: VisualSearchColor;
  // coordenadas explícitas no grid (adicionado para análise de busca visual)
  row?: number;
  col?: number;
  screenHalf?: 'left' | 'right';
};

export type VisualSearchRoundLog = {
  roundIndex: number;
  level: number;
  startedAt: number;
  endedAt: number;
  completed: boolean;
  targetShape: VisualSearchShape;
  targetColor: VisualSearchColor;
  totalTargets: number;
  hits: number;
  errors: number;
  missedTargets: number;
  gridSize: number;
  timeLimitSeconds: number;
  remainingTimeSeconds: number;
  durationMs: number;
  reactionTimes: number[];
  clicks: VisualSearchClickLog[];
  accuracy: number;

  // novos campos, sem quebrar compatibilidade
  firstClickAtMs?: number;
  lastClickAtMs?: number;
  advancePhaseAtMs?: number;

  // métricas derivadas opcionais
  timeToFirstClickMs?: number;
  timeToLastClickMs?: number;
  timeToAdvanceMs?: number;

  // métricas de análise de busca visual (organização e assimetria espacial)
  systematicMoves?: number;
  erraticMoves?: number;
  organizationIndex?: number;
  scanPattern?: 'row-wise' | 'column-wise' | 'mixed' | 'chaotic';
  leftSideClicks?: number;
  rightSideClicks?: number;
  leftSideTargetMisses?: number;
  rightSideTargetMisses?: number;
  spatialAsymmetryIndex?: number;
};

export interface VisualSearchSessionLog extends BaseTrainingSessionLog {
  gameId: 'visual-search-hunt';
  attentionType: 'selective';
  rounds: VisualSearchRoundLog[];

  abandoned?: boolean;
  abandonedAtRound?: number;
  abandonedAtLevel?: number;
}