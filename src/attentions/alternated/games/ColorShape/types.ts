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
  /** Bloco A — puro cor (20 trials) */
  blockATrials:   TrialResult[];
  /** Bloco B — puro forma (20 trials) */
  blockBTrials:   TrialResult[];
  /** Bloco Misto (60 trials) */
  mixedTrials:    TrialResult[];
  /** Mantidos por compatibilidade com avaliação */
  practiceTrials: TrialResult[];
  mainTrials:     TrialResult[];
  startedAt:      string;
}

export interface ColorShapeMetrics {
  totalTrials:          number;
  accuracy:             number;
  avgRtMs:              number;
  switchTrials:         number;
  repeatTrials:         number;
  switchAccuracy:       number;
  repeatAccuracy:       number;
  switchAvgRtMs:        number;
  repeatAvgRtMs:        number;
  switchCostRtMs:       number;
  switchCostErrorPp:    number;
  pureTrials:           number;
  pureAccuracy:         number;
  pureAvgRtMs:          number;
  mixingCostRtMs:       number;
  mixingCostErrorPp:    number;
  perseverationErrors:  number;
  perseverationPct:     number;
  bivalentTrials:       number;
  bivalentAvgRtMs:      number;
  nonBivalentAvgRtMs:   number;
  bivalencyEffectMs:    number;
  colorAccuracy:        number;
  shapeAccuracy:        number;
  colorAvgRtMs:         number;
  shapeAvgRtMs:         number;
  timeoutCount:         number;
  timeoutPct:           number;
  severity:             ColorShapeSeverity;
}
