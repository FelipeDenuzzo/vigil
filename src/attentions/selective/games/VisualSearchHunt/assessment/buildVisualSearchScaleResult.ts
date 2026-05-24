// src/attentions/selective/games/VisualSearchHunt/assessment/buildVisualSearchScaleResult.ts
// Atualizado em: 24/05/2026 às 16:16 (BRT)

import { calculateVisualSearchMetrics } from './calculateVisualSearchMetrics';
import type {
  SubscaleResult,
  SubscaleSeverity,
  VisualSearchMetrics,
  VisualSearchScaleResult,
  VisualSearchSessionMetricsInput
} from './visualSearchScale.types';

// ─── Utilitário de score ─────────────────────────────────────────────

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function calculateEagleScore(m: VisualSearchMetrics): number {
  if (m.totalHits === 0 && m.totalErrors === 0) return 0;

  let score = 100;
  score -= m.omissionRate * 40;
  score -= m.commissionRate * 30;

  if (m.dPrime !== null) {
    if (m.dPrime < 0.5) score -= 20;
    else if (m.dPrime < 1) score -= 10;
    else if (m.dPrime < 1.5) score -= 5;
  } else if (m.omissionRate >= 1.0) {
    score -= 20;
  }

  if (m.meanOrganizationIndex !== null && m.meanOrganizationIndex < 40) score -= 5;
  if (m.meanSpatialAsymmetryIndex !== null && m.meanSpatialAsymmetryIndex > 50) score -= 5;
  return clamp(Math.round(score));
}

// ─── Subescala 1: Atenção Seletiva (Alvos vs Distratores) ────────────────────

function evaluateSelectiveAttention(m: VisualSearchMetrics): SubscaleResult {
  if (m.engagementStatus === 'insuficiente') {
    return { status: 'nao', severity: 'minimo', notes: 'Sessão insuficiente para avaliação.' };
  }

  const { omissionRate, commissionRate, dominantPattern } = m;
  const maxRate = Math.max(omissionRate, commissionRate);

  const severity: SubscaleSeverity =
    maxRate < 0.1 ? 'minimo' :
    maxRate < 0.2 ? 'leve' :
    maxRate < 0.3 ? 'moderado' : 'importante';

  if (dominantPattern === 'comissao' && commissionRate >= 0.2) {
    return {
      status: 'sim',
      severity,
      notes: `Alta taxa de cliques em distratores (${(commissionRate * 100).toFixed(0)}%).`
    };
  }

  if (dominantPattern === 'misto' && commissionRate >= 0.2) {
    return {
      status: 'sim',
      severity,
      notes: `Padrão misto: comissão ${(commissionRate * 100).toFixed(0)}%, omissão ${(omissionRate * 100).toFixed(0)}%.`
    };
  }

  if (
    dominantPattern === 'omissao' ||
    dominantPattern === 'tendencia_comissao' ||
    dominantPattern === 'tendencia_omissao' ||
    (dominantPattern === 'misto' && commissionRate < 0.2)
  ) {
    return {
      status: 'parcial',
      severity,
      notes:
        dominantPattern === 'omissao'
          ? `Muitos alvos perdidos (${(omissionRate * 100).toFixed(0)}%), sem excesso de erros em distratores.`
          : `Tendência leve: omissão ${(omissionRate * 100).toFixed(0)}%, comissão ${(commissionRate * 100).toFixed(0)}%.`
    };
  }

  return {
    status: 'nao',
    severity: 'minimo',
    notes: 'Filtro de distratores adequado.'
  };
}

// ─── Subescala 2: Organização da Varredura Visual ───────────────────────────

function evaluateVisualScanning(m: VisualSearchMetrics): SubscaleResult {
  if (m.engagementStatus === 'insuficiente') {
    return { status: 'nao', severity: 'minimo', notes: 'Sessão insuficiente para avaliação.' };
  }

  const orgIndex = m.meanOrganizationIndex;

  if (orgIndex === null) {
    return { status: 'nao', severity: 'minimo', notes: 'Dados de varredura não disponíveis.' };
  }

  if (orgIndex >= 70) {
    return { status: 'nao', severity: 'minimo', notes: `Varredura organizada (índice ${orgIndex.toFixed(0)}).` };
  }

  if (orgIndex >= 40) {
    return {
      status: 'parcial',
      severity: 'leve',
      notes: `Varredura parcialmente organizada (índice ${orgIndex.toFixed(0)}).`
    };
  }

  return {
    status: 'sim',
    severity: orgIndex < 20 ? 'importante' : 'moderado',
    notes: `Varredura predominantemente errática (índice ${orgIndex.toFixed(0)}).`
  };
}

// ─── Subescala 3: Assimetria Espacial ──────────────────────────────────────

function evaluateSpatialAsymmetry(m: VisualSearchMetrics): SubscaleResult {
  if (m.engagementStatus === 'insuficiente') {
    return { status: 'nao', severity: 'minimo', notes: 'Sessão insuficiente para avaliação.' };
  }

  const asymIdx = m.meanSpatialAsymmetryIndex;
  const leftMisses = m.totalLeftMisses ?? 0;
  const rightMisses = m.totalRightMisses ?? 0;
  const totalMisses = leftMisses + rightMisses;

  if (asymIdx === null) {
    return { status: 'nao', severity: 'minimo', notes: 'Dados de assimetria não disponíveis.' };
  }

  const lateralizedMisses = totalMisses > 0 &&
    (leftMisses / Math.max(totalMisses, 1) >= 0.7 ||
     rightMisses / Math.max(totalMisses, 1) >= 0.7);

  if (asymIdx > 50 || lateralizedMisses) {
    const side = leftMisses > rightMisses ? 'esquerdo' : 'direito';
    return {
      status: 'sim',
      severity: asymIdx > 70 ? 'importante' : 'moderado',
      notes: `Predomínio de perda de alvos no lado ${side} (assimetria ${asymIdx.toFixed(0)}).`
    };
  }

  if (asymIdx > 25) {
    return {
      status: 'parcial',
      severity: 'leve',
      notes: `Leve tendência de assimetria espacial (assimetria ${asymIdx.toFixed(0)}).`
    };
  }

  return {
    status: 'nao',
    severity: 'minimo',
    notes: 'Distribuição espacial equilibrada.'
  };
}

// ─── Subescala 4: Velocidade e Consistência de Resposta ───────────────────────

function evaluateSpeedConsistency(m: VisualSearchMetrics): SubscaleResult {
  if (m.engagementStatus === 'insuficiente') {
    return { status: 'nao', severity: 'minimo', notes: 'Sessão insuficiente para avaliação.' };
  }

  const meanRT = m.meanReactionTimeMs;
  const stdDev = m.reactionTimeStdDev;

  if (meanRT === null) {
    return { status: 'nao', severity: 'minimo', notes: 'Dados de tempo não disponíveis.' };
  }

  const cv = stdDev !== null ? stdDev / meanRT : null;
  const slow = meanRT > 4000;
  const inconsistent = cv !== null && cv > 0.5;

  if (slow && inconsistent) {
    return {
      status: 'sim',
      severity: meanRT > 6000 ? 'importante' : 'moderado',
      notes: `Resposta lenta (média ${(meanRT / 1000).toFixed(1)}s) e irregular (CV ${cv!.toFixed(2)}).`
    };
  }

  if (slow || inconsistent) {
    return {
      status: 'parcial',
      severity: 'leve',
      notes: slow
        ? `Tempo de resposta elevado (média ${(meanRT / 1000).toFixed(1)}s).`
        : `Variação irregular no ritmo de resposta (CV ${cv!.toFixed(2)}).`
    };
  }

  return {
    status: 'nao',
    severity: 'minimo',
    notes: `Tempo de resposta adequado (média ${(meanRT / 1000).toFixed(1)}s).`
  };
}

// ─── Resposta global ───────────────────────────────────────────────────────────

function resolveGlobalAnswer(
  sa: SubscaleResult
): 'sim' | 'parcial' | 'nao' | 'insuficiente' {
  if (sa.notes === 'Sessão insuficiente para avaliação.') return 'insuficiente';
  return sa.status;
}

function getMarkerLabel(score: number): string {
  if (score >= 80) return 'Super Águia';
  if (score >= 60) return 'Águia Atenta';
  if (score >= 40) return 'Águia em Ajuste';
  if (score >= 20) return 'Águia Confusa';
  return 'Águia Cega';
}

// Retorna texto condizente com as taxas reais, não apenas com o score numérico
function getShortDescription(score: number, m: VisualSearchMetrics): string {
  const { omissionRate, commissionRate } = m;
  if (omissionRate >= 0.4 && commissionRate >= 0.25)
    return 'Há dificuldade relevante para identificar alvos e filtrar distratores.';
  if (omissionRate >= 0.4)
    return 'Há perda expressiva de alvos ao longo da sessão.';
  if (commissionRate >= 0.25)
    return 'Há tendência relevante de cliques impulsivos em distratores.';
  if (score >= 80) return 'Ótimo filtro visual entre alvo e distratores.';
  if (score >= 60) return 'Boa capacidade de filtrar, com pequenas oscilações.';
  if (score >= 40) return 'Há instabilidade moderada na filtragem visual.';
  if (score >= 20) return 'Há dificuldade importante para separar alvo e distratores.';
  return 'Há forte dificuldade para manter o foco no alvo visual.';
}

function getClinicalMeaning(score: number, m: VisualSearchMetrics): string {
  const { omissionRate, commissionRate } = m;
  if (omissionRate >= 0.4 && commissionRate >= 0.25)
    return 'Sugere comprometimento da atenção seletiva, com dificuldade tanto para localizar alvos quanto para inibir respostas a distratores.';
  if (omissionRate >= 0.4)
    return 'Sugere dificuldade de rastreio visual ou lentidão no processamento, com muitos alvos não identificados.';
  if (commissionRate >= 0.25)
    return 'Sugere prejuízo no controle inibitório, com tendência a responder a estímulos irrelevantes.';
  if (score >= 80) return 'Sugere atenção seletiva preservada e boa inibição de respostas impulsivas.';
  if (score >= 60) return 'Sugere atenção seletiva funcional, com oscilações leves diante de estímulos competitivos.';
  if (score >= 40) return 'Sugere dificuldade moderada para sustentar o filtro atencional ao longo da tarefa.';
  if (score >= 20) return 'Sugere prejuízo importante no controle inibitório e na seleção visual do alvo.';
  return 'Sugere prejuízo acentuado na discriminação de estímulos relevantes e no controle da resposta.';
}

// ─── Função principal ──────────────────────────────────────────────────────────

export function buildVisualSearchScaleResult(
  session: VisualSearchSessionMetricsInput
): VisualSearchScaleResult {
  const m = calculateVisualSearchMetrics(session);

  const selectiveAttention = evaluateSelectiveAttention(m);
  const visualScanning = evaluateVisualScanning(m);
  const spatialAsymmetry = evaluateSpatialAsymmetry(m);
  const speedConsistency = evaluateSpeedConsistency(m);

  const score = calculateEagleScore(m);
  const answer = resolveGlobalAnswer(selectiveAttention);

  return {
    scaleName: 'Olho de Águia',
    clinicalName: 'Controle Inibitório e Atenção Seletiva',
    score,
    positionPercent: score,
    leftLabel: 'Águia Cega',
    rightLabel: 'Super Águia',
    markerLabel: getMarkerLabel(score),
    emoji: '\uD83E\uDD85',
    colorToken: score >= 60 ? 'success' : score >= 40 ? 'warning' : 'danger',
    engagementStatus: m.engagementStatus,
    answer,
    dominantPattern: m.dominantPattern,
    dPrimeBand: m.dPrimeBand,
    subscales: {
      selectiveAttention,
      visualScanning,
      spatialAsymmetry,
      speedConsistency
    },
    shortDescription: getShortDescription(score, m),
    clinicalMeaning: getClinicalMeaning(score, m),
    summary:
      `${score}/100 na régua Olho de Águia. ` +
      `Omissões ${(m.omissionRate * 100).toFixed(0)}% | ` +
      `Comissões ${(m.commissionRate * 100).toFixed(0)}% | ` +
      `Organização ${m.meanOrganizationIndex !== null ? m.meanOrganizationIndex.toFixed(0) : 'N/A'} | ` +
      `Assimetria ${m.meanSpatialAsymmetryIndex !== null ? m.meanSpatialAsymmetryIndex.toFixed(0) : 'N/A'}.`
  };
}
