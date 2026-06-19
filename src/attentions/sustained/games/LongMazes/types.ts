export type MazeDirection = "up" | "down" | "left" | "right";

export type MazeCellGrid = number[][]; // 0 = caminho, 1 = parede

export interface MazePoint {
  x: number;
  y: number;
}

export interface MazeData {
  grid: MazeCellGrid;
  start: MazePoint;
  end: MazePoint;
  shortestPathLength: number;
  // Células que são beco (1 único vizinho) — usadas para detectar deadEndEntries
  deadEndCells: Set<string>;
}

export interface LongMazeLevelConfig {
  id: number;
  name: string;
  rows: number;
  cols: number;
  timeLimitSec: number;
  minPathLength: number;
  wallDensity: number;
}

export interface MazeSessionResult {
  levelId: number;
  success: boolean;
  elapsedMs: number;
  steps: number;
  revisits: number;          // revisitas a células já visitadas (perseveração)
  deadEndEntries: number;    // entradas inéditas em becos (impulsividade)
  longStops: number;         // paradas > 3s sem mover (lapsos de atenção)
  postErrorPause: number;    // tempo médio após bater em parede (ms)
  shortestPathLength: number;
  efficiency: number;        // steps / shortestPathLength
}

// Log consolidado das 3 fases — enviado ao avaliador
export interface MazeFullSessionLog {
  phases: MazeSessionResult[];
}
