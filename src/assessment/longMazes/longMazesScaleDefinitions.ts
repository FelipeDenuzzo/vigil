// Faixas científicas baseadas em literatura de TMT e funções executivas frontais
// Hierarquia de decisão: success > revisits > efficiency

export const LONG_MAZES_THRESHOLDS = {
  // Eficiência: steps / shortestPathLength (quanto menor, melhor)
  // Invertemos para %: (1 / efficiency) * 100, limitado a 100
  efficiency: {
    minimo:    { min: 85, max: 100 },  // >= 85%
    leve:      { min: 70, max: 84 },   // 70-84%
    moderado:  { min: 50, max: 69 },   // 50-69%
    importante:{ min: 0,  max: 49 },   // < 50%
  },

  // Revisitas (perseveração) — por fase
  revisits: {
    minimo:    { max: 0 },   // nenhuma
    leve:      { max: 2 },   // 1-2
    moderado:  { max: 5 },   // 3-5
    importante:{ max: Infinity }, // > 5
  },

  // Lapsos de atenção (longStops) — total consolidado
  longStops: {
    minimo:    { max: 1 },
    leve:      { max: 3 },
    moderado:  { max: 6 },
    importante:{ max: Infinity },
  },
} as const;

// Score por severity (coerente com o padrão do pipeline)
export const SEVERITY_SCORE_RANGE: Record<string, { min: number; max: number }> = {
  minimo:     { min: 80, max: 100 },
  leve:       { min: 60, max: 79 },
  moderado:   { min: 40, max: 59 },
  importante: { min: 0,  max: 39 },
};
