import type { MazeFullSessionLog } from '../../attentions/sustained/games/LongMazes/types';

export type { MazeFullSessionLog };

export type MazeSeverity = 'minimo' | 'leve' | 'moderado' | 'importante';

export interface MazePhaseMetrics {
  levelId: number;
  success: boolean;
  efficiencyPct: number;    // 0–100
  revisits: number;
  deadEndEntries: number;
  longStops: number;
  postErrorPauseMs: number;
  elapsedMs: number;
}

export interface MazeAggregatedMetrics {
  phases: MazePhaseMetrics[];
  completedPhases: number;       // quantas fases foram concluídas com success=true
  avgEfficiencyPct: number;
  totalRevisits: number;
  totalDeadEndEntries: number;
  totalLongStops: number;
  avgPostErrorPauseMs: number;
  severity: MazeSeverity;
  score: number;                 // 0–100
}
