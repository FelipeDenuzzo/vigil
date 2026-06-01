// assessment-v2/calculateIES.ts
import type { V2RoundInput, IESResult } from "./visualSearchV2.types";

export function calculateIES(rounds: V2RoundInput[]): IESResult {
  const allRTs = rounds.flatMap((r) => r.reactionTimes);
  const meanRT =
    allRTs.length > 0
      ? allRTs.reduce((sum, v) => sum + v, 0) / allRTs.length
      : 0;

  const totalHits    = rounds.reduce((s, r) => s + r.hits, 0);
  const totalTargets = rounds.reduce((s, r) => s + r.totalTargets, 0);
  const totalErrors  = rounds.reduce((s, r) => s + r.errors, 0);
  const accuracyRate =
    totalTargets + totalErrors > 0
      ? totalHits / (totalTargets + totalErrors)
      : 0;

  const ies =
    meanRT > 0 && accuracyRate > 0 ? meanRT / accuracyRate : 99999;

  const displayScore =
    ies > 0 && Number.isFinite(ies) ? Math.round(10_000_000 / ies) : 0;

  return {
    meanReactionTime: Math.round(meanRT),
    accuracyRate,
    ies,
    displayScore,
  };
}
