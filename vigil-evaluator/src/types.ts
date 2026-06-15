// vigil-evaluator/src/types.ts

export interface EvaluatorInput {
  sessionId: string;
  attentionType: 'seletiva' | 'sustentada' | 'alternada' | 'dividida';
  roundCount: number;
  totalClicks: number;
  totalHits?: number;
  totalTargets?: number;
  totalMissedTargets?: number;
  commissionRate: number;
  omissionRate?: number;
  dPrime?: number | null;
  meanReactionTimeMs?: number | null;
  reactionTimeStdDev?: number | null;
  meanOrganizationIndex?: number | null;
  predominantScanPattern?: string | null;
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
  score: number;
  label: string;
  emoji: string;
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

// Job assíncrono salvo no Firestore
export type JobStatus = 'pending' | 'done' | 'error';

export interface EvaluationJob {
  jobId: string;
  sessionId: string;
  status: JobStatus;
  payload: EvaluatorInput;
  result: EvaluationReport | null;
  error: string | null;
  createdAt: number;
  finishedAt: number | null;
}
