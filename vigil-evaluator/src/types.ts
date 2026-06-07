// vigil-evaluator/src/types.ts

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

export interface LudicReport {
  score: number;       // 0-100, espelha o score geral
  label: string;       // ex: "Muito bom!"
  emoji: string;       // ex: "⭐"
}

export interface GeneralReport {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  recommendation: string;
}

export interface ClinicalReport {
  strengths: string[];
  weaknesses: string[];
  recommendation: string;
  clinicalNote: string;
}

export interface EvaluationReport {
  score: number;
  level: 'mínimo' | 'leve' | 'moderado' | 'importante';
  ludic: LudicReport;
  general: GeneralReport;
  clinical: ClinicalReport;
}
