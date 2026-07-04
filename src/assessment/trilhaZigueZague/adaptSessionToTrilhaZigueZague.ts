// src/assessment/trilhaZigueZague/adaptSessionToTrilhaZigueZague.ts

import type { TrilhaZigueZagueSessionData, TrilhaZigueZagueSessionMetrics } from './types.ts';
import { calculateTrilhaZigueZagueMetrics } from './calculateTrilhaZigueZagueMetrics.ts';

export function adaptSessionToTrilhaZigueZague(
  sessionData: TrilhaZigueZagueSessionData
): TrilhaZigueZagueSessionMetrics {
  return calculateTrilhaZigueZagueMetrics(sessionData);
}
