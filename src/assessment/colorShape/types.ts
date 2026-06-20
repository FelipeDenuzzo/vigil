// src/assessment/colorShape/types.ts

export type RuleType   = 'color' | 'shape';
export type TrialType  = 'repeat' | 'switch' | 'first' | 'pure';
export type ShapeType  = 'circle' | 'square' | 'triangle' | 'diamond';
export type ColorName  = 'red' | 'blue' | 'green' | 'yellow';

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
  /** IES = avgRtMs / (accuracy / 100) — Inverse Efficiency Score */
  ies:                  number;
  /** RT primeiro terço dos repeat trials do misto */
  vigilanceEarlyRtMs:   number;
  /** RT último terço dos repeat trials do misto */
  vigilanceLateRtMs:    number;
  /** Diferença late - early (positivo = fadiga) */
  vigilanceDeclineMs:   number;
}

export interface ColorShapeScaleResult {
  switchingCostNote:  string;
  mixingCostNote:     string;
  perseverationNote:  string;
  bivalencyNote:      string;
  iesNote:            string;
  vigilanceNote:      string;
}

export interface ColorShapeTechnicalReport {
  sessionId:     string;
  startedAt:     string;
  attentionType: 'alternada';
  game:          'color-shape';
  metrics:       ColorShapeMetrics;
  scaleResult:   ColorShapeScaleResult;
  interpretation: {
    switchingCost:   { rtMs: number; errorPp: number; note: string };
    mixingCost:      { rtMs: number; errorPp: number; note: string };
    perseveration:   { count: number; pct: number; note: string };
    bivalencyEffect: { ms: number; note: string };
    ies:             { score: number; note: string };
    vigilance:       { declineMs: number; note: string };
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
