// src/attentions/selective/games/VisualSearchHunt/assessment/buildVisualSearchScaleResult.ts

import { calculateVisualSearchMetrics } from "./calculateVisualSearchMetrics";
import type {
  VisualSearchScaleResult,
  VisualSearchSessionMetricsInput
} from "./visualSearchScale.types";

function clampScore(value: number) {
  return Math.max(0, Math.min(100, value));
}

function calculateEagleScore(params: {
  omissionRate: number;
  commissionRate: number;
  dPrime: number | null;
}) {
  const { omissionRate, commissionRate, dPrime } = params;

  let score = 100;

  score -= omissionRate * 45;
  score -= commissionRate * 35;

  if (dPrime !== null) {
    if (dPrime < 0.5) score -= 20;
    else if (dPrime < 1) score -= 10;
    else if (dPrime < 1.5) score -= 5;
  }

  return clampScore(score);
}

function getMarkerLabel(score: number) {
  if (score >= 80) return "Super Águia";
  if (score >= 60) return "Águia Atenta";
  if (score >= 40) return "Águia em Ajuste";
  if (score >= 20) return "Águia Confusa";
  return "Águia Cega";
}

function getShortDescription(score: number) {
  if (score >= 80) return "Ótimo filtro visual entre alvo e distratores.";
  if (score >= 60) return "Boa capacidade de filtrar, com pequenas oscilações.";
  if (score >= 40) return "Há instabilidade moderada na filtragem visual.";
  if (score >= 20) return "Há dificuldade importante para separar alvo e distratores.";
  return "Há forte dificuldade para manter o foco no alvo visual.";
}

function getClinicalMeaning(score: number) {
  if (score >= 80) {
    return "Sugere atenção seletiva preservada e boa inibição de respostas impulsivas.";
  }

  if (score >= 60) {
    return "Sugere atenção seletiva funcional, com oscilações leves diante de estímulos competitivos.";
  }

  if (score >= 40) {
    return "Sugere dificuldade moderada para sustentar o filtro atencional ao longo da tarefa.";
  }

  if (score >= 20) {
    return "Sugere prejuízo importante no controle inibitório e na seleção visual do alvo.";
  }

  return "Sugere prejuízo acentuado na discriminação de estímulos relevantes e no controle da resposta.";
}

export function buildVisualSearchScaleResult(
  session: VisualSearchSessionMetricsInput
): VisualSearchScaleResult {
  const metrics = calculateVisualSearchMetrics(session);

  const score = Math.round(
    calculateEagleScore({
      omissionRate: metrics.omissionRate,
      commissionRate: metrics.commissionRate,
      dPrime: metrics.dPrime
    })
  );

  return {
    scaleName: "Olho de Águia",
    clinicalName: "Controle Inibitório e Atenção Seletiva",
    score,
    positionPercent: score,
    leftLabel: "Águia Cega",
    rightLabel: "Super Águia",
    markerLabel: getMarkerLabel(score),
    emoji: "🦅",
    colorToken: score >= 60 ? "success" : score >= 40 ? "warning" : "danger",
    answer: metrics.hasRelevantDifficulty ? "sim" : "nao",
    dominantPattern: metrics.dominantPattern,
    dPrimeBand: metrics.dPrimeBand,
    shortDescription: getShortDescription(score),
    clinicalMeaning: getClinicalMeaning(score),
    summary: `${score}/100 na régua Olho de Águia. Omissões ${metrics.omissionRate.toFixed(
      2
    )}, comissões ${metrics.commissionRate.toFixed(2)}.`
  };
}