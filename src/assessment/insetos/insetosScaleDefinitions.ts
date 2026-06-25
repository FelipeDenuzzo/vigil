// src/assessment/insetos/insetosScaleDefinitions.ts

// TODO: preencher faixas com base em artigos científicos validados pelo produto
export const INSETOS_SCALE = {
  meanRT:         { excellent: null, good: null, average: null, poor: null },
  omissions:      { excellent: null, good: null, average: null, poor: null },
  commissions:    { excellent: null, good: null, average: null, poor: null },
  switchCost:     { excellent: null, good: null, average: null, poor: null },
  multiTrackCost: { excellent: null, good: null, average: null, poor: null },
};

export const SEVERITY_LABELS = {
  minimo:     '🟢 Mínimo',
  leve:       '🟡 Leve',
  moderado:   '🟠 Moderado',
  importante: '🔴 Importante',
} as const;

export const SEVERITY_BASE_SCORE = {
  minimo:     95,
  leve:       75,
  moderado:   55,
  importante: 35,
} as const;

export const SEVERITY_UX_REPORT = {
  minimo:
    'Sua flexibilidade mental e controle inibitório estão excelentes! Você conseguiu alternar a atenção de forma fluida e reagir rapidamente aos insetos em alerta.',
  leve:
    'Muito bom desempenho! Você conseguiu lidar com as trocas de regras com poucos lapsos, mostrando boa resiliência ao custo de mudança.',
  moderado:
    'Notamos um tempo de transição um pouco maior no momento de trocar de regra. Continuar treinando vai te ajudar a automatizar essa alternância mental.',
  importante:
    'A alternância constante de alvos e o número de elementos geraram sobrecarga hoje. O treino regular ajudará a expandir sua capacidade de foco e flexibilidade.',
} as const;
