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
  /** IES = avgRtMs / (accuracy/100) */
  ies:                  number;
  /** RT primeiro terço dos repeat trials do misto */
  vigilanceEarlyRtMs:   number;
  /** RT último terço dos repeat trials do misto */
  vigilanceLateRtMs:    number;
  /** late - early (positivo = fadiga) */
  vigilanceDeclineMs:   number;
}
