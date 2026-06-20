// Tipos do pipeline ColorShape — Atenção Alternada

export type RuleType   = 'color' | 'shape';
export type TrialType  = 'repeat' | 'switch' | 'first';
export type ShapeType  = 'circle' | 'square' | 'triangle';
export type ColorName  = 'red' | 'blue' | 'green' | 'yellow';

export interface TrialConfig {
  trialIndex:   number;
  rule:         RuleType;
  trialType:    TrialType;   // repeat | switch | first
  shape:        ShapeType;
  color:        ColorName;
}

export interface TrialResult extends TrialConfig {
  keyPressed:   string;
  correct:      boolean;
  reactionMs:   number;      // -1 se tempo esgotado
  timedOut:     boolean;
}

export interface ColorShapeSessionLog {
  sessionId:    string;
  practiceTrials: TrialResult[];
  mainTrials:     TrialResult[];
  startedAt:    string;      // ISO timestamp
}

export interface ColorShapeMetrics {
  // globais
  totalTrials:       number;
  accuracy:          number;   // 0-100
  avgRtMs:           number;
  // por tipo de trial
  repeatAccuracy:    number;
  switchAccuracy:    number;
  repeatAvgRtMs:     number;
  switchAvgRtMs:     number;
  switchCostRtMs:    number;   // switchAvgRt - repeatAvgRt
  switchCostError:   number;   // switchErrorRate - repeatErrorRate (p.p.)
  // por regra
  colorAccuracy:     number;
  shapeAccuracy:     number;
  colorAvgRtMs:      number;
  shapeAvgRtMs:      number;
  // timeouts
  timeoutCount:      number;
  timeoutPct:        number;
}
