// src/attentions/selective/games/VisualSearchHunt/useVisualSearchEvaluation.ts

import { getAllSessions } from "../../../../shared/storage";
import type { SessionLog, RoundLog, ClickEvent } from "../../../../shared/types";

// ─── Tipos de saída ───────────────────────────────────────────────────────────

export interface RoundEvaluation {
  roundIndex: number;
  level: number;
  totalTargets: number;
  hits: number;
  errors: number;
  missed: number;
  avgReactionMs: number;  // intervalo médio entre cliques corretos consecutivos
  precision: number;      // 0–1
  ies: number;            // Inverse Efficiency Score
  // extended
  exactHitsFromClicks: number;
  shapeErrors: number;
  colorErrors: number;
  doubleErrors: number;
  // legacy names (kept for compatibility)
  accidentalWrongClicks: number;
  quicklyCorrectedWrongClicks: number;
  sustainedWrongClicks: number;
  sustainedFinalWrongClicks: number;
  // new requested analytic fields
  rawErrors: number; // total marks on wrong tiles (occurred errors)
  correctedErrors: number; // errors that were later unmarked
  accidentalErrors: number; // corrected within <=1500ms
  quicklyCorrectedErrors: number; // >1500ms && <=3750ms
  sustainedErrors: number; // corrected >3750ms
  finalUncorrectedErrors: number; // still marked at round end
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
  score: number;          // 100.000 ÷ weightedIES
  totals?: {
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
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const IES_MAX = 9999;
const SCORE_BASE = 100_000;

function evaluateRound(r: RoundLog): RoundEvaluation {
  const clicks: ClickEvent[] = (r.clicks || []).slice().sort((a, b) => a.timestamp - b.timestamp);
  const marks = clicks.filter((c) => c.action === "mark");
  const unmarks = clicks.filter((c) => c.action === "unmark");

  const hits = marks.filter((c) => c.isTarget).length;
  const rawErrors = marks.filter((c) => !c.isTarget).length;
  const totalTargets = r.accuracy && r.accuracy > 0 ? Math.max(hits, Math.round(hits / r.accuracy)) : hits;
  const missed = Math.max(0, totalTargets - hits);

  const exactHitsFromClicks = hits;
  const shapeErrors = 0;
  const colorErrors = 0;
  const doubleErrors = 0;

  const reactionTimes = r.reactionTimes ?? [];
  const avgReactionMs = reactionTimes.length > 0
    ? Math.round(reactionTimes.reduce((sum, value) => sum + value, 0) / reactionTimes.length)
    : 0;

  const precision = r.accuracy ?? (totalTargets + rawErrors > 0 ? hits / (totalTargets + rawErrors) : 0);
  const ies = hits === 0 || precision === 0 ? IES_MAX : avgReactionMs / precision;

  const correctionTimesMs: number[] = [];
  const wrongMarks = marks.filter((m) => !m.isTarget);
  for (let index = 0; index < wrongMarks.length; index++) {
    const wm = wrongMarks[index];
    const unmark = unmarks[index];
    if (unmark && unmark.timestamp > wm.timestamp) {
      correctionTimesMs.push(unmark.timestamp - wm.timestamp);
    }
  }

  let accidentalWrongClicks = 0;
  let quicklyCorrectedWrongClicks = 0;
  let sustainedWrongClicks = 0;
  let sustainedFinalWrongClicks = 0;

  let correctedErrors = 0;
  let accidentalErrors = 0;
  let quicklyCorrectedErrors = 0;
  let sustainedErrors = 0;
  let finalUncorrectedErrors = 0;

  for (let index = 0; index < wrongMarks.length; index++) {
    const wm = wrongMarks[index];
    const unmark = unmarks[index];

    if (!unmark || unmark.timestamp <= wm.timestamp) {
      sustainedFinalWrongClicks++;
      finalUncorrectedErrors++;
      continue;
    }

    correctedErrors++;
    const dt = unmark.timestamp - wm.timestamp;
    if (dt <= 1500) {
      accidentalErrors++;
      accidentalWrongClicks++;
    } else if (dt <= 3750) {
      quicklyCorrectedErrors++;
      quicklyCorrectedWrongClicks++;
    } else {
      sustainedErrors++;
      sustainedWrongClicks++;
    }
  }

  // sequence patterns
  const firstMark = marks[0] || null;
  const firstExactIndex = marks.findIndex((m) => m.isTarget);
  // const firstMarkIndex = firstMark ? 0 : -1;
  const wrong_before_first_hit = !!firstMark && firstExactIndex > 0 && !firstMark.isTarget;
  const first_click_correct = !!firstMark && firstMark.isTarget;
  const correct_then_wrong = marks.some((m, i) => m.isTarget && marks.slice(i + 1).some((x) => !x.isTarget));
  const correct_then_unmarked = marks.some((m, i) => m.isTarget && unmarks[i] && unmarks[i].timestamp > m.timestamp);
  const repeated_wrong_before_hit = false;
  const no_hit_round = firstExactIndex === -1;
  const recovered_after_error = (() => {
    for (let index = 0; index < wrongMarks.length; index++) {
      const wm = wrongMarks[index];
      const unmark = unmarks[index];
      if (!unmark || unmark.timestamp <= wm.timestamp) continue;
      if (marks.some((m) => m.isTarget && m.timestamp > unmark.timestamp)) return true;
    }
    return false;
  })();
  const unstable_switching = clicks.length > 8; // heuristic

  // confusion patterns
  const colorBias = false;
  const shapeBias = false;
  const mixedBias = false;
  const marked_same_color_varied_shapes = false;
  const marked_same_shape_varied_colors = false;
  const sustained_distractor_pattern = wrongMarks.length > 0 && finalUncorrectedErrors > 0;

  return {
    roundIndex: r.roundIndex,
    level: r.level,
    totalTargets,
    hits,
    errors: rawErrors,
    missed,
    avgReactionMs,
    precision,
    ies,
    exactHitsFromClicks,
    shapeErrors,
    colorErrors,
    doubleErrors,
    accidentalWrongClicks,
    quicklyCorrectedWrongClicks,
    sustainedWrongClicks,
    sustainedFinalWrongClicks,
    // new fields
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
      colorBias,
      shapeBias,
      mixedBias,
      marked_same_color_varied_shapes,
      marked_same_shape_varied_colors,
      sustained_distractor_pattern,
    },
  };
}

function evaluateSession(log: SessionLog): SessionEvaluation {
  const rounds = log.rounds.map(evaluateRound);

  const totalWeight = rounds.reduce((s, r) => s + r.totalTargets, 0);
  const weightedIES =
    totalWeight > 0
      ? rounds.reduce((s, r) => s + r.ies * r.totalTargets, 0) / totalWeight
      : IES_MAX;

  const score = Math.round(SCORE_BASE / weightedIES);

  // aggregate totals for requested error categories
  const totals = rounds.reduce(
    (acc, r) => {
      acc.rawErrors += r.rawErrors || 0;
      acc.correctedErrors += r.correctedErrors || 0;
      acc.accidentalErrors += r.accidentalErrors || 0;
      acc.quicklyCorrectedErrors += r.quicklyCorrectedErrors || 0;
      acc.sustainedErrors += r.sustainedErrors || 0;
      acc.finalUncorrectedErrors += r.finalUncorrectedErrors || 0;
      return acc;
    },
    {
      rawErrors: 0,
      correctedErrors: 0,
      accidentalErrors: 0,
      quicklyCorrectedErrors: 0,
      sustainedErrors: 0,
      finalUncorrectedErrors: 0,
    } as NonNullable<SessionEvaluation["totals"]>
  );

  return {
    sessionId: log.sessionId,
    completedAt: log.completedAt,
    rounds,
    weightedIES,
    score,
    totals,
  };
}

// ─── Hook principal ───────────────────────────────────────────────────────────

export function useVisualSearchEvaluation(currentSessionId: string): EvaluationReport | null {
  const allSessions = getAllSessions().filter(s => s.gameId === "visual-search-hunt");
  const currentLog = allSessions.find(s => s.sessionId === currentSessionId);
  if (!currentLog) return null;

  const current = evaluateSession(currentLog);

  const history = allSessions
    .filter(s => s.sessionId !== currentSessionId)
    .sort((a, b) => (a.completedAt ?? 0) - (b.completedAt ?? 0))
    .map(evaluateSession);

  if (history.length === 0) {
    return { current, history, trend: "first_session", deltaScorePct: null };
  }

  const avgHistoricScore = history.reduce((s, h) => s + h.score, 0) / history.length;
  const deltaScorePct = ((current.score - avgHistoricScore) / avgHistoricScore) * 100;

  const trend =
    deltaScorePct >= 15
      ? "improved"
      : deltaScorePct <= -15
      ? "declined"
      : "stable";

  return { current, history, trend, deltaScorePct };
}