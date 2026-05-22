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
};

export interface VisualSearchSessionLog extends BaseTrainingSessionLog {
  gameId: 'visual-search-hunt';
  attentionType: 'selective';
  // rounds acumuladas
  rounds: VisualSearchRoundLog[];
  // indicar se sessão foi abandonada (compatibilidade local)
  abandoned?: boolean;
}