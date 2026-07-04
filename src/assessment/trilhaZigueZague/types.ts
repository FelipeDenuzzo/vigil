// src/assessment/trilhaZigueZague/types.ts

export interface TrilhaZigueZagueSessionData {
  timePhase1: number; // Tempo fase 1 em segundos (float)
  timePhase2: number; // Tempo fase 2 em segundos (float)
  shiftingErrors: number; // Erros de alternância
  sequencingErrors: number; // Erros de sequência
}

export interface TrilhaZigueZagueSessionMetrics {
  timePhase1: number;
  timePhase2: number;
  switchingCost: number;
  shiftingErrors: number;
  sequencingErrors: number;
  totalErrors: number;
}

export interface TrilhaZigueZagueTechnicalReport {
  sessionId: string;
  startedAt: string;
  attentionType: 'alternada';
  game: 'trilha-zigue-zague';
  metrics: TrilhaZigueZagueSessionMetrics;
}
