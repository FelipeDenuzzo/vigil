// src/assessment/trilhaZigueZague/buildTrilhaZigueZagueTechnicalReport.ts

import type { TrilhaZigueZagueSessionMetrics, TrilhaZigueZagueTechnicalReport } from './types.ts';

export function buildTrilhaZigueZagueTechnicalReport(
  sessionId: string,
  metrics: TrilhaZigueZagueSessionMetrics,
  startedAt: string = new Date().toISOString()
): TrilhaZigueZagueTechnicalReport {
  return {
    sessionId,
    startedAt,
    attentionType: 'alternada',
    game: 'trilha-zigue-zague',
    metrics,
  };
}
