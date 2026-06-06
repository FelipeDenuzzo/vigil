// src/lib/evaluatorClient.ts
// Etapa 3.5 — cliente do vigil-evaluator (Cloud Run + Gemini)
// Recebe as métricas já calculadas e retorna o laudo enriquecido.
// Se a URL não estiver configurada ou a chamada falhar, retorna null
// e o laudo local continua funcionando normalmente.

import type { VisualSearchTechnicalReport } from "../attentions/selective/games/VisualSearchHunt/assessment/visualSearchScale.types";

// ─── Tipos espelhados do vigil-evaluator ─────────────────────────────────────
// (mäntidos locais para não criar dependência de pacote)
export interface EvaluatorInput {
  sessionId: string;
  attentionType: 'seletiva' | 'sustentada' | 'alternada' | 'dividida';
  roundCount: number;
  totalClicks: number;
  commissionRate: number;
  dominantErrorAttribute: 'forma' | 'cor' | 'duplo' | 'indeterminado';
  problemRegion: 'esquerda' | 'direita' | 'centro' | 'distribuido' | 'indeterminado';
  spatialNeglect: boolean;
  severity: 'minimo' | 'leve' | 'moderado' | 'importante';
  errorProfile: {
    shapeErrors: number;
    colorErrors: number;
    doubleErrors: number;
    shapeErrorRate: number;
    colorErrorRate: number;
    doubleErrorRate: number;
  };
  spatialProfile: {
    byQuadrant: Record<string, { hits: number; errors: number; errorRate: number }>;
    spatialNeglectSide: string;
    leftMisses: number;
    rightMisses: number;
  };
}

export interface EnrichedReport {
  score: number;
  level: 'mínimo' | 'leve' | 'moderado' | 'importante';
  strengths: string[];
  weaknesses: string[];
  recommendation: string;
  clinicalNote: string;
}

// ─── Mapeamento: VisualSearchTechnicalReport → EvaluatorInput ────────────────
export function buildEvaluatorInput(
  sessionId: string,
  report: VisualSearchTechnicalReport,
  roundCount: number,
  totalClicks: number
): EvaluatorInput {
  const ep = report.errorProfile;
  const sp = report.spatialProfile;

  // Taxa de comissão: erros / total de cliques
  const commissionRate = totalClicks > 0
    ? (ep.shapeErrors + ep.colorErrors + ep.doubleErrors) / totalClicks
    : 0;

  return {
    sessionId,
    attentionType: 'seletiva',
    roundCount,
    totalClicks,
    commissionRate,
    dominantErrorAttribute: report.dominantErrorAttribute ?? 'indeterminado',
    problemRegion: report.problemRegion ?? 'indeterminado',
    spatialNeglect: report.spatialNeglect ?? false,
    severity: report.severity,
    errorProfile: {
      shapeErrors: ep.shapeErrors,
      colorErrors: ep.colorErrors,
      doubleErrors: ep.doubleErrors,
      shapeErrorRate: ep.shapeErrorRate,
      colorErrorRate: ep.colorErrorRate,
      doubleErrorRate: ep.doubleErrorRate,
    },
    spatialProfile: {
      byQuadrant: sp.byQuadrant ?? {},
      spatialNeglectSide: sp.spatialNeglectSide ?? 'nenhum',
      leftMisses: sp.leftMisses ?? 0,
      rightMisses: sp.rightMisses ?? 0,
    },
  };
}

// ─── Chamada ao Cloud Run ─────────────────────────────────────────────────────
export async function callEvaluator(
  input: EvaluatorInput
): Promise<EnrichedReport | null> {
  const url = import.meta.env.VITE_EVALUATOR_URL;
  if (!url) return null;

  try {
    const res = await fetch(`${url}/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
      signal: AbortSignal.timeout(10_000), // 10s timeout
    });
    if (!res.ok) return null;
    return res.json() as Promise<EnrichedReport>;
  } catch {
    return null;
  }
}
