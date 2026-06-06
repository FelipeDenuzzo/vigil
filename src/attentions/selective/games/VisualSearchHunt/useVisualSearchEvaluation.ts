// src/attentions/selective/games/VisualSearchHunt/useVisualSearchEvaluation.ts
// Atualizado em: 06/06/2026 — Etapa 3.5: integração vigil-evaluator

import { getAllSessions } from "../../../../shared/storage";
import type { SessionLog } from "../../../../shared/types";
import { buildVisualSearchScaleResult } from "./assessment/buildVisualSearchScaleResult";
import { buildVisualSearchTechnicalReport } from "./assessment/buildVisualSearchTechnicalReport";
import type { VisualSearchSessionMetricsInput, VisualSearchScaleResult, VisualSearchTechnicalReport } from "./assessment/visualSearchScale.types";
import { buildVisualSearchV2Result } from "./assessment-v2";
import type { VisualSearchV2AssessmentResult } from "./assessment-v2";
import { callEvaluator, buildEvaluatorInput } from "../../../../lib/evaluatorClient";
import type { EnrichedReport } from "../../../../lib/evaluatorClient";

export interface RoundEvaluation {
  roundIndex: number;
  level: number;
  totalTargets: number;
  hits: number;
  errors: number;
  missed: number;
  avgReactionMs: number;
  precision: number;
  ies: number;

  exactHitsFromClicks: number;
  shapeErrors: number;
  colorErrors: number;
  doubleErrors: number;

  accidentalWrongClicks: number;
  quicklyCorrectedWrongClicks: number;
  sustainedWrongClicks: number;
  sustainedFinalWrongClicks: number;

  rawErrors: number;
  correctedErrors: number;
  accidentalErrors: number;
  quicklyCorrectedErrors: number;
  sustainedErrors: number;
  finalUncorrectedErrors: number;
  correctionTimesMs: number[];

  patterns: {
    wrong_before_first_hit: boolean;
    first_click_correct: boolean;
    correct_then_wrong: boolean;
    correct_then_unmarked: boolean;
    repeated_wrong_before_hit: boolean;
    no_hit_round: boolean;
    recovered_after_error: boolean;
    unstable_switching: boolean;
  };

  confusion: {
    colorBias: boolean;
    shapeBias: boolean;
    mixedBias: boolean;
    marked_same_color_varied_shapes: boolean;
    marked_same_shape_varied_colors: boolean;
    sustained_distractor_pattern: boolean;
  };
}

export interface SessionEvaluation {
  sessionId: string;
  completedAt: number | null;
  rounds: RoundEvaluation[];
  weightedIES: number;
  score: number;
  totals: {
    rawErrors: number;
    correctedErrors: number;
    accidentalErrors: number;
    quicklyCorrectedErrors: number;
    sustainedErrors: number;
    finalUncorrectedErrors: number;
  };
}

export interface EvaluationReport {
  current: SessionEvaluation;
  history: SessionEvaluation[];
  trend: "improved" | "stable" | "declined" | "first_session";
  deltaScorePct: number | null;
  scaleResult?: VisualSearchScaleResult;
  technicalReport?: VisualSearchTechnicalReport;
  /** Resultado do avaliador V2 (em paralelo com v1) */
  v2Result?: VisualSearchV2AssessmentResult;
  /** Laudo enriquecido pelo Gemini via vigil-evaluator (Cloud Run) */
  enrichedReport?: EnrichedReport;
}

const GAME_ID = "visual-search-hunt";
const IES_MAX = 9999;
const SCORE_BASE = 100_000;

function sortClicks(clicks: any[]): any[] {
  return [...clicks].sort((a, b) => (a.timestampMs ?? a.timestamp ?? 0) - (b.timestampMs ?? b.timestamp ?? 0));
}

function getWrongCorrectionTimes(clicks: any[]): number[] {
  const sorted = sortClicks(clicks);
  const openWrongMarks: any[] = [];
  const correctionTimes: number[] = [];

  for (const click of sorted) {
    if (click.action === "mark" && !click.isTarget) {
      openWrongMarks.push(click);
      continue;
    }

    if (click.action === "unmark" && openWrongMarks.length > 0) {
      const wrongMark = openWrongMarks.shift();
      if (wrongMark && click.timestamp > wrongMark.timestamp) {
        correctionTimes.push(click.timestamp - wrongMark.timestamp);
      }
    }
  }

  return correctionTimes;
}

function evaluateRound(round: any): RoundEvaluation {
  const clicks = sortClicks(round.clicks ?? []);
  const marks = clicks.filter((c) => c.action === "mark");
  const unmarks = clicks.filter((c) => c.action === "unmark");

  const targetMarks = marks.filter((c) => c.isTarget);
  const wrongMarks = marks.filter((c) => !c.isTarget);

  const hits = targetMarks.length;
  const rawErrors = wrongMarks.length;

  const totalTargets =
    typeof round.totalTargets === "number" && round.totalTargets > 0
      ? round.totalTargets
      : hits;

  const missed = Math.max(0, totalTargets - hits);

  const reactionTimes = round.reactionTimes ?? [];
  const avgReactionMs =
    reactionTimes.length > 0
      ? Math.round(reactionTimes.reduce((sum: number, value: number) => sum + value, 0) / reactionTimes.length)
      : 0;

  const precision =
    typeof round.accuracy === "number"
      ? round.accuracy
      : totalTargets + rawErrors > 0
      ? hits / (totalTargets + rawErrors)
      : 0;

  const ies = avgReactionMs > 0 && precision > 0 ? avgReactionMs / precision : IES_MAX;

  const correctionTimesMs = getWrongCorrectionTimes(clicks);

  let correctedErrors = 0;
  let accidentalErrors = 0;
  let quicklyCorrectedErrors = 0;
  let sustainedErrors = 0;

  for (const dt of correctionTimesMs) {
    correctedErrors += 1;
    if (dt <= 1500) accidentalErrors += 1;
    else if (dt <= 3750) quicklyCorrectedErrors += 1;
    else sustainedErrors += 1;
  }

  const finalUncorrectedErrors = Math.max(0, rawErrors - correctedErrors);

  const firstMark = marks[0] ?? null;
  const firstHit = targetMarks[0] ?? null;
  const firstWrong = wrongMarks[0] ?? null;

  const wrong_before_first_hit =
    !!firstWrong && !!firstHit ? firstWrong.timestamp < firstHit.timestamp : false;
  const first_click_correct = !!firstMark && firstMark.isTarget;
  const correct_then_wrong = targetMarks.some((hit) =>
    wrongMarks.some((wrong) => wrong.timestamp > hit.timestamp)
  );
  const correct_then_unmarked = unmarks.some((unmark) =>
    targetMarks.some((hit) => unmark.timestamp > hit.timestamp)
  );
  const repeated_wrong_before_hit =
    wrongMarks.filter((wrong) => !firstHit || wrong.timestamp < firstHit.timestamp).length >= 2;
  const no_hit_round = hits === 0;
  const recovered_after_error = unmarks.some((unmark) =>
    targetMarks.some((hit) => hit.timestamp > unmark.timestamp)
  );
  const unstable_switching = clicks.length >= 9 && unmarks.length >= 2;

  return {
    roundIndex: round.roundIndex,
    level: round.level,
    totalTargets,
    hits,
    errors: rawErrors,
    missed,
    avgReactionMs,
    precision,
    ies,
    exactHitsFromClicks: hits,
    shapeErrors: 0,
    colorErrors: 0,
    doubleErrors: 0,
    accidentalWrongClicks: accidentalErrors,
    quicklyCorrectedWrongClicks: quicklyCorrectedErrors,
    sustainedWrongClicks: sustainedErrors,
    sustainedFinalWrongClicks: finalUncorrectedErrors,
    rawErrors,
    correctedErrors,
    accidentalErrors,
    quicklyCorrectedErrors,
    sustainedErrors,
    finalUncorrectedErrors,
    correctionTimesMs,
    patterns: {
      wrong_before_first_hit,
      first_click_correct,
      correct_then_wrong,
      correct_then_unmarked,
      repeated_wrong_before_hit,
      no_hit_round,
      recovered_after_error,
      unstable_switching,
    },
    confusion: {
      colorBias: false,
      shapeBias: false,
      mixedBias: false,
      marked_same_color_varied_shapes: false,
      marked_same_shape_varied_colors: false,
      sustained_distractor_pattern: rawErrors > 0 && finalUncorrectedErrors > 0,
    },
  };
}

function evaluateSession(log: SessionLog): SessionEvaluation {
  const rounds = log.rounds.map(evaluateRound);

  const totalWeight = rounds.reduce((sum: number, round: RoundEvaluation) => sum + round.totalTargets, 0);
  const weightedIES =
    totalWeight > 0
      ? rounds.reduce((sum: number, round: RoundEvaluation) => sum + round.ies * round.totalTargets, 0) / totalWeight
      : IES_MAX;

  const score =
    weightedIES > 0 && Number.isFinite(weightedIES)
      ? Math.max(0, Math.round(SCORE_BASE / weightedIES))
      : 0;

  const totals = rounds.reduce(
    (acc: any, round: RoundEvaluation) => {
      acc.rawErrors += round.rawErrors;
      acc.correctedErrors += round.correctedErrors;
      acc.accidentalErrors += round.accidentalErrors;
      acc.quicklyCorrectedErrors += round.quicklyCorrectedErrors;
      acc.sustainedErrors += round.sustainedErrors;
      acc.finalUncorrectedErrors += round.finalUncorrectedErrors;
      return acc;
    },
    { rawErrors: 0, correctedErrors: 0, accidentalErrors: 0, quicklyCorrectedErrors: 0, sustainedErrors: 0, finalUncorrectedErrors: 0 }
  );

  return { sessionId: log.sessionId, completedAt: log.completedAt || null, rounds, weightedIES, score, totals };
}

export async function useVisualSearchEvaluation(
  currentSessionId: string
): Promise<EvaluationReport | null> {
  const allSessions = getAllSessions().filter((session) => session.gameId === GAME_ID);
  const currentLog = allSessions.find((session) => session.sessionId === currentSessionId);

  if (!currentLog) return null;

  const current = evaluateSession(currentLog);

  const sessionMetrics: VisualSearchSessionMetricsInput = {
    sessionId: currentLog.sessionId,
    gameId: currentLog.gameId,
    startedAt: currentLog.startedAt ? new Date(currentLog.startedAt).toISOString() : undefined,
    completedAt: currentLog.completedAt ? new Date(currentLog.completedAt).toISOString() : undefined,
    rounds: (currentLog.rounds ?? []).map((round: any, idx: number) => ({
      round: idx + 1,
      totalTargets: round.totalTargets ?? 0,
      hits: round.hits ?? 0,
      errors: round.errors ?? 0,
      missedTargets: round.missedTargets ?? 0,
      durationMs: round.durationMs,
      reactionTimes: Array.isArray(round.reactionTimes) ? round.reactionTimes : undefined,
      systematicMoves: round.systematicMoves,
      erraticMoves: round.erraticMoves,
      organizationIndex: round.organizationIndex,
      scanPattern: round.scanPattern,
      leftSideClicks: round.leftSideClicks,
      rightSideClicks: round.rightSideClicks,
      leftSideTargetMisses: round.leftSideTargetMisses,
      rightSideTargetMisses: round.rightSideTargetMisses,
      spatialAsymmetryIndex: round.spatialAsymmetryIndex,
    })),
  };

  // ── Avaliações locais (determinísticas) ─────────────────────────────────
  const scaleResult = buildVisualSearchScaleResult(sessionMetrics);
  const technicalReport = buildVisualSearchTechnicalReport(sessionMetrics);

  // ── V2 local ───────────────────────────────────────────────────────────────────
  let v2Result: VisualSearchV2AssessmentResult | undefined;
  try {
    const v2SessionLog = currentLog as any;
    if (
      v2SessionLog.rounds &&
      v2SessionLog.rounds.every(
        (r: any) =>
          r.level !== undefined &&
          Array.isArray(r.reactionTimes) &&
          r.distractorOpportunities !== undefined
      )
    ) {
      v2Result = buildVisualSearchV2Result(v2SessionLog);
    }
  } catch (e) {
    console.warn("Falha ao calcular avaliação V2:", e);
  }

  // ── Evaluator Cloud Run (Gemini) — paralelo, não bloqueia ───────────────
  let enrichedReport: EnrichedReport | undefined;
  try {
    const totalClicks = current.rounds.reduce(
      (sum, r) => sum + r.hits + r.rawErrors,
      0
    );
    const evaluatorInput = buildEvaluatorInput(
      currentLog.sessionId,
      technicalReport,
      currentLog.rounds.length,
      totalClicks
    );
    const result = await callEvaluator(evaluatorInput);
    if (result) enrichedReport = result;
  } catch (e) {
    // Falha no evaluator não quebra o fluxo — laudo local é suficiente
    console.warn("vigil-evaluator indisponível:", e);
  }

  // ── Histórico e tendência ───────────────────────────────────────────────────
  const history = allSessions
    .filter((session) => session.sessionId !== currentSessionId)
    .sort((a, b) => (a.completedAt ?? 0) - (b.completedAt ?? 0))
    .map(evaluateSession);

  if (history.length === 0) {
    return {
      current,
      history,
      trend: "first_session",
      deltaScorePct: null,
      scaleResult,
      technicalReport,
      v2Result,
      enrichedReport,
    };
  }

  const avgHistoricScore =
    history.reduce((sum, session) => sum + session.score, 0) / history.length;

  const deltaScorePct =
    avgHistoricScore > 0
      ? ((current.score - avgHistoricScore) / avgHistoricScore) * 100
      : null;

  const trend =
    deltaScorePct === null
      ? "stable"
      : deltaScorePct >= 15
      ? "improved"
      : deltaScorePct <= -15
      ? "declined"
      : "stable";

  return {
    current,
    history,
    trend,
    deltaScorePct,
    scaleResult,
    technicalReport,
    v2Result,
    enrichedReport,
  };
}
