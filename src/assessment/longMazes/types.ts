// Tipos de saída dos artefatos 1 e 2 do pipeline LongMazes

export type LongMazesSeverity = 'minimo' | 'leve' | 'moderado' | 'importante';

export interface MazePhaseMetrics {
  levelId: number;
  success: boolean;
  efficiencyPct: number;      // shortestPathLength / steps * 100, limitado 0-100
  revisits: number;
  deadEndEntries: number;
  longStops: number;
  postErrorPauseMs: number;
  elapsedMs: number;
  elapsedSec: number;
}

export interface MazeAggregatedMetrics {
  phases: MazePhaseMetrics[];
  completedPhases: number;
  totalPhases: number;
  avgEfficiencyPct: number;
  totalRevisits: number;
  totalDeadEndEntries: number;
  totalLongStops: number;
  avgPostErrorPauseMs: number;
  severity: LongMazesSeverity;
}
