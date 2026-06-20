// src/assessment/colorShape/colorShapeScaleDefinitions.ts
// Faixas de severidade definidas pelo responsável do produto.
// Estrutura do jogo: 10 (puro Cor) + 10 (puro Forma) + 40 misto (20 repeat + 20 switch).
// Fonte: diretrizes oficiais do produto — NÃO alterar sem validação do responsável.
//
// ÁRVORE DE DECISÃO (ordem obrigatória):
//   1. Se Perseveration_Errors >= 8 → IMPORTANTE (independe de velocidade)
//   2. Se Perseveration_Errors 4–7 OU Accuracy < 60% → MODERADO
//   3. Se Perseveration_Errors 2–3 OU Switch_Cost/Mixing_Cost alto → LEVE
//   4. Se Perseveration_Errors 0–1 E Switch_Cost baixo → MÍNIMO

import type { ColorShapeSeverity } from './types';

// ─── Perseveração ────────────────────────────────────────────────────────────
// Contagem absoluta de erros de perseveração dentro dos 20 switch trials.
// Perseveração = clicar na regra anterior no momento em que a regra mudou.
// É o sintoma clínico mais grave — verificar PRIMEIRO na árvore de decisão.
export const PERSEVERATION = {
  ausente:   { min: 0, max: 1 },  // 0–1 erros  → Mínimo
  rara:      { min: 2, max: 3 },  // 2–3 erros  → Leve
  frequente: { min: 4, max: 7 },  // 4–7 erros  → Moderado (20%–35% das trocas)
  critica:   { min: 8 },          // ≥ 8 erros  → Importante (≥ 40% das trocas)
} as const;

// ─── Acurácia no bloco misto (%) ─────────────────────────────────────────────
// Percentual de acertos nos 40 estímulos do bloco misto.
// Abaixo de 60% indica colapso estratégico (nível próximo ao de escolha aleatória).
export const MIXED_ACCURACY = {
  colapso: { max: 59 },   // < 60%  → Importante
  baixa:   { min: 60, max: 79 }, // 60–79% → Moderado
  boa:     { min: 80 },   // ≥ 80%  → avaliação segue para Switch/Mixing Cost
} as const;

// ─── Switch Cost (diferença de RT em ms) ─────────────────────────────────────
// Fórmula: RT médio das 20 jogadas de TROCA − RT médio das 20 jogadas de REPETIÇÃO.
// Mede a lentidão exata no momento de "virar a chave" mental.
// Verificar APÓS confirmar que Perseveração está em faixa ausente/rara.
export const SWITCH_COST_RT = {
  baixo: { max: 0 },       // ≤ 0 ms  → não há penalidade de troca (Mínimo)
  alto:  { min: 1 },       // > 0 ms  → há penalidade de troca (pode cair para Leve)
} as const;

// ─── Mixing Cost (diferença de RT em ms) ─────────────────────────────────────
// Fórmula: RT médio das 20 jogadas de REPETIÇÃO (bloco misto) − Linha de Base (puros).
// Mede o "Efeito de Cautela": o usuário fica lento no bloco misto inteiro
// só por saber que a regra pode mudar a qualquer momento.
export const MIXING_COST_RT = {
  baixo: { max: 0 },       // ≤ 0 ms  → sem efeito de cautela (Mínimo)
  alto:  { min: 1 },       // > 0 ms  → efeito de cautela presente (pode cair para Leve)
} as const;

// ─── Labels visuais por severidade ───────────────────────────────────────────
export const SEVERITY_LABELS: Record<ColorShapeSeverity, string> = {
  minimo:     '🟢 Mínimo',
  leve:       '🟡 Leve',
  moderado:   '🟠 Moderado',
  importante: '🔴 Importante',
};

// ─── Scores base por severidade ──────────────────────────────────────────────
export const SEVERITY_BASE_SCORE: Record<ColorShapeSeverity, number> = {
  minimo:     92,
  leve:       72,
  moderado:   50,
  importante: 25,
};

// ─── Laudos UX (exibidos ao usuário no painel de resultado) ──────────────────
// Textos definidos pelas diretrizes oficiais do produto — não alterar redação.
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

// ─── Notas técnicas para o TechnicalReport ───────────────────────────────────
export const PERSEVERATION_NOTES = {
  ausente:   'Sem erros de perseveração (0–1) — desligamento da regra anterior imediato.',
  rara:      'Perseveração rara (2–3) — corrigida rapidamente, sem impacto clínico relevante.',
  frequente: 'Perseveração frequente (4–7) — inércia do set de tarefas moderada (20–35% das trocas).',
  critica:   'Perseveração crítica (≥8) — rigidez severa; regra anterior domina as respostas (≥40% das trocas).',
};

export const SWITCH_COST_NOTES = {
  baixo: 'Custo de mudança nulo ou negativo — troca de regra sem penalidade de velocidade.',
  alto:  'Custo de mudança positivo — lentidão detectada no momento de troca de regra.',
};

export const MIXING_COST_NOTES = {
  baixo: 'Sem efeito de cautela — presença de dois contextos não gerou lentidão global.',
  alto:  'Efeito de cautela presente — usuário ficou mais lento no bloco misto em relação aos blocos puros.',
};

export const ACCURACY_NOTES = {
  colapso: 'Acurácia abaixo de 60% no bloco misto — nível próximo ao de escolha aleatória.',
  baixa:   'Acurácia entre 60–79% no bloco misto — filtro atencional comprometido.',
  boa:     'Acurácia ≥ 80% no bloco misto — controle inibitório preservado.',
};
