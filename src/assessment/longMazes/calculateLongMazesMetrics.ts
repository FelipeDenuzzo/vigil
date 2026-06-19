import type { MazeFullSessionLog } from '../../attentions/sustained/games/LongMazes/types';
import type { MazePhaseMetrics, MazeAggregatedMetrics } from './types';
import { LONG_MAZES_THRESHOLDS, SEVERITY_SCORE_RANGE } from './longMazesScaleDefinitions';
import type { MazeSeverity } from './types';

function efficiencyPct(steps: number, shortest: number): number {
  if (shortest <= 0 || steps <= 0) return 0;
  // efficiency = steps/shortest (1.0 = perfeito, maior = pior)
  // Converte para %: quanto menor efficiency, maior a nota
  const raw = (1 / (steps / shortest)) * 100;
  return Math.min(100, Math.round(raw));
}

function resolveSeverity(
  completedPhases: number,
  totalRevisits: number,
  avgEffPct: number,
  totalLongStops: number
): MazeSeverity {
  // Hierarquia 1: se não concluiu nenhuma fase
  if (completedPhases === 0) return 'importante';

  // Hierarquia 2: revisitas totais indicam perseveração
  if (totalRevisits > 5) return 'importante';
  if (totalRevisits >= 3) return 'moderado';

  // Hierarquia 3: eficiência média
  const t = LONG_MAZES_THRESHOLDS.efficiency;
  if (avgEffPct >= t.minimo.min) {
    // Verifica se lapsos não puxam para baixo
    if (totalLongStops <= LONG_MAZES_THRESHOLDS.longStops.minimo.max) return 'minimo';
    return 'leve';
  }
  if (avgEffPct >= t.leve.min) return 'leve';
  if (avgEffPct >= t.moderado.min) return 'moderado';
  return 'importante';
}

function resolveScore(severity: MazeSeverity, avgEffPct: number): number {
  const range = SEVERITY_SCORE_RANGE[severity];
  // Interpola o score dentro da faixa com base na eficiência
  const normalized = Math.min(1, Math.max(0, avgEffPct / 100));
  return Math.round(range.min + normalized * (range.max - range.min));
}

export function calculateLongMazesMetrics(
  log: MazeFullSessionLog
): MazeAggregatedMetrics {
  const phases: MazePhaseMetrics[] = log.phases.map((p) => ({
    levelId: p.levelId,
    success: p.success,
    efficiencyPct: efficiencyPct(p.steps, p.shortestPathLength),
    revisits: p.revisits,
    deadEndEntries: p.deadEndEntries,
    longStops: p.longStops,
    postErrorPauseMs: p.postErrorPause,
    elapsedMs: p.elapsedMs,
  }));

  const completedPhases = phases.filter((p) => p.success).length;
  const avgEfficiencyPct = Math.round(
    phases.reduce((acc, p) => acc + p.efficiencyPct, 0) / phases.length
  );
  const totalRevisits = phases.reduce((acc, p) => acc + p.revisits, 0);
  const totalDeadEndEntries = phases.reduce((acc, p) => acc + p.deadEndEntries, 0);
  const totalLongStops = phases.reduce((acc, p) => acc + p.longStops, 0);
  const avgPostErrorPauseMs = Math.round(
    phases.reduce((acc, p) => acc + p.postErrorPauseMs, 0) / phases.length
  );

  const severity = resolveSeverity(completedPhases, totalRevisits, avgEfficiencyPct, totalLongStops);
  const score = resolveScore(severity, avgEfficiencyPct);

  return {
    phases,
    completedPhases,
    avgEfficiencyPct,
    totalRevisits,
    totalDeadEndEntries,
    totalLongStops,
    avgPostErrorPauseMs,
    severity,
    score,
  };
}
