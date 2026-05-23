export type VisualSearchRoundMetricsInput = {
  round: number;
  totalTargets: number;
  hits: number;
  errors: number;
  missedTargets: number;
  durationMs?: number;
  distractorOpportunities?: number;
};

export type VisualSearchSessionMetricsInput = {
  sessionId?: string;
  gameId?: string;
  startedAt?: string;
  completedAt?: string;
  rounds: VisualSearchRoundMetricsInput[];
};

export type VisualSearchDominantPattern =
  | "adequado"
  | "omissao"
  | "comissao"
  | "misto";

export type VisualSearchDPrimeBand =
  | "alta"
  | "funcional"
  | "reduzida"
  | "fraca"
  | "indisponivel";

export type VisualSearchScaleLevel = 1 | 2 | 3 | 4;

export type VisualSearchRoundMetrics = {
  round: number;
  totalTargets: number;
  hits: number;
  errors: number;
  missedTargets: number;
  omissionRate: number;
  commissionRate: number;
  accuracyRate: number;
  dominantPattern: VisualSearchDominantPattern;
};

export type VisualSearchMetrics = {
  totalTargets: number;
  totalHits: number;
  totalErrors: number;
  totalMissedTargets: number;
  totalDistractorOpportunities: number | null;

  omissionRate: number;
  commissionRate: number;
  accuracyRate: number;

  hitRate: number;
  falseAlarmRate: number | null;
  dPrime: number | null;
  dPrimeBand: VisualSearchDPrimeBand;

  dominantPattern: VisualSearchDominantPattern;
  hasRelevantDifficulty: boolean;

  rounds: VisualSearchRoundMetrics[];
};

export type VisualSearchScaleDefinition = {
  level: VisualSearchScaleLevel;
  id: string;
  label: string;
  emoji: string;
  colorToken: string;
  shortDescription: string;
  clinicalMeaning: string;
};

export type VisualSearchScaleResult = {
  scaleName: "Olho de Águia";
  clinicalName: "Controle Inibitório e Atenção Seletiva";
  level: VisualSearchScaleLevel;
  label: string;
  emoji: string;
  colorToken: string;
  shortDescription: string;
  clinicalMeaning: string;
  answer: "sim" | "nao";
  dominantPattern: VisualSearchDominantPattern;
  dPrimeBand: VisualSearchDPrimeBand;
  summary: string;
};

export type VisualSearchTechnicalReport = {
  title: string;
  question: string;
  answer: "sim" | "nao";
  dominantPattern: VisualSearchDominantPattern;
  severity: "minimo" | "leve" | "moderado" | "importante";
  summary: string;
  interpretation: string;
  evidence: {
    totalTargets: number;
    totalHits: number;
    totalErrors: number;
    totalMissedTargets: number;
    omissionRate: number;
    commissionRate: number;
    accuracyRate: number;
    hitRate: number;
    falseAlarmRate: number | null;
    dPrime: number | null;
    dPrimeBand: VisualSearchDPrimeBand;
  };
};