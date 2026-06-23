// src/assessment/acharOFaltando/types.ts

export interface AcharOFaltandoMetrics {
  roundsPlayed: number;
  totalHits: number;
  totalOmissions: number;
  totalFalsePositives: number;
  totalCorrectRounds: number;
  accuracyPerMinute: number;
  averageResponseMs: number;
  roundCurve: Array<{
    roundNumber: number;
    hits: number;
    omissions: number;
    falsePositives: number;
    responseTimeMs: number;
  }>;
  speedStyle: 'efficient' | 'impulsive' | 'slow' | 'disorganized';
  hasFatigue: boolean;
  spatialAsymmetry: {
    leftOmissions: number;
    rightOmissions: number;
    asymmetryRatio: number;
    dominant: 'left' | 'right' | 'symmetric' | 'insufficient-data';
  };
}

export interface AcharOFaltandoScaleResult {
  score: number;
  level: 'mínimo' | 'leve' | 'moderado' | 'importante';
  accuracyNote: string;
  speedNote: string;
}
