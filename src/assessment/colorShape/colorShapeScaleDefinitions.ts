// src/assessment/colorShape/colorShapeScaleDefinitions.ts
// Faixas científicas de normalidade e valores de corte.
// Fonte: TAP (Zimmermann & Fimm), WCST (Heaton et al.), literatura de task-switching.
// Editado exclusivamente pelo responsável do produto com base em artigos.

import type { ColorShapeSeverity } from './types';

// ─ Switching Cost (RT em ms) — diferenca switch − repeat
export const SWITCHING_COST_RT = {
  baixo:     { max: 150  }, // ≤ 150 ms → excelente flexibilidade
  moderado:  { max: 300  }, // 151–300 ms → freio leve
  alto:      { max: 500  }, // 301–500 ms → inercia moderada
  muitoAlto: { min: 501  }, // > 500 ms → rigidez cognitiva
} as const;

// ─ Mixing Cost (RT em ms) — diferenca repeat_misto − pure
export const MIXING_COST_RT = {
  baixo:     { max: 100  },
  moderado:  { max: 250  },
  alto:      { max: 450  },
  muitoAlto: { min: 451  },
} as const;

// ─ Perseveração (contagem absoluta nos switch trials)
export const PERSEVERATION = {
  ausente:   { max: 0 },
  rara:      { max: 2 },  // 1–2
  frequente: { max: 5 },  // 3–5
  critica:   { min: 6 },  // ≥ 6
} as const;

// ─ Efeito de Bivaliência (RT em ms)
export const BIVALENCY_EFFECT = {
  semEfeito: { max: 80  },
  leve:      { max: 200 },
  marcado:   { min: 201 },
} as const;

// ─ Acurácia mínima na fase mista (switch + repeat) para não sinalizar colapso
export const MIXED_ACCURACY_FLOOR = 55; // abaixo = desempenho ao acaso

// ─ Tabela de classificação de severidade (lógica em buildColorShapeScaleResult)
export const SEVERITY_LABELS: Record<ColorShapeSeverity, string> = {
  minimo:     '🟢 Mínimo',
  leve:       '🟡 Leve',
  moderado:   '🟠 Moderado',
  importante: '🔴 Importante',
};

// ─ Pontuação base por severidade (score final ajustado pelo avaliador)
export const SEVERITY_BASE_SCORE: Record<ColorShapeSeverity, number> = {
  minimo:     92,
  leve:       72,
  moderado:   50,
  importante: 25,
};

// ─ Textos de notas por categoria (usados no TechnicalReport e ReportPanel)
export const SWITCHING_COST_NOTES = {
  baixo:     'Custo de mudança baixo — troca de regra quase instantânea.',
  moderado:  'Custo de mudança moderado — leve freio ao alternar regras.',
  alto:      'Custo de mudança alto — inercia mental visível nas trocas.',
  muitoAlto: 'Custo de mudança muito alto — rigidez cognitiva acentuada.',
};
export const MIXING_COST_NOTES = {
  baixo:     'Sem impacto da incerteza de troca na velocidade global.',
  moderado:  'Cautela moderada na fase mista — levemente mais lento que o bloco puro.',
  alto:      'Estratégia excessivamente cautelosa — sobrecarga da memória de trabalho.',
  muitoAlto: 'Paralisia por incerteza — a possibilidade de troca compromete toda a fase.',
};
export const PERSEVERATION_NOTES = {
  ausente:   'Sem erros de perseveração — desligamento da regra anterior imediato.',
  rara:      'Perseveração rara (1–2) — corrigida rapidamente.',
  frequente: 'Perseveração frequente (3–5) — inercia do set de tarefas moderada.',
  critica:   'Perseveração crítica (≥6) — rigidez severa; regra anterior domina as respostas.',
};
export const BIVALENCY_NOTES = {
  semEfeito: 'Sem efeito de bivaliência — estímulos ambíguos não geram lentidão extra.',
  leve:      'Efeito leve — estímulos ambíguos causam leve hesitação.',
  marcado:   'Efeito marcado — estímulos ambíguos causam paralisia ou erro freqüente.',
};
