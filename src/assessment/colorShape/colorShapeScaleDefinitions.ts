// src/assessment/colorShape/colorShapeScaleDefinitions.ts
// Faixas de severidade definidas pelo responsável do produto.
// Estrutura: 10 (puro cor) + 10 (puro forma) + 40 misto (20 repeat + 20 switch).
// NÃO alterar sem validação clínica.

import type { ColorShapeSeverity } from './types';

// ─ Perseveração — contagem absoluta nos 20 switch trials
// Faixas exatas das diretrizes:
//   0–1  → mínimo
//   2–3  → leve
//   4–7  → moderado
//   ≥ 8   → importante
export const PERSEVERATION = {
  ausente:   { max: 1 },  // 0–1 erros
  rara:      { max: 3 },  // 2–3 erros
  frequente: { max: 7 },  // 4–7 erros
  critica:   { min: 8 },  // ≥ 8 erros
} as const;

// ─ Switching Cost (RT em ms) — switch RT − repeat RT
export const SWITCHING_COST_RT = {
  baixo:     { max: 150  },
  moderado:  { max: 320  },
  alto:      { max: 550  },
  muitoAlto: { min: 551  },
} as const;

// ─ Mixing Cost (RT em ms) — repeat_misto RT − baseline (puro A+B)
export const MIXING_COST_RT = {
  baixo:     { max: 100  },
  moderado:  { max: 270  },
  alto:      { max: 480  },
  muitoAlto: { min: 481  },
} as const;

// ─ Efeito de Bivalência (RT em ms)
export const BIVALENCY_EFFECT = {
  semEfeito: { max: 80  },
  leve:      { max: 200 },
  marcado:   { min: 201 },
} as const;

// ─ Acurácia mínima no bloco misto para não sinalizar colapso
// Diretriz: abaixo de 60% → importante
export const MIXED_ACCURACY_FLOOR = 60;

// ─ IES — Inverse Efficiency Score (menor é melhor)
export const IES_THRESHOLDS = {
  eficiente:  { max: 900  },
  moderado:   { max: 1300 },
  lento:      { max: 1800 },
  muitoLento: { min: 1801 },
} as const;

// ─ Fadiga Atencional (vigilanceDeclineMs = lateRt − earlyRt)
export const VIGILANCE_THRESHOLDS = {
  semFadiga: { max: 0   },
  leve:      { max: 80  },
  moderada:  { max: 180 },
  acentuada: { min: 181 },
} as const;

// ─ Labels visuais e scores base
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

// ─ Laudos UX (exibidos ao usuário no painel de resultado)
export const SEVERITY_UX_REPORT: Record<ColorShapeSeverity, string> = {
  minimo:
    'Mente flexível e ágil! Você virou a chave entre cores e formas rapidamente, ' +
    'sem se confundir e mantendo um excelente ritmo de resposta.',
  leve:
    'Você se adaptou bem às novas regras! Percebemos apenas que o seu cérebro precisou ' +
    'acionar um freio e diminuir a velocidade para garantir que não confundiria a cor com a forma. ' +
    'Com o treino, essa troca ficará mais automática.',
  moderado:
    'A mudança constante de regras exigiu bastante da sua agilidade mental hoje. ' +
    'Notamos que, nas encruzilhadas do jogo, a sua atenção ficou um pouco presa à regra anterior. ' +
    'Esse é um ótimo ponto para fortalecermos nas próximas sessões!',
  importante:
    'Sabemos que alternar a atenção entre duas tarefas diferentes é um dos maiores desafios ' +
    'para o cérebro, e o nível de hoje causou uma sobrecarga. Mas não desanime! ' +
    'O sistema vai ajustar a dificuldade para treinarmos essas regras passo a passo.',
};

// ─ Notas técnicas (usadas no TechnicalReport / payload do evaluator)
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
  ausente:   'Sem erros de perseveração (0–1) — desligamento da regra anterior imediato.',
  rara:      'Perseveração rara (2–3) — corrigida rapidamente.',
  frequente: 'Perseveração frequente (4–7) — inércia do set de tarefas moderada.',
  critica:   'Perseveração crítica (≥8) — rigidez severa; regra anterior domina as respostas.',
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
