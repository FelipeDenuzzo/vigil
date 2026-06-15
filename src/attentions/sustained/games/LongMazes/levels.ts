import type { LongMazeLevelConfig } from './types';

export const LONG_MAZE_LEVELS: LongMazeLevelConfig[] = [
  {
    id: 1,
    name: 'Fácil',
    rows: 11,
    cols: 11,
    timeLimitSec: 120,
    minPathLength: 10,
    wallDensity: 0.7,
  },
  {
    id: 2,
    name: 'Médio',
    rows: 15,
    cols: 15,
    timeLimitSec: 180,
    minPathLength: 20,
    wallDensity: 0.75,
  },
  {
    id: 3,
    name: 'Difícil',
    rows: 21,
    cols: 21,
    timeLimitSec: 240,
    minPathLength: 35,
    wallDensity: 0.8,
  },
];
