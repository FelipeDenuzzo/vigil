// src/attentions/sustained/games/FruitWatch/levels.ts

import type { FigureDefinition, PhaseConfig } from './types';

// Catálogo das 23 imagens PNG da pasta public/figuras/
export const FIGURES: FigureDefinition[] = [
  // Amarelos
  { id: 'amarelo_abacaxi', imagePath: '/figuras/amarelo abacaxi.png', category: 'yellow' },
  { id: 'amarelo_limao',   imagePath: '/figuras/amarelo limão.png',   category: 'yellow' },
  { id: 'amarelo_manga',   imagePath: '/figuras/amarelo manga.png',   category: 'yellow' },
  // Roxos
  { id: 'roxo_amora',      imagePath: '/figuras/roxo amora.png',      category: 'purple' },
  { id: 'roxo_berinjela',  imagePath: '/figuras/roxo berinjela.png',  category: 'purple' },
  { id: 'roxo_mirtilo',    imagePath: '/figuras/roxo mirtilo.png',    category: 'purple' },
  { id: 'roxo_uva',        imagePath: '/figuras/roxo uva.png',        category: 'purple' },
  // Verdes
  { id: 'verde_conde',     imagePath: '/figuras/verde conde.png',     category: 'green' },
  { id: 'verde_limao',     imagePath: '/figuras/verde limão.png',     category: 'green' },
  { id: 'verde_manga',     imagePath: '/figuras/verde manga.png',     category: 'green' },
  { id: 'verde_maca',      imagePath: '/figuras/verde maça.png',      category: 'green' },
  { id: 'verde_pera',      imagePath: '/figuras/verde pera.png',      category: 'green' },
  { id: 'verde_uva',       imagePath: '/figuras/verde uva.png',       category: 'green' },
  // Vermelhos
  { id: 'vermelho_maca',   imagePath: '/figuras/vermelho Maça.png',   category: 'red' },
  { id: 'vermelho_cereja', imagePath: '/figuras/vermelho cereja.png', category: 'red' },
  { id: 'vermelho_morango',imagePath: '/figuras/vermelho morango.png',category: 'red' },
  { id: 'vermelho_tomate', imagePath: '/figuras/vermelho tomate.png', category: 'red' },
  // Diferentes
  { id: 'diferentes_1',    imagePath: '/figuras/diferentes 1.png',    category: 'different' },
  { id: 'diferentes_2',    imagePath: '/figuras/diferentes 2.png',    category: 'different' },
  { id: 'diferentes_3',    imagePath: '/figuras/diferentes 3.png',    category: 'different' },
  { id: 'diferentes_4',    imagePath: '/figuras/diferentes 4.png',    category: 'different' },
  { id: 'diferentes_5',    imagePath: '/figuras/diferentes 5.png',    category: 'different' },
  { id: 'diferentes_6',    imagePath: '/figuras/diferentes 6.png',    category: 'different' },
];

export const PHASE_CONFIGS: PhaseConfig[] = [
  {
    phase: 1, mode: 'single',
    durationMs: 60_000,
    simultaneousFigures: 1,
    interItemIntervalMs: [1200, 2800],
    flightDurationMs: [550, 750],
  },
  {
    phase: 2, mode: 'single',
    durationMs: 60_000,
    simultaneousFigures: 2,
    interItemIntervalMs: [900, 2400],
    flightDurationMs: [550, 750],
  },
  {
    phase: 3, mode: 'conjunction',
    durationMs: 60_000,
    simultaneousFigures: 2,
    interItemIntervalMs: [800, 2000],
    flightDurationMs: [500, 650],
  },
  {
    phase: 4, mode: 'conjunction',
    durationMs: 60_000,
    simultaneousFigures: 3,
    interItemIntervalMs: [600, 1800],
    flightDurationMs: [500, 650],
  },
  {
    phase: 5, mode: 'bonus_after',
    durationMs: 60_000,
    simultaneousFigures: 3,
    interItemIntervalMs: [600, 1800],
    flightDurationMs: [500, 650],
  },
  {
    phase: 6, mode: 'bonus_before',
    durationMs: 60_000,
    simultaneousFigures: 3,
    interItemIntervalMs: [600, 1800],
    flightDurationMs: [500, 650],
  },
];

// Gera ordem randômica dos 4 grupos de cores (vermelho, verde, roxo, amarelo)
export function shuffleColorCategories(): ('red' | 'green' | 'purple' | 'yellow')[] {
  const categories: ('red' | 'green' | 'purple' | 'yellow')[] = ['red', 'green', 'purple', 'yellow'];
  for (let i = categories.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [categories[i], categories[j]] = [categories[j], categories[i]];
  }
  return categories;
}

// Seleciona o alvo, distratores e bônus dinamicamente por fase da sessão
export function pickTargetAndDistractorsForSession(
  phase: number,
  shuffledCategories: ('red' | 'green' | 'purple' | 'yellow')[]
): {
  target: FigureDefinition;
  distractors: FigureDefinition[];
  bonusFigure?: FigureDefinition;
} {
  // Fases 1–2: Alvo e distratores muito distintos (de cores diferentes e itens 'different')
  if (phase <= 2) {
    const target = FIGURES.find(f => f.id === 'vermelho_morango')!; // Alvo fixo de contraste
    const distractors = [
      FIGURES.find(f => f.id === 'amarelo_abacaxi')!,
      FIGURES.find(f => f.id === 'roxo_uva')!,
      FIGURES.find(f => f.id === 'diferentes_1')!,
      FIGURES.find(f => f.id === 'diferentes_2')!,
    ];
    return { target, distractors };
  }

  // Fases 3–6: Itens altamente semelhantes da mesma categoria de cor (randomizada)
  const currentCategory = shuffledCategories[phase - 3];
  const groupItems = FIGURES.filter(f => f.category === currentCategory);

  // Seleciona o primeiro como alvo e os restantes como distratores
  const target = groupItems[0];
  const distractors = groupItems.slice(1);

  // Para as fases com pergunta bônus (5 e 6), escolhemos um dos distratores como bônus
  let bonusFigure: FigureDefinition | undefined;
  if (phase >= 5) {
    bonusFigure = distractors[0];
  }

  return { target, distractors, bonusFigure };
}
