// vigil-evaluator/src/types.ts
// Tipos de entrada e saída do serviço.
// EvaluatorInput espelha os campos de EvaluatorInput em src/lib/evaluatorClient.ts do Vigil.

export interface EvaluatorInput {
  sessionId: string;
  attentionType: 'seletiva' | 'sustentada' | 'alternada' | 'dividida';
  roundCount: number;
  totalClicks: number;
  commissionRate: number;
  dominantErrorAttribute: 'forma' | 'cor' | 'duplo' | 'indeterminado';
  problemRegion: 'esquerda' | 'direita' | 'centro' | 'distribuido' | 'indeterminado';
  spatialNeglect: boolean;
  severity: 'minimo' | 'leve' | 'moderado' | 'importante';
  errorProfile: {
    shapeErrors: number;
    colorErrors: number;
    doubleErrors: number;
    shapeErrorRate: number;
    colorErrorRate: number;
    doubleErrorRate: number;
  };
  spatialProfile: {
    byQuadrant: Record<string, { hits: number; errors: number; errorRate: number }>;
    spatialNeglectSide: string;
    leftMisses: number;
    rightMisses: number;
  };
}

export interface EvaluationReport {
  score: number;
  level: 'mínimo' | 'leve' | 'moderado' | 'importante';
  strengths: string[];
  weaknesses: string[];
  recommendation: string;
  clinicalNote: string;
}
