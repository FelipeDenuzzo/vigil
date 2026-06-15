import { LongMazeLevelConfig } from './types';

export const levels: LongMazeLevelConfig[] = [
  {
    id: 1,
    name: "Nível 1 - Básico",
    rows: 10,
    cols: 10,
    timeLimitSec: 60,
    minPathLength: 15,
    wallDensity: 0.3
  },
  {
    id: 2,
    name: "Nível 2 - Intermediário",
    rows: 15,
    cols: 15,
    timeLimitSec: 90,
    minPathLength: 25,
    wallDensity: 0.35
  }
];
