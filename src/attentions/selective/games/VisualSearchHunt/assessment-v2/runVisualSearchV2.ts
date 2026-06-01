/* src/attentions/selective/games/VisualSearchHunt/assessment-v2/runVisualSearchV2.ts */
/* Orquestrador do avaliador V2 simplificado */
/* Atualizado em: 01/06/2026 */

import type { SessionLog } from "../../../../shared/types";
import type {
  VisualSearchV2Result,
  V2RoundInput,
  ConjunctionBreakResult,
} from "./visualSearchV2.types";
import { calculateIES } from "./calculateIES";
import { calculateRadarScale } from "./calculateRadarScale";
import { calculateStaminaScale } from "./calculateStaminaScale";

// ─── Conversão do log existente para V2RoundInput ───────────────────────────
function toV2Rounds(log: SessionLog): V2RoundInput[] {
  return (log.rounds ?? []).map((round: any, idx: number) => {
    const hits = round.hits ?? (round.clicks?.filter((c: any) => c.action === "mark" && c.isTarget).length ?? 0);
    const errors = round.errors ?? (round.clicks?.filter((c: any) => c.action === "mark" && !c.isTarget).length ?? 0);
    const totalTargets = round.totalTargets ?? hits;
    const missedTargets = round.missedTargets ?? Math.max(0, totalTargets - hits);

    return {
      level: round.level ?? idx + 1,
      totalTargets,
      hits,
      errors,
      missedTargets,
      reactionTimes: Array.isArray(round.reactionTimes) ? round.reactionTimes : [],
    };
  });
}

// ─── Eagle Score (proxy v1 para comparação direta) ──────────────────────────
function calcEagle(rounds: V2RoundInput[]): { score: number; label: string } {
  const totalTargets = rounds.reduce((s, r) => s + r.totalTargets, 0);
  const totalMissed = rounds.reduce((s, r) => s + r.missedTargets, 0);
  const totalHits = rounds.reduce((s, r) => s + r.hits, 0);
  const totalErrors = rounds.reduce((s, r) => s + r.errors, 0);
  const omission = totalTargets > 0 ? totalMissed / totalTargets : 0;
  const commission = (totalHits + totalErrors) > 0 ? totalErrors / (totalHits + totalErrors) : 0;
  const score = Math.max(0, Math.min(100, Math.round(100 - omission * 45 - commission * 35)));
  const label =
    score >= 80 ? "Super Águia" :
    score >= 60 ? "Águia Atenta" :
    score >= 40 ? "Águia em Ajuste" :
    score >= 20 ? "Águia Confusa" : "Águia Cega";
  return { score, label };
}

// ─── Conjunction Break ───────────────────────────────────────────────────────
function calcConjunctionBreak(rounds: V2RoundInput[]): ConjunctionBreakResult {
  function acc(r: V2RoundInput): number {
    const d = r.hits + r.errors + r.missedTargets;
    return d > 0 ? r.hits / d : 0;
  }

  const early = rounds.filter((r) => r.level <= 4);
  const later = rounds.filter((r) => r.level >= 5);

  if (early.length === 0 || later.length === 0) {
    return {
      detected: false,
      collapseAtLevel: null,
      shortDescription: "Dados insuficientes para detectar colapso de conjunção.",
      clinicalMeaning: "Sessão incompleta.",
    };
  }

  const earlyMean = early.reduce((s, r) => s + acc(r), 0) / early.length;
  const laterMean = later.reduce((s, r) => s + acc(r), 0) / later.length;
  const drop = earlyMean - laterMean;
  const detected = drop >= 0.25 && earlyMean >= 0.7;

  const threshold = earlyMean - 0.25;
  const collapseAtLevel = detected
    ? (later.find((r) => acc(r) < threshold)?.level ?? null)
    : null;

  return {
    detected,
    collapseAtLevel,
    shortDescription: detected
      ? `Queda abrupta detectada a partir do nível ${collapseAtLevel}. Desempenho caiu de ${Math.round(earlyMean * 100)}% para ${Math.round(laterMean * 100)}%.`
      : "Nenhuma queda abrupta detectada. Desempenho consistente entre níveis simples e complexos.",
    clinicalMeaning: detected
      ? "Indica dificuldade com tarefas que exigem integração simultânea de dois atributos (cor + forma). Característico de atenção seletiva sobrecarregada."
      : "Atenção seletiva manteve critério de discriminação mesmo com aumento de complexidade.",
  };
}

// ─── Orquestrador principal ──────────────────────────────────────────────────
export function runVisualSearchV2(log: SessionLog): VisualSearchV2Result {
  const rounds = toV2Rounds(log);
  const ies = calculateIES(rounds);
  const radarScale = calculateRadarScale(rounds);
  const staminaScale = calculateStaminaScale(rounds);
  const conjunctionBreak = calcConjunctionBreak(rounds);
  const { score: eagleScore, label: eagleLabel } = calcEagle(rounds);

  return {
    version: 2,
    sessionId: log.sessionId,
    gameId: log.gameId,
    createdAt: new Date().toISOString(),
    ies,
    radarScale,
    staminaScale,
    conjunctionBreak,
    eagleScore,
    eagleLabel,
  };
}
