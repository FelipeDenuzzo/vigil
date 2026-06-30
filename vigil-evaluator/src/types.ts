// src/types.ts
// EvaluatorInput: discriminated union por attentionType.
// Cada membro carrega APENAS os campos do seu tipo de atenção.
// Adicionar novo tipo = nova interface + novo membro na union. Sem tocar nos outros.

// ─── Seletiva (VisualSearchHunt ou Achar o Faltando) ─────────────────────────────
export interface SelectiveEvaluatorInput {
  attentionType: 'seletiva';
  sessionId: string;
  ludicScore?: number;
  game?:         'visual-search' | 'achar-o-faltando';
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

  // Campos específicos do Achar o Faltando (escanear grade e achar diferença)
  totalRounds?: number;
  totalHits?: number;
  totalOmissions?: number;
  totalFalsePositives?: number;
  totalCorrectRounds?: number;
  accuracyPerMinute?: number;
  averageResponseMs?: number;
  accuracyNote?: string;
  speedNote?: string;
  speedStyle?: 'efficient' | 'impulsive' | 'slow' | 'disorganized';
  hasFatigue?: boolean;
  leftOmissions?: number;
  rightOmissions?: number;
  asymmetryRatio?: number;
  spatialAsymmetryDominant?: 'left' | 'right' | 'symmetric' | 'insufficient-data';

  // Métricas avançadas de fase e flags clínicas
  phaseMetrics?: Array<{
    phase: number;
    phaseLabel: string;
    roundsInPhase: number;
    hits: number;
    omissions: number;
    falsePositives: number;
    rtMean: number;
    rtSdrt: number;
    dPrime: number;
    postErrorSlowing: number | null;
  }>;
  flagImpulsividade?: boolean;
  flagLentificacao?: boolean;
  flagSwitchCost?: boolean;
  flagFadigaAtencional?: boolean;
  firstHalfRtMean?: number;
  secondHalfRtMean?: number;
  firstHalfSdrt?: number;
  secondHalfSdrt?: number;
}

// ─── Sustentada (LongMazes) ──────────────────────────────────────────────────
export interface SustainedEvaluatorInput {
  attentionType:        'sustentada';
  sessionId: string;
  ludicScore?: number;
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
  sessionId: string;
  ludicScore?: number;
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
  sessionId: string;
  ludicScore?: number;
  severity?:     'minimo' | 'leve' | 'moderado' | 'importante';
  // TODO: campos do treino de atenção dividida
  [key: string]: unknown;
}

// ─── Onboarding (Avaliação Inicial Gamificada) ──────────────────────────────
export interface OnboardingEvaluatorInput {
  sessionId: string;
  ludicScore?: number;
  attentionType: 'onboarding';
  exercicio_1_calibragem: any;
  exercicio_2_gonogo: any;
  exercicio_3_alternancia: any;
  exercicio_4_dupla_tarefa: any;
  uid?: string;
}

// ─── Foco Ninja (FruitWatch) ──────────────────────────────────────────────────
export interface FruitWatchEvaluatorInput {
  attentionType:        'sustentada';
  game:                 'fruit-watch';
  sessionId: string;
  ludicScore?: number;
  severity?:            'minimo' | 'leve' | 'moderado' | 'importante';
  focoContinuo?:        number;
  controleCalma?:       number;
  focoMultitarefa?:     number;
  conquistaSecreta?:    boolean;
  rawResults?: {
    phase: number;
    targetFigureId: string;
    targetCount: number;
    userAnswer: number;
    bonusFigureId?: string;
    bonusRealCount?: number;
    bonusUserAnswer?: number;
    commissionErrors: number;
  }[];
}

// ─── Union discriminada ──────────────────────────────────────────────────────
export type EvaluatorInput =
  | SelectiveEvaluatorInput
  | SustainedEvaluatorInput
  | FruitWatchEvaluatorInput
  | AlternatingEvaluatorInput
  | DividedEvaluatorInput
  | OnboardingEvaluatorInput;

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
  generalSummary:          string;
  generalStrengths:        string[];
  generalWeaknesses:       string[];
  generalRecommendation:   string;
  clinicalStrengths:       string[];
  clinicalWeaknesses:      string[];
  clinicalRecommendation:  string;
  clinicalNote:            string;
}

// ─── Resposta do Gemini (Onboarding Gamificado) ──────────────────────────────
export interface OnboardingReport {
  mensagem_ux: {
    titulo: string;
    paragrafo_boas_vindas: string;
    superpoder: string;
    foco_de_treino: string;
  };
  dados_grafico_teia: {
    "Agilidade Mental": number;
    "Foco Contínuo": number;
    "Controle e Calma": number;
    "Flexibilidade Mental": number;
    "Foco Multitarefa": number;
  };
}

// ─── Contexto longitudinal (Fase 3) ──────────────────────────────────────────

export type PerformanceTrend = 'improving' | 'stable' | 'oscillating' | 'declining';

export interface BaselineRef {
  score: number;
  level: 'minimo' | 'leve' | 'moderado' | 'importante';
  doneAt: string;
}

export interface RecentSession {
  sessionId: string;
  ludicScore?: number;
  score: number;
  level: string;
  createdAt: string;
}

export interface ProgressContext {
  baseline: BaselineRef;
  sessionCount: number;
  recentSessions: RecentSession[];
  trend: PerformanceTrend;
  deltaFromBaseline: number;
  firstSessionAfterBaseline: boolean;
}
