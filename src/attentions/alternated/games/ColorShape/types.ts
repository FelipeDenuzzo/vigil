// Tipos do pipeline ColorShape — Atenção Alternada

export type RuleType   = 'color' | 'shape';
export type TrialType  = 'repeat' | 'switch' | 'first' | 'pure';
export type ShapeType  = 'circle' | 'square' | 'triangle';
export type ColorName  = 'red' | 'blue' | 'green' | 'yellow';
export type ColorShapeSeverity = 'minimo' | 'leve' | 'moderado' | 'importante';

export interface TrialConfig {
  trialIndex:   number;
  rule:         RuleType;
  trialType:    TrialType;   // pure | repeat | switch | first
  shape:        ShapeType;
  color:        ColorName;
  isBivalent:   boolean;     // cor E forma são ambas teclas válidas naquele trial
}

export interface TrialResult extends TrialConfig {
  keyPressed:      string;
  correct:         boolean;
  reactionMs:      number;   // -1 se timeout
  timedOut:        boolean;
  isPerseveration: boolean;  // erro usando tecla da regra ANTERIOR
}

export interface ColorShapeSessionLog {
  sessionId:      string;
  practiceTrials: TrialResult[];
  mainTrials:     TrialResult[];
  startedAt:      string;
}

export interface ColorShapeMetrics {
  // ─ Globais
  totalTrials:          number;
  accuracy:             number;       // 0–100
  avgRtMs:              number;

  // ─ Switching Cost (Mudança vs Repetição — fase mista)
  switchTrials:         number;
  repeatTrials:         number;
  switchAccuracy:       number;
  repeatAccuracy:       number;
  switchAvgRtMs:        number;
  repeatAvgRtMs:        number;
  switchCostRtMs:       number;       // switchRt − repeatRt
  switchCostErrorPp:    number;       // switchErrorRate − repeatErrorRate (p.p.)

  // ─ Mixing Cost (Repetição mista vs Bloco puro)
  pureTrials:           number;
  pureAccuracy:         number;
  pureAvgRtMs:          number;
  mixingCostRtMs:       number;       // repeatRt − pureRt
  mixingCostErrorPp:    number;

  // ─ Perseveração
  perseverationErrors:  number;
  perseverationPct:     number;       // % sobre switch trials

  // ─ Bivaliência
  bivalentTrials:       number;
  bivalentAvgRtMs:      number;
  nonBivalentAvgRtMs:   number;
  bivalencyEffectMs:    number;       // bivalentRt − nonBivalentRt

  // ─ Por regra
  colorAccuracy:        number;
  shapeAccuracy:        number;
  colorAvgRtMs:         number;
  shapeAvgRtMs:         number;

  // ─ Timeouts
  timeoutCount:         number;
  timeoutPct:           number;

  // ─ Classificação
  severity:             ColorShapeSeverity;
}
