// Artefato 1 — Cálculo determinístico das métricas do LongMazes
// Entrada:  MazeFullSessionLog (saída direta do jogo)
// Saída:   MazeAggregatedMetrics (entrada do Artefato 2 e dos componentes UI)

import type { MazeFullSessionLog } from '../../attentions/sustained/games/LongMazes/types';
import type { MazeAggregatedMetrics, MazePhaseMetrics, LongMazesSeverity } from './types';

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function calcEfficiencyPct(steps: number, shortestPathLength: number): number {
  if (steps <= 0 || shortestPathLength <= 0) return 0;
  return clamp(Math.round((shortestPathLength / steps) * 100), 0, 100);
}

function calcSeverity(
  completedPhases: number,
  totalRevisits: number,
  avgEfficiencyPct: number,
  totalLongStops: number
): LongMazesSeverity {
  if (completedPhases === 0)                             return 'importante';
  if (totalRevisits > 5)                                 return 'importante';
  if (totalRevisits >= 3)                                return 'moderado';
  if (avgEfficiencyPct >= 85 && totalLongStops <= 1)     return 'minimo';
  if (avgEfficiencyPct >= 70)                            return 'leve';
  if (avgEfficiencyPct >= 50)                            return 'moderado';
  return 'importante';
}

export function calculateLongMazesMetrics(
  log: MazeFullSessionLog
): MazeAggregatedMetrics {
  const phases: MazePhaseMetrics[] = log.phases.map((p) => ({
    levelId:          p.levelId,
    success:          p.success,
    efficiencyPct:    calcEfficiencyPct(p.steps, p.shortestPathLength),
    revisits:         p.revisits,
    deadEndEntries:   p.deadEndEntries,
    longStops:        p.longStops,
    postErrorPauseMs: p.postErrorPause,
    elapsedMs:        p.elapsedMs,
    elapsedSec:       Math.round(p.elapsedMs / 1000),
  }));

  const completedPhases     = phases.filter((p) => p.success).length;
  const totalPhases         = phases.length;
  const totalRevisits       = phases.reduce((s, p) => s + p.revisits, 0);
  const totalDeadEndEntries = phases.reduce((s, p) => s + p.deadEndEntries, 0);
  const totalLongStops      = phases.reduce((s, p) => s + p.longStops, 0);

  const avgEfficiencyPct =
    phases.length > 0
      ? Math.round(phases.reduce((s, p) => s + p.efficiencyPct, 0) / phases.length)
      : 0;

  const pauseValues = phases.map((p) => p.postErrorPauseMs).filter((v) => v > 0);
  const avgPostErrorPauseMs =
    pauseValues.length > 0
      ? Math.round(pauseValues.reduce((s, v) => s + v, 0) / pauseValues.length)
      : 0;

  const severity = calcSeverity(
    completedPhases,
    totalRevisits,
    avgEfficiencyPct,
    totalLongStops
  );

  return {
    phases,
    completedPhases,
    totalPhases,
    avgEfficiencyPct,
    totalRevisits,
    totalDeadEndEntries,
    totalLongStops,
    avgPostErrorPauseMs,
    severity,
  };
}
