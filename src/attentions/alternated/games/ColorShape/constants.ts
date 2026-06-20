import type { ColorName, ShapeType } from './types';

// ── Estímulos
export const COLORS: ColorName[]  = ['red', 'blue', 'green', 'yellow'];
export const SHAPES: ShapeType[]  = ['circle', 'square', 'triangle'];

export const COLOR_HEX: Record<ColorName, string> = {
  red:    '#e05555',
  blue:   '#5588e0',
  green:  '#55b87a',
  yellow: '#e0c055',
};

// Mapeamento de teclas
// Forma: circle=A  square=S  triangle=D
// Cor:   red=J     blue=K    green=L   yellow=H
export const SHAPE_KEYS: Record<ShapeType, string> = {
  circle:   'a',
  square:   's',
  triangle: 'd',
};
export const COLOR_KEYS: Record<ColorName, string> = {
  red:    'j',
  blue:   'k',
  green:  'l',
  yellow: 'h',
};

// ── Timing (ms)
export const FIXATION_MS      = 400;
export const MAX_RESPONSE_MS  = 2500;
export const FEEDBACK_MS      = 500;
export const ITI_MS           = 300;

// ── Estrutura experimental
export const PRACTICE_TRIALS  = 12;
export const MAIN_TRIALS      = 80;
export const MIN_BLOCK_SIZE   = 1;
export const MAX_BLOCK_SIZE   = 3;

// ── Cues visuais
export const CUE_COLOR_BG  = '#1a3a5c';
export const CUE_SHAPE_BG  = '#2a2a2a';
export const NEUTRAL_BG    = '#12131e';

// ── Limiares de severidade (literatura: TAP/WCST)
// Switching Cost RT (ms)
export const SC_RT_LOW       = 150;   // ≤ mínimo
export const SC_RT_MODERATE  = 300;   // ≤ leve
export const SC_RT_HIGH      = 500;   // ≤ moderado  (acima = importante)
// Mixing Cost RT (ms)
export const MC_RT_LOW       = 100;
export const MC_RT_MODERATE  = 250;
export const MC_RT_HIGH      = 450;
// Perseveração (contagem absoluta nos switch trials)
export const PERSEV_NONE     = 0;
export const PERSEV_RARE     = 2;     // 1-2 = leve
export const PERSEV_FREQUENT = 4;     // 3-5 = moderado (acima = importante)
