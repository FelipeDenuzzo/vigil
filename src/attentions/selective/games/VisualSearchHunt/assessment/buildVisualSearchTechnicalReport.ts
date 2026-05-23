import { calculateVisualSearchMetrics } from "./calculateVisualSearchMetrics";
import type {
  VisualSearchSessionMetricsInput,
  VisualSearchTechnicalReport
} from "./visualSearchScale.types";

function getSeverity(params: {
  omissionRate: number;
  commissionRate: number;
}): "minimo" | "leve" | "moderado" | "importante" {
  const { omissionRate, commissionRate } = params;
  const maxRate = Math.max(omissionRate, commissionRate);

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
}): string {
  const { dominantPattern, severity, dPrime, dPrimeBand } = params;

  const dPrimeSentence =
    dPrime === null
      ? "O índice d-prime não pôde ser calculado com precisão por falta do denominador de falsos alarmes."
      : `O índice d-prime foi ${dPrime.toFixed(
          2
        )}, sugerindo sensibilidade perceptiva ${dPrimeBand}.`;

  if (dominantPattern === "omissao") {
    return `Há sinais ${severity} de perda de alvos relevantes, sugerindo desatenção visual, lentidão de rastreio ou oscilações do foco. ${dPrimeSentence}`;
  }

  if (dominantPattern === "comissao") {
    return `Há sinais ${severity} de respostas impulsivas diante de distratores semelhantes, sugerindo falha no controle inibitório. ${dPrimeSentence}`;
  }

  if (dominantPattern === "misto") {
    return `Há sinais ${severity} de instabilidade no filtro atencional, com alternância entre cliques em distratores e perda de alvos. ${dPrimeSentence}`;
  }

  return `O desempenho sugere atenção seletiva globalmente preservada, com baixo índice de omissões e comissões. ${dPrimeSentence}`;
}

export function buildVisualSearchTechnicalReport(
  session: VisualSearchSessionMetricsInput
): VisualSearchTechnicalReport {
  const metrics = calculateVisualSearchMetrics(session);
  const severity = getSeverity({
    omissionRate: metrics.omissionRate,
    commissionRate: metrics.commissionRate
  });

  return {
    title: "Avaliação do Visual Search Hunt",
    question: "O paciente tem dificuldade em filtrar distratores?",
    answer: metrics.hasRelevantDifficulty ? "sim" : "nao",
    dominantPattern: metrics.dominantPattern,
    severity,
    summary: `Erros: ${metrics.totalErrors} | Omissões: ${
      metrics.totalMissedTargets
    } | Taxa de omissão: ${metrics.omissionRate.toFixed(
      2
    )} | Taxa de comissão: ${metrics.commissionRate.toFixed(2)}`,
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
      dPrimeBand: metrics.dPrimeBand
    }
  };
}