// src/attentions/alternating/games/TrilhaZigueZague/types.ts

import type { TrilhaZigueZagueSessionData } from '../../../../assessment/trilhaZigueZague/types';

export type GamePhase = 'instructions' | 'phase1' | 'intermission' | 'phase2' | 'done';

export interface TrilhaNode {
  id: string; // ex: "1", "A", "2", "B"
  label: string;
  x: number; // 0-100 percentage
  y: number; // 0-100 percentage
}

export interface TrilhaZigueZagueSessionLog {
  sessionId: string;
  startedAt: string;
  sessionData: TrilhaZigueZagueSessionData;
}
