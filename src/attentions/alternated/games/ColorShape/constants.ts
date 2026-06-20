import type { ColorName, ShapeType } from './types';

// ── Estímulos ──────────────────────────────────────────────
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

// ── Timing (ms) ────────────────────────────────────────────
export const FIXATION_MS        = 400;   // ponto de fixação
export const MAX_RESPONSE_MS    = 2500;  // tempo máximo de resposta
export const FEEDBACK_MS        = 500;   // duração do feedback
export const ITI_MS             = 300;   // inter-trial interval

// ── Estrutura experimental ─────────────────────────────────
export const PRACTICE_TRIALS    = 12;
export const MAIN_TRIALS        = 80;
export const MIN_BLOCK_SIZE     = 1;     // mínimo de trials por regra
export const MAX_BLOCK_SIZE     = 3;     // máximo de trials por regra

// ── Cues visuais ───────────────────────────────────────────
export const CUE_COLOR_BG  = '#1a3a5c';  // fundo azul escuro → regra COR
export const CUE_SHAPE_BG  = '#2a2a2a';  // fundo cinza escuro → regra FORMA
export const NEUTRAL_BG    = '#12131e';  // fundo neutro (fixação / ITI)
