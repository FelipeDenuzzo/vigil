// src/attentions/alternating/games/Insetos/types.ts
import type { InsetosRawEvent } from '../../../../assessment/insetos/types';

export type InsectGroup = 'formiga' | 'joaninha';

/** Direção cardinal de movimento */
export type Direction = 'up' | 'down' | 'left' | 'right';

/** Inseto na tela */
export interface Insect {
  id: string;
  group: InsectGroup;
  x: number;          // 0–100 (% da largura do canvas)
  y: number;          // 0–100 (% da altura do canvas)
  dir: Direction;     // direção atual
  speed: number;      // % por segundo
  /** ms até próxima virada espontânea */
  nextTurnMs: number;
  /** timestamp da última virada */
  lastTurnMs: number;
  /** parado em colisão/alerta */
  frozen: boolean;
  /** timestamp em que o alerta de colisão começou */
  alertStartMs: number;
  /** frame de animação de saída (0 = normal) */
  collisionFrame: number;
  collisionStartMs: number;
}

export type GamePhase = 'instructions' | 'playing' | 'done';

export interface InsetosSessionLog {
  sessionId: string;
  startedAt: string;
  rawEvents: InsetosRawEvent[];
}
