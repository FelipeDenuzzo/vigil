// src/assessment/acharOFaltando/types.ts

export interface PhaseMetrics {
  phase: number;                    // 1–10
  phaseLabel: string;               // ex: 'Busca Serial Q/O'
  roundsInPhase: number;            // quantos rounds completou nessa fase
  hits: number;
  omissions: number;
  falsePositives: number;           // comissões
  rtMean: number;                   // RT médio em ms
  rtSdrt: number;                   // desvio padrão dos RTs (variabilidade)
  dPrime: number;                   // d' = z(hitRate) - z(falseAlarmRate)
  postErrorSlowing: number | null;  // diferença RT após erro vs. RT normal (ms)
  rtValues: number[];               // todos os RTs individuais da fase (para cálculo)
}

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
  phaseMetrics: PhaseMetrics[];
  // Flags clínicas
  flagImpulsividade: boolean;
  flagLentificacao: boolean;
  flagSwitchCost: boolean;
  flagFadigaAtencional: boolean;
  // Time-on-Task comparativo
  firstHalfRtMean: number;   // média RT fases 1–5
  secondHalfRtMean: number;  // média RT fases 6–10
  firstHalfSdrt: number;
  secondHalfSdrt: number;
  // Conversão Lúdica
  fatigueIndex: number;
  ludicScore: number;
}

export interface AcharOFaltandoScaleResult {
  score: number;
  level: 'mínimo' | 'leve' | 'moderado' | 'importante';
  accuracyNote: string;
  speedNote: string;
}
