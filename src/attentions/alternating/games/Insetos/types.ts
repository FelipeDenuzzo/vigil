// src/attentions/alternating/games/Insetos/types.ts
// Tipos internos do treino Insetos — Atenção Alternada

import type { InsetosRawEvent } from '../../../../assessment/insetos/types';

export type InsectGroup = 'formiga' | 'joaninha';

/** Inseto na tela com posição e velocidade */
export interface Insect {
  id: string;
  group: InsectGroup;
  x: number;   // 0–100 (% da largura do canvas)
  y: number;   // 0–100 (% da altura do canvas)
  vx: number;  // velocidade em % por segundo
  vy: number;
  /** Frame de animação de colisão (0 = íntegro, 1–5 = colisão) */
  collisionFrame: number;
  /** Timestamp em que a colisão começou (ms) */
  collisionStartMs: number;
}

export type GamePhase =
  | 'instructions'
  | 'playing'
  | 'done';

/** Log completo enviado ao avaliador após a sessão */
export interface InsetosSessionLog {
  sessionId: string;
  startedAt: string;
  rawEvents: InsetosRawEvent[];
}
