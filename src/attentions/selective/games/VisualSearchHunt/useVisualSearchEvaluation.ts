import { getAllSessions } from "../../../../shared/storage";
import type { SessionLog, RoundLog, ClickEvent } from "../../../../shared/types";

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
}

const GAME_ID = "visual-search-hunt";
const IES_MAX = 9999;
const SCORE_BASE = 100_000;

function sortClicks(clicks: ClickEvent[]): ClickEvent[] {
  return [...clicks].sort((a, b) => a.timestamp - b.timestamp);
}

function getWrongCorrectionTimes(clicks: ClickEvent[]): number[] {
  const sorted = sortClicks(clicks);
  const openWrongMarks: ClickEvent[] = [];
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

function evaluateRound(round: RoundLog): RoundEvaluation {
  const clicks = sortClicks(round.clicks ?? []);
  const marks = clicks.filter((c) => c.action === "mark");
  const unmarks = clicks.filter((c) => c.action === "unmark");

  const targetMarks = marks.filter((c) => c.isTarget);
  const wrongMarks = marks.filter((c) => !c.isTarget);

  const hits = targetMarks.length;
  const rawErrors = wrongMarks.length;

  const totalTargets =
    typeof round.accuracy === "number" && round.accuracy > 0
      ? Math.max(hits, Math.round(hits / round.accuracy))
      : hits;

  const missed = Math.max(0, totalTargets - hits);

  const reactionTimes = round.reactionTimes ?? [];
  const avgReactionMs =
    reactionTimes.length > 0
      ? Math.round(reactionTimes.reduce((sum, value) => sum + value, 0) / reactionTimes.length)
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

    if (dt <= 1500) {
      accidentalErrors += 1;
    } else if (dt <= 3750) {
      quicklyCorrectedErrors += 1;
    } else {
      sustainedErrors += 1;
    }
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

  const exactHitsFromClicks = hits;
  const shapeErrors = 0;
  const colorErrors = 0;
  const doubleErrors = 0;

  const accidentalWrongClicks = accidentalErrors;
  const quicklyCorrectedWrongClicks = quicklyCorrectedErrors;
  const sustainedWrongClicks = sustainedErrors;
  const sustainedFinalWrongClicks = finalUncorrectedErrors;

  const colorBias = false;
  const shapeBias = false;
  const mixedBias = false;
  const marked_same_color_varied_shapes = false;
  const marked_same_shape_varied_colors = false;
  const sustained_distractor_pattern = rawErrors > 0 && finalUncorrectedErrors > 0;

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

    exactHitsFromClicks,
    shapeErrors,
    colorErrors,
    doubleErrors,

    accidentalWrongClicks,
    quicklyCorrectedWrongClicks,
    sustainedWrongClicks,
    sustainedFinalWrongClicks,

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

  const totalWeight = rounds.reduce((sum, round) => sum + round.totalTargets, 0);

  const weightedIES =
    totalWeight > 0
      ? rounds.reduce((sum, round) => sum + round.ies * round.totalTargets, 0) / totalWeight
      : IES_MAX;

  const score =
    weightedIES > 0 && Number.isFinite(weightedIES)
      ? Math.max(0, Math.round(SCORE_BASE / weightedIES))
      : 0;

  const totals = rounds.reduce(
    (acc, round) => {
      acc.rawErrors += round.rawErrors;
      acc.correctedErrors += round.correctedErrors;
      acc.accidentalErrors += round.accidentalErrors;
      acc.quicklyCorrectedErrors += round.quicklyCorrectedErrors;
      acc.sustainedErrors += round.sustainedErrors;
      acc.finalUncorrectedErrors += round.finalUncorrectedErrors;
      return acc;
    },
    {
      rawErrors: 0,
      correctedErrors: 0,
      accidentalErrors: 0,
      quicklyCorrectedErrors: 0,
      sustainedErrors: 0,
      finalUncorrectedErrors: 0,
    }
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

export function useVisualSearchEvaluation(currentSessionId: string): EvaluationReport | null {
  const allSessions = getAllSessions().filter((session) => session.gameId === GAME_ID);
  const currentLog = allSessions.find((session) => session.sessionId === currentSessionId);

  if (!currentLog) return null;

  const current = evaluateSession(currentLog);

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
  };
}