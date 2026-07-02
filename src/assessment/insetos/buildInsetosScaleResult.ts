// src/assessment/insetos/buildInsetosScaleResult.ts

import type { InsetosMetrics, InsetosScaleResult } from './types';
import { SEVERITY_BASE_SCORE } from './insetosScaleDefinitions';

export function buildInsetosScaleResult(metrics: InsetosMetrics): InsetosScaleResult {
  // Lógica de fallback para cálculo de score/level enquanto as faixas científicas são TODO.
  const acc = metrics.accuracyPct ?? 0;
  const omissions = metrics.omissions;

  let level: 'minimo' | 'leve' | 'moderado' | 'importante' = 'minimo';
  if (acc < 50 || omissions > 10) {
    level = 'importante';
  } else if (acc < 70 || omissions > 6) {
    level = 'moderado';
  } else if (acc < 85 || omissions > 3) {
    level = 'leve';
  }

  // Formula A: Insetos (Flanker Effect)
  function clamp(v: number, min = 0, max = 100): number {
    return Math.max(min, Math.min(max, v));
  }
  const flankerEffectMs = metrics.flankerEffectMs || 50;
  const score = Math.round(clamp(100 - ((flankerEffectMs - 50) / (600 - 50)) * 100));

  let accuracyNote = 'Acurácia preservada. Bom controle e foco no grupo ativo.';
  if (acc < 60) {
    accuracyNote = 'Baixa acurácia. Apresenta dificuldades severas em manter o foco contínuo.';
  } else if (acc < 80) {
    accuracyNote = 'Acurácia moderada. Filtro atencional oscilante.';
  }

  let speedNote = 'Tempo de reação rápido e estável.';
  if (metrics.meanRT && metrics.meanRT > 600) {
    speedNote = 'Tempo de reação lentificado ao responder aos estímulos.';
  } else if (metrics.meanRT && metrics.meanRT > 450) {
    speedNote = 'Velocidade de processamento dentro da média.';
  }

  let switchCostNote = 'Transições de regra rápidas e eficientes.';
  if (metrics.switchCostMs && metrics.switchCostMs > 200) {
    switchCostNote = 'Custo de alternância (switch cost) elevado. Dificuldade de desligamento da regra anterior.';
  } else if (metrics.switchCostMs && metrics.switchCostMs > 50) {
    switchCostNote = 'Leve lentificação após a mudança de regra.';
  }

  return {
    score,
    level,
    accuracyNote,
    speedNote,
    switchCostNote,
  };
}
