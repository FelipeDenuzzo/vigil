// Tipos do pipeline ColorShape — Atenção Alternada

export type RuleType   = 'color' | 'shape';
export type TrialType  = 'repeat' | 'switch' | 'first' | 'pure';
export type ShapeType  = 'circle' | 'square' | 'triangle' | 'diamond';
export type ColorName  = 'red' | 'blue' | 'green' | 'yellow';
export type ColorShapeSeverity = 'minimo' | 'leve' | 'moderado' | 'importante';

export interface TrialConfig {
  trialIndex:   number;
  rule:         RuleType;
  trialType:    TrialType;
  shape:        ShapeType;
  color:        ColorName;
  isBivalent:   boolean;
}

export interface TrialResult extends TrialConfig {
  keyPressed:      string;
  correct:         boolean;
  reactionMs:      number;
  timedOut:        boolean;
  isPerseveration: boolean;
}

export interface ColorShapeSessionLog {
  sessionId:      string;
  /** Bloco A — puro cor (10 trials) */
  blockATrials:   TrialResult[];
  /** Bloco B — puro forma (10 trials) */
  blockBTrials:   TrialResult[];
  /** Bloco Misto (40 trials) */
  mixedTrials:    TrialResult[];
  practiceTrials: TrialResult[];
  mainTrials:     TrialResult[];
  startedAt:      string;
}

export interface ColorShapeMetrics {
  totalTrials:         number;
  accuracy:            number;
  avgRtMs:             number;
  // Bloco misto — switch trials
  switchTrials:        number;
  switchAccuracy:      number;
  switchAvgRtMs:       number;
  switchCostRtMs:      number;
  switchCostErrorPp:   number;
  // Bloco misto — repeat trials
  repeatTrials:        number;
  repeatAccuracy:      number;
  repeatAvgRtMs:       number;
  // Blocos puros (baseline)
  pureTrials:          number;
  pureAccuracy:        number;
  pureAvgRtMs:         number;
  mixingCostRtMs:      number;
  mixingCostErrorPp:   number;
  // Perseveração
  perseverationErrors: number;
  perseverationPct:    number;
  // Acurácia por regra
  colorAccuracy:       number;
  shapeAccuracy:       number;
  colorAvgRtMs:        number;
  shapeAvgRtMs:        number;
  // Abandono / tempo esgotado
  timeoutCount:        number;
  timeoutPct:          number;
}
