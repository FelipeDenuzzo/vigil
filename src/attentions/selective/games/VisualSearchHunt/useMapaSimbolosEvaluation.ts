// src/attentions/selective/games/VisualSearchHunt/useMapaSimbolosEvaluation.ts

import { getAllSessions } from '../../../../shared/storage';
import type { SessionLog } from '../../../../shared/types';

// ─── Constantes ───────────────────────────────────────────────────────────────

const GAME_ID = 'mapa-de-simbolos';
const TREND_THRESHOLD_PCT = 15;

// ─── Tipos do log de sessão ───────────────────────────────────────────────────

export interface MapaSimbolosClickLog {
  type: 'hit' | 'commission_error';
  rt: number;
  row: number;
  col: number;
  timestamp?: number;
  timestampMs?: number;
}

export interface MapaSimbolosRoundLog {
  roundIndex: number;
  totalTargets: number;
  numberOfTargets?: number;
  clicks: MapaSimbolosClickLog[];
  omissions: number;
  timerMs: number;
}

export interface MapaSimbolosSessionLog extends SessionLog {
  gameId: 'mapa-de-simbolos';
  rounds: MapaSimbolosRoundLog[];
}

// ─── Tipos do backend ─────────────────────────────────────────────────────────

export interface MapaSimbolosBackendMetrics {
  hits: number;
  commissionErrors: number;
  omissions: number;
  avgRtMs: number;
  ies: number | null;
  con: number;
  searchStrategy: 'organized' | 'chaotic';
  organizationScore: number;
  dualTaskCost: number | null;
}

interface MapaSimbolosBackendResponse {
  game: 'mapa-de-simbolos';
  metrics: MapaSimbolosBackendMetrics;
}

// ─── Tipo de retorno do hook ──────────────────────────────────────────────────

export interface MapaSimbolosEvaluationReport {
  sessionId: string;
  metrics: MapaSimbolosBackendMetrics;
  trend: 'improved' | 'stable' | 'declined' | 'first_session';
  deltaScorePct: number | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function normalizeTimestamp(click: MapaSimbolosClickLog): number {
  return click.timestamp ?? click.timestampMs ?? 0;
}

function sortClicks(clicks: MapaSimbolosClickLog[]): MapaSimbolosClickLog[] {
  return [...clicks].sort((a, b) => normalizeTimestamp(a) - normalizeTimestamp(b));
}

function calcCONFromSession(log: MapaSimbolosSessionLog): number {
  const round = log.rounds?.[log.rounds.length - 1];
  if (!round) return 0;
  const hits = round.clicks.filter(c => c.type === 'hit').length;
  const errors = round.clicks.filter(c => c.type === 'commission_error').length;
  return hits - errors;
}

function findSingleTargetCON(
  allSessions: MapaSimbolosSessionLog[],
  currentSessionId: string
): number | undefined {
  const previous = allSessions
    .filter(s => s.sessionId !== currentSessionId)
    .sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0));

  for (const session of previous) {
    const lastRound = session.rounds?.[session.rounds.length - 1];
    if (!lastRound) continue;
    if ((lastRound.numberOfTargets ?? 1) === 1) {
      const hits = lastRound.clicks.filter(c => c.type === 'hit').length;
      const errors = lastRound.clicks.filter(c => c.type === 'commission_error').length;
      return hits - errors;
    }
  }

  return undefined;
}

// ─── Hook principal ───────────────────────────────────────────────────────────

export async function useMapaSimbolosEvaluation(
  currentSessionId: string
): Promise<MapaSimbolosEvaluationReport | null> {
  const url = import.meta.env.VITE_EVALUATOR_URL as string | undefined;
  const secret = import.meta.env.VITE_EVALUATOR_SECRET as string | undefined;

  if (!url || !secret) {
    console.warn('[useMapaSimbolosEvaluation] VITE_EVALUATOR_URL ou VITE_EVALUATOR_SECRET não configurados');
    return null;
  }

  const allSessions = getAllSessions().filter(
    s => s.gameId === GAME_ID
  ) as MapaSimbolosSessionLog[];

  const currentLog = allSessions.find(s => s.sessionId === currentSessionId);
  if (!currentLog) return null;

  const round = currentLog.rounds?.[currentLog.rounds.length - 1];
  if (!round) return null;

  const numberOfTargets = round.numberOfTargets ?? 1;

  const payload: Record<string, unknown> = {
    game: GAME_ID,
    totalTargetsOnScreen: round.totalTargets,
    numberOfTargets,
    clicks: sortClicks(round.clicks).map(c => ({
      type: c.type,
      rt: c.rt,
      row: c.row,
      col: c.col,
      timestamp: normalizeTimestamp(c),
    })),
    omissions: round.omissions,
    timerMs: round.timerMs,
  };

  if (numberOfTargets >= 2) {
    const singleTargetCON = findSingleTargetCON(allSessions, currentSessionId);
    if (singleTargetCON !== undefined) {
      payload.singleTargetCON = singleTargetCON;
    }
  }

  let data: MapaSimbolosBackendResponse;

  try {
    const res = await fetch(`${url}/evaluate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-evaluator-secret': secret,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(`[useMapaSimbolosEvaluation] HTTP ${res.status}: ${text}`);
      return null;
    }

    data = (await res.json()) as MapaSimbolosBackendResponse;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn('[useMapaSimbolosEvaluation] erro de rede:', msg);
    return null;
  }

  // ─── Trend vs histórico ───────────────────────────────────────────────────

  const history = allSessions
    .filter(s => s.sessionId !== currentSessionId)
    .sort((a, b) => (a.completedAt ?? 0) - (b.completedAt ?? 0));

  if (history.length === 0) {
    return {
      sessionId: currentSessionId,
      metrics: data.metrics,
      trend: 'first_session',
      deltaScorePct: null,
    };
  }

  const avgHistoricCON =
    history.reduce((sum, s) => sum + calcCONFromSession(s), 0) / history.length;

  const currentCON = data.metrics.con;

  const deltaScorePct =
    avgHistoricCON !== 0
      ? ((currentCON - avgHistoricCON) / Math.abs(avgHistoricCON)) * 100
      : null;

  const trend =
    deltaScorePct === null
      ? 'stable'
      : deltaScorePct >= TREND_THRESHOLD_PCT
      ? 'improved'
      : deltaScorePct <= -TREND_THRESHOLD_PCT
      ? 'declined'
      : 'stable';

  return {
    sessionId: currentSessionId,
    metrics: data.metrics,
    trend,
    deltaScorePct,
  };
}
