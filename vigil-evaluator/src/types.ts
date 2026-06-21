// src/types.ts
// EvaluatorInput: discriminated union por attentionType.
// Cada membro carrega APENAS os campos do seu tipo de atenção.
// Adicionar novo tipo = nova interface + novo membro na union. Sem tocar nos outros.

// ─── Seletiva (VisualSearchHunt) ────────────────────────────────────────────────
export interface SelectiveEvaluatorInput {
  attentionType: 'seletiva';
  sessionId:     string;
  roundCount?:   number;
  totalClicks?:  number;
  commissionRate?: number;
  dominantErrorAttribute?: 'forma' | 'cor' | 'duplo' | 'indeterminado';
  problemRegion?: 'esquerda' | 'direita' | 'centro' | 'distribuido' | 'indeterminado';
  spatialNeglect?: boolean;
  severity?: 'minimo' | 'leve' | 'moderado' | 'importante';
  omissionRate?: number;
  dPrime?: number | null;
  meanReactionTimeMs?: number | null;
  reactionTimeStdDev?: number | null;
  meanOrganizationIndex?: number | null;
  predominantScanPattern?: string | null;
  errorProfile?: {
    shapeErrors:    number;
    colorErrors:    number;
    doubleErrors:   number;
    shapeErrorRate: number;
    colorErrorRate: number;
    doubleErrorRate: number;
  };
  spatialProfile?: {
    byQuadrant: Record<string, { hits: number; errors: number; errorRate: number }>;
    spatialNeglectSide: string;
    leftMisses:  number;
    rightMisses: number;
  };
}

// ─── Sustentada (LongMazes) ──────────────────────────────────────────────────
export interface SustainedEvaluatorInput {
  attentionType:        'sustentada';
  sessionId:            string;
  severity?:            'minimo' | 'leve' | 'moderado' | 'importante';
  completedPhases?:     number;
  totalPhases?:         number;
  avgEfficiencyPct?:    number;
  totalRevisits?:       number;
  totalDeadEndEntries?: number;
  totalLongStops?:      number;
  avgPostErrorPauseMs?: number;
  phaseDetail?: {
    levelId:           number;
    success:           boolean;
    efficiencyPct:     number;
    revisits:          number;
    deadEndEntries:    number;
    longStops:         number;
    postErrorPauseMs:  number;
    elapsedSec:        number;
  }[];
}

// ─── Alternada (ColorShape) ──────────────────────────────────────────────────
export interface AlternatingEvaluatorInput {
  attentionType:       'alternada';
  sessionId:           string;
  startedAt?:          string;
  severity?:           'minimo' | 'leve' | 'moderado' | 'importante';
  // Métricas globais
  totalTrials?:        number;
  accuracy?:           number;
  avgRtMs?:            number;
  timeoutCount?:       number;
  timeoutPct?:         number;
  // Switching Cost
  switchTrials?:       number;
  repeatTrials?:       number;
  switchAccuracy?:     number;
  repeatAccuracy?:     number;
  switchAvgRtMs?:      number;
  repeatAvgRtMs?:      number;
  switchCostRtMs?:     number;
  switchCostErrorPp?:  number;
  // Mixing Cost
  pureTrials?:         number;
  pureAccuracy?:       number;
  pureAvgRtMs?:        number;
  mixingCostRtMs?:     number;
  mixingCostErrorPp?:  number;
  // Perseveração
  perseverationErrors?: number;
  perseverationPct?:    number;
  // Por regra (blocos puros)
  colorAccuracy?:       number;
  shapeAccuracy?:       number;
  colorAvgRtMs?:        number;
  shapeAvgRtMs?:        number;
  // Notas do scale result
  switchingCostNote?:   string;
  mixingCostNote?:      string;
  perseverationNote?:   string;
  accuracyNote?:        string;
}

// ─── Dividida (placeholder — campos definidos quando o jogo existir) ──────────
export interface DividedEvaluatorInput {
  attentionType: 'dividida';
  sessionId:     string;
  severity?:     'minimo' | 'leve' | 'moderado' | 'importante';
  // TODO: campos do treino de atenção dividida
  [key: string]: unknown;
}

// ─── Union discriminada ──────────────────────────────────────────────────────
export type EvaluatorInput =
  | SelectiveEvaluatorInput
  | SustainedEvaluatorInput
  | AlternatingEvaluatorInput
  | DividedEvaluatorInput;

// ─── Camadas do laudo (alternada e futuras) ────────────────────────────────────
export interface ReportLayers {
  general: {
    summary:        string;
    strengths:      string[];
    weaknesses:     string[];
    recommendation: string;
  };
  clinical: {
    strengths:      string[];
    weaknesses:     string[];
    recommendation: string;
    note:           string;
  };
}

// ─── Resposta do Gemini (compartilhada por todos os tipos) ─────────────────────
export interface EvaluationReport {
  score:  number;
  level:  'mínimo' | 'leve' | 'moderado' | 'importante';
  // Estrutura nova (alternada) — campos flat que são remapeados na rota
  generalSummary?:          string;
  generalStrengths?:        string[];
  generalWeaknesses?:       string[];
  generalRecommendation?:   string;
  clinicalStrengths?:       string[];
  clinicalWeaknesses?:      string[];
  clinicalRecommendation?:  string;
  clinicalNote?:            string;
  // Estrutura legada (seletiva / sustentada)
  strengths?:      string[];
  weaknesses?:     string[];
  recommendation?: string;
}
