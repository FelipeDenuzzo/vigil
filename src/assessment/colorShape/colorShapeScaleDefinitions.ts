// src/assessment/colorShape/colorShapeScaleDefinitions.ts
// Faixas científicas de normalidade e valores de corte.
// Fonte: TAP (Zimmermann & Fimm), WCST (Heaton et al.), literatura de task-switching.
// Recalibrado para 10 (puro cor) + 10 (puro forma) + 40 (misto) = 60 trials.
// Editado exclusivamente pelo responsável do produto com base em artigos.

import type { ColorShapeSeverity } from './types';

// ─ Switching Cost (RT em ms) — diferença switch − repeat
// Ligeiramente mais tolerante por menor n de trials (maior variância)
export const SWITCHING_COST_RT = {
  baixo:     { max: 150  }, // ≤ 150 ms → excelente flexibilidade
  moderado:  { max: 320  }, // 151–320 ms → freio leve  (era 300)
  alto:      { max: 550  }, // 321–550 ms → inércia moderada  (era 500)
  muitoAlto: { min: 551  }, // > 550 ms → rigidez cognitiva  (era 501)
} as const;

// ─ Mixing Cost (RT em ms) — diferença repeat_misto − pure
export const MIXING_COST_RT = {
  baixo:     { max: 100  },
  moderado:  { max: 270  }, // era 250
  alto:      { max: 480  }, // era 450
  muitoAlto: { min: 481  }, // era 451
} as const;

// ─ Perseveração (contagem absoluta nos switch trials)
// Com ~20 switches disponíveis, limiar crítico cai de 6 para 4
export const PERSEVERATION = {
  ausente:   { max: 0 },
  rara:      { max: 1 },  // 1  (era 1–2)
  frequente: { max: 3 },  // 2–3  (era 3–5)
  critica:   { min: 4 },  // ≥ 4  (era ≥ 6)
} as const;

// ─ Efeito de Bivalência (RT em ms)
export const BIVALENCY_EFFECT = {
  semEfeito: { max: 80  },
  leve:      { max: 200 },
  marcado:   { min: 201 },
} as const;

// ─ Acurácia mínima na fase mista (switch + repeat) para não sinalizar colapso
export const MIXED_ACCURACY_FLOOR = 55;

// ─ IES (Inverse Efficiency Score) — menor é melhor
// Limiares calibrados para 60 trials com MAX_RESPONSE_MS = 2500 ms
export const IES_THRESHOLDS = {
  eficiente:   { max: 900  }, // ≤ 900
  moderado:    { max: 1300 }, // 901–1300
  lento:       { max: 1800 }, // 1301–1800
  muitoLento:  { min: 1801 }, // > 1800
} as const;

// ─ Fadiga Atencional (vigilanceDeclineMs = lateRt − earlyRt)
// Positivo = piora de RT no último terço dos repeat trials
export const VIGILANCE_THRESHOLDS = {
  semFadiga:  { max: 0   },
  leve:       { max: 80  },
  moderada:   { max: 180 },
  acentuada:  { min: 181 },
} as const;

// ─ Labels e scores base
export const SEVERITY_LABELS: Record<ColorShapeSeverity, string> = {
  minimo:     '🟢 Mínimo',
  leve:       '🟡 Leve',
  moderado:   '🟠 Moderado',
  importante: '🔴 Importante',
};

export const SEVERITY_BASE_SCORE: Record<ColorShapeSeverity, number> = {
  minimo:     92,
  leve:       72,
  moderado:   50,
  importante: 25,
};

// ─ Textos de notas
export const SWITCHING_COST_NOTES = {
  baixo:     'Custo de mudança baixo — troca de regra quase instantânea.',
  moderado:  'Custo de mudança moderado — leve freio ao alternar regras.',
  alto:      'Custo de mudança alto — inércia mental visível nas trocas.',
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
  rara:      'Perseveração rara (1) — corrigida rapidamente.',
  frequente: 'Perseveração frequente (2–3) — inércia do set de tarefas moderada.',
  critica:   'Perseveração crítica (≥4) — rigidez severa; regra anterior domina as respostas.',
};
export const BIVALENCY_NOTES = {
  semEfeito: 'Sem efeito de bivalência — estímulos ambíguos não geram lentidão extra.',
  leve:      'Efeito leve — estímulos ambíguos causam leve hesitação.',
  marcado:   'Efeito marcado — estímulos ambíguos causam paralisia ou erro frequente.',
};
export const IES_NOTES = {
  eficiente:  'Eficiência alta — equilíbrio ideal entre velocidade e precisão.',
  moderado:   'Eficiência moderada — há margem de melhora na velocidade ou precisão.',
  lento:      'Eficiência baixa — lentidão ou imprecisão penaliza o desempenho.',
  muitoLento: 'Eficiência muito baixa — comprometimento expressivo de velocidade e/ou precisão.',
};
export const VIGILANCE_NOTES = {
  semFadiga:  'Sem sinais de fadiga — atenção sustentada ao longo de toda a sessão.',
  leve:       'Leve declínio de velocidade no final — fadiga atencional incipiente.',
  moderada:   'Declínio moderado — ritmo de resposta cai visivelmente no último terço.',
  acentuada:  'Fadiga acentuada — queda expressiva de vigilância na fase final da sessão.',
};
