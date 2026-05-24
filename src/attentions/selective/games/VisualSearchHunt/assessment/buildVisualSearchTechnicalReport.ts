// src/attentions/selective/games/VisualSearchHunt/assessment/buildVisualSearchTechnicalReport.ts

import { calculateVisualSearchMetrics } from "./calculateVisualSearchMetrics";
import { buildVisualSearchScaleResult } from "./buildVisualSearchScaleResult";
import type {
  VisualSearchSessionMetricsInput,
  VisualSearchTechnicalReport
} from "./visualSearchScale.types";
function getSeverity(params: {
  omissionRate: number;
  commissionRate: number;
}): "minimo" | "leve" | "moderado" | "importante" {
  const maxRate = Math.max(params.omissionRate, params.commissionRate);

  if (maxRate < 0.1) return "minimo";
  if (maxRate < 0.18) return "leve";
  if (maxRate < 0.3) return "moderado";
  return "importante";
}

function buildInterpretation(params: {
  dominantPattern: "adequado" | "omissao" | "comissao" | "misto";
  severity: "minimo" | "leve" | "moderado" | "importante";
  dPrime: number | null;
  dPrimeBand: string;
}) {
  const { dominantPattern, severity, dPrime, dPrimeBand } = params;

  const dPrimeSentence =
    dPrime === null
      ? "O d-prime não foi calculado por falta do total de oportunidades de falso alarme."
      : `O d-prime foi ${dPrime.toFixed(2)}, sugerindo sensibilidade perceptiva ${dPrimeBand}.`;

  if (dominantPattern === "omissao") {
    return `Há sinais ${severity} de perda de alvos, sugerindo desatenção visual ou lentidão de rastreio. ${dPrimeSentence}`;
  }

  if (dominantPattern === "comissao") {
    return `Há sinais ${severity} de cliques impulsivos em distratores, sugerindo falha de inibição. ${dPrimeSentence}`;
  }

  if (dominantPattern === "misto") {
    return `Há sinais ${severity} de instabilidade no filtro atencional, com alternância entre perda de alvos e respostas a distratores. ${dPrimeSentence}`;
  }

  return `O desempenho sugere atenção seletiva globalmente preservada. ${dPrimeSentence}`;
}

export function buildVisualSearchTechnicalReport(
  session: VisualSearchSessionMetricsInput
): VisualSearchTechnicalReport {
  const metrics = calculateVisualSearchMetrics(session);
  const scale = buildVisualSearchScaleResult(session);
  const severity = getSeverity({
    omissionRate: metrics.omissionRate,
    commissionRate: metrics.commissionRate
  });

  return {
    title: "Avaliação do Visual Search Hunt",
    question: "O paciente tem dificuldade em filtrar distratores?",
    answer: scale.answer,
    dominantPattern: metrics.dominantPattern,
    severity,
    summary: `Score: ${scale.score}/100 | Erros: ${metrics.totalErrors} | Omissões: ${metrics.totalMissedTargets} | Comissão: ${metrics.commissionRate.toFixed(
      2
    )} | Omissão: ${metrics.omissionRate.toFixed(2)}`,
    interpretation: buildInterpretation({
      dominantPattern: metrics.dominantPattern,
      severity,
      dPrime: metrics.dPrime,
      dPrimeBand: metrics.dPrimeBand
    }),
    evidence: {
      totalTargets: metrics.totalTargets,
      totalHits: metrics.totalHits,
      totalErrors: metrics.totalErrors,
      totalMissedTargets: metrics.totalMissedTargets,
      omissionRate: Number(metrics.omissionRate.toFixed(2)),
      commissionRate: Number(metrics.commissionRate.toFixed(2)),
      accuracyRate: Number(metrics.accuracyRate.toFixed(2)),
      hitRate: Number(metrics.hitRate.toFixed(2)),
      falseAlarmRate:
        metrics.falseAlarmRate === null
          ? null
          : Number(metrics.falseAlarmRate.toFixed(2)),
      dPrime: metrics.dPrime === null ? null : Number(metrics.dPrime.toFixed(2)),
      dPrimeBand: metrics.dPrimeBand,
      score: scale.score
    }
  };
}