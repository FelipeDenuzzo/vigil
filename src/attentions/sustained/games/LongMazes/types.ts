export type MazeDirection = "up" | "down" | "left" | "right";

export type MazeCellGrid = number[][]; // 0 = caminho, 1 = parede (ajuste se necessário)

export interface MazePoint {
  x: number;
  y: number;
}

export interface MazeData {
  grid: MazeCellGrid;
  start: MazePoint;
  end: MazePoint;
  shortestPathLength: number; // usado para calcular eficiência
}

export interface LongMazeLevelConfig {
  id: number;
  name: string;
  rows: number;
  cols: number;
  timeLimitSec: number;
  minPathLength: number;
  wallDensity: number; // 0–1, opcional, ajusta densidade de paredes
}

export interface MazeSessionResult {
  levelId: number;
  success: boolean;
  elapsedMs: number;
  steps: number;
  revisits: number;
  shortestPathLength: number;
  efficiency?: number;
}
