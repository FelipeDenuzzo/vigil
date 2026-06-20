import type { ColorName, ShapeType } from './types';

export const COLORS: ColorName[]  = ['red', 'blue', 'green', 'yellow'];
export const SHAPES: ShapeType[]  = ['circle', 'square', 'triangle', 'diamond'];

export const COLOR_HEX: Record<ColorName, string> = {
  red:    '#e05555',
  blue:   '#5588e0',
  green:  '#55b87a',
  yellow: '#e0c055',
};

export const SHAPE_KEYS: Record<ShapeType, string> = {
  circle:   'a',
  square:   's',
  triangle: 'd',
  diamond:  'f',
};
export const COLOR_KEYS: Record<ColorName, string> = {
  red:    'j',
  blue:   'k',
  green:  'l',
  yellow: 'h',
};

export const FIXATION_MS      = 400;
export const MAX_RESPONSE_MS  = 2500;
export const FEEDBACK_MS      = 500;
export const ITI_MS           = 300;

export const PRACTICE_PURE_TRIALS  = 4;
export const PRACTICE_MIXED_TRIALS = 8;
export const PRACTICE_TRIALS       = PRACTICE_PURE_TRIALS + PRACTICE_MIXED_TRIALS;
export const MAIN_TRIALS           = 80;
export const MIN_BLOCK_SIZE        = 1;
export const MAX_BLOCK_SIZE        = 3;

export const CUE_COLOR_BG  = '#1a3a5c';
export const CUE_SHAPE_BG  = '#2a2a2a';
export const NEUTRAL_BG    = '#12131e';

export const SC_RT_LOW       = 150;
export const SC_RT_MODERATE  = 300;
export const SC_RT_HIGH      = 500;
export const MC_RT_LOW       = 100;
export const MC_RT_MODERATE  = 250;
export const MC_RT_HIGH      = 450;
export const PERSEV_RARE     = 2;
export const PERSEV_FREQUENT = 4;
