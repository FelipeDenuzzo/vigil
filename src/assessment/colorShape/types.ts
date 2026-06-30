// src/assessment/colorShape/types.ts

export type RuleType           = 'color' | 'shape';
export type TrialType          = 'repeat' | 'switch' | 'first' | 'pure';
export type ShapeType          = 'circle' | 'square' | 'triangle' | 'diamond';
export type ColorName          = 'red' | 'blue' | 'green' | 'yellow';
export type ColorShapeSeverity = 'minimo' | 'leve' | 'moderado' | 'importante';

export interface TrialResult {
  trialIndex:      number;
  rule:            RuleType;
  trialType:       TrialType;
  shape:           ShapeType;
  color:           ColorName;
  isBivalent:      boolean;
  keyPressed:      string;
  correct:         boolean;
  reactionMs:      number;
  timedOut:        boolean;
  isPerseveration: boolean;
}

export interface ColorShapeAnalysisInput {
  /** Trials dos blocos A+B (baseline puro) */
  pureTrials:  TrialResult[];
  /** Trials do bloco Misto */
  mixedTrials: TrialResult[];
  /** Todos os trials concatenados — usado apenas para trialSummary */
  mainTrials:  TrialResult[];
  sessionId:   string;
  startedAt:   string;
}

export interface ColorShapeMetrics {
  totalTrials:         number;
  accuracy:            number;
  avgRtMs:             number;
  // Bloco misto — switch trials
  switchTrials:        number;
  switchAccuracy:      number;
  switchAvgRtMs:       number;
  switchCostRtMs:      number;   // switch RT − repeat RT
  switchCostErrorPp:   number;   // switch error% − repeat error%
  // Bloco misto — repeat trials
  repeatTrials:        number;
  repeatAccuracy:      number;
  repeatAvgRtMs:       number;
  // Blocos puros (baseline)
  pureTrials:          number;
  pureAccuracy:        number;
  pureAvgRtMs:         number;
  mixingCostRtMs:      number;   // repeat_misto RT − baseline RT
  mixingCostErrorPp:   number;   // repeat_misto error% − baseline error%
  // Perseveração
  perseverationErrors: number;
  perseverationPct:    number;
  // Acurácia por regra (blocos puros)
  colorAccuracy:       number;
  shapeAccuracy:       number;
  colorAvgRtMs:        number;
  shapeAvgRtMs:        number;
  // Abandono / tempo esgotado
  timeoutCount:        number;
  timeoutPct:          number;
  // Conversão Lúdica (Agilidade de Adaptação)
  ludicScore:          number;
}

export interface ColorShapeScaleResult {
  severity:          ColorShapeSeverity;
  score:             number;
  /** Laudo UX exibido ao usuário no painel de resultado */
  uxReport:          string;
  perseverationNote: string;
  switchingCostNote: string;
  mixingCostNote:    string;
  accuracyNote:      string;
}

export interface ColorShapeTechnicalReport {
  sessionId:     string;
  startedAt:     string;
  attentionType: 'alternada';
  game:          'color-shape';
  metrics:       ColorShapeMetrics;
  scaleResult:   ColorShapeScaleResult;
  interpretation: {
    switchingCost: { rtMs: number; errorPp: number; note: string };
    mixingCost:    { rtMs: number; errorPp: number; note: string };
    perseveration: { count: number; pct: number; note: string };
  };
  trialSummary: {
    total:        number;
    switchTrials: number;
    repeatTrials: number;
    pureTrials:   number;
    errors:       number;
    timeouts:     number;
  };
}
