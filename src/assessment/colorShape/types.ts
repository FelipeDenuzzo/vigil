// src/assessment/colorShape/types.ts
// Tipos internos do Avaliador de Atenção Alternada — Cor ou Forma
// O jogo emite ColorShapeSessionLog; este avaliador o consome.

import type { TrialResult } from '../../attentions/alternated/games/ColorShape/types';

export type { TrialResult };

// ─ Input do avaliador (recebe diretamente o log do jogo)
export interface ColorShapeAnalysisInput {
  mainTrials: TrialResult[];
  sessionId:  string;
  startedAt:  string;
}

// ─ Métricas calculadas
export interface ColorShapeMetrics {
  // Globais
  totalTrials:          number;
  accuracy:             number;     // 0–100
  avgRtMs:              number;

  // Switching Cost
  switchTrials:         number;
  repeatTrials:         number;
  switchAccuracy:       number;
  repeatAccuracy:       number;
  switchAvgRtMs:        number;
  repeatAvgRtMs:        number;
  switchCostRtMs:       number;     // switchRt − repeatRt
  switchCostErrorPp:    number;     // switchErrorRate − repeatErrorRate (p.p.)

  // Mixing Cost
  pureTrials:           number;
  pureAccuracy:         number;
  pureAvgRtMs:          number;
  mixingCostRtMs:       number;     // repeatRt − pureRt
  mixingCostErrorPp:    number;

  // Perseveração
  perseverationErrors:  number;
  perseverationPct:     number;     // % sobre switch trials

  // Bivaliência
  bivalentTrials:       number;
  bivalentAvgRtMs:      number;
  nonBivalentAvgRtMs:   number;
  bivalencyEffectMs:    number;     // bivalentRt − nonBivalentRt

  // Por regra
  colorAccuracy:        number;
  shapeAccuracy:        number;
  colorAvgRtMs:         number;
  shapeAvgRtMs:         number;

  // Timeouts
  timeoutCount:         number;
  timeoutPct:           number;
}

// ─ Resultado da escala (aplicado pelas faixas científicas)
export type ColorShapeSeverity = 'minimo' | 'leve' | 'moderado' | 'importante';

export interface ColorShapeScaleResult {
  severity:          ColorShapeSeverity;
  score:             number;        // 0–100 (maior = melhor)
  switchingCostNote: string;        // 'baixo' | 'moderado' | 'alto' | 'muito alto'
  mixingCostNote:    string;
  perseverationNote: string;        // 'ausente' | 'rara' | 'frequente' | 'crítica'
  bivalencyNote:     string;        // 'sem efeito' | 'leve' | 'marcado'
}

// ─ Relatório técnico (input para o Gemini via vigil-evaluator)
export interface ColorShapeTechnicalReport {
  sessionId:    string;
  startedAt:    string;
  attentionType: 'alternada';
  game:          'color-shape';
  metrics:       ColorShapeMetrics;
  scaleResult:   ColorShapeScaleResult;
  interpretation: {
    switchingCost:   { rtMs: number; errorPp: number; note: string };
    mixingCost:      { rtMs: number; errorPp: number; note: string };
    perseveration:   { count: number; pct: number; note: string };
    bivalencyEffect: { ms: number; note: string };
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
