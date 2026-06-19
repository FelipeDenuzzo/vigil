import type { LongMazeLevelConfig } from './types';

export const LONG_MAZE_LEVELS: LongMazeLevelConfig[] = [
  {
    id: 1,
    name: 'Fácil',
    rows: 15,
    cols: 15,
    timeLimitSec: 120,
    minPathLength: 15,
    wallDensity: 0.7,
  },
  {
    id: 2,
    name: 'Médio',
    rows: 21,
    cols: 21,
    timeLimitSec: 180,
    minPathLength: 30,
    wallDensity: 0.75,
  },
  {
    id: 3,
    name: 'Difícil',
    rows: 29,
    cols: 29,
    timeLimitSec: 240,
    minPathLength: 50,
    wallDensity: 0.8,
  },
];
