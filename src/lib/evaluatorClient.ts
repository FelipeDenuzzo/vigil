// src/lib/evaluatorClient.ts
// Etapa 3.5 — cliente do vigil-evaluator (Cloud Run + Gemini)
//
// DIRETRIZ: antes de acessar qualquer campo de tipo externo, confirmar
// que o campo existe no tipo real (visualSearchScale.types.ts).
// Nunca assumir campos do plano — sempre verificar o tipo fonte.

import type {
  VisualSearchTechnicalReport,
  VisualSearchMetrics,
} from '../attentions/selective/games/VisualSearchHunt/assessment/visualSearchScale.types';

// ─── Tipos espelhados do vigil-evaluator ─────────────────────────────────────
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

// ─── Helpers internos ─────────────────────────────────────────────────────────

/**
 * Infere dominantErrorAttribute a partir das taxas de erro em VisualSearchMetrics.
 * shapeErrorRate/colorErrorRate/doubleErrorRate existem como campos opcionais
 * em VisualSearchMetrics (visualSearchScale.types.ts linha ~120).
 */
function inferDominantErrorAttribute(
  m: VisualSearchMetrics
): EvaluatorInput['dominantErrorAttribute'] {
  const shape  = m.shapeErrorRate  ?? 0;
  const color  = m.colorErrorRate  ?? 0;
  const double = m.doubleErrorRate ?? 0;
  if (shape === 0 && color === 0 && double === 0) return 'indeterminado';
  if (double >= shape && double >= color) return 'duplo';
  if (shape >= color) return 'forma';
  return 'cor';
}

/**
 * Infere problemRegion a partir dos misses laterais.
 * totalLeftMisses / totalRightMisses existem em VisualSearchMetrics.
 */
function inferProblemRegion(
  m: VisualSearchMetrics
): EvaluatorInput['problemRegion'] {
  const left  = m.totalLeftMisses  ?? 0;
  const right = m.totalRightMisses ?? 0;
  const total = left + right;
  if (total === 0) return 'indeterminado';
  const leftRatio  = left  / total;
  const rightRatio = right / total;
  if (leftRatio  >= 0.75) return 'esquerda';
  if (rightRatio >= 0.75) return 'direita';
  if (total < 3)          return 'indeterminado';
  return 'distribuido';
}

/**
 * Detecta negligência espacial: >= 3 misses totais com >= 75% concentrados
 * em um lado. Mesma lógica de resolveRedFlag no buildVisualSearchTechnicalReport.
 */
function inferSpatialNeglect(m: VisualSearchMetrics): boolean {
  const left  = m.totalLeftMisses  ?? 0;
  const right = m.totalRightMisses ?? 0;
  const total = left + right;
  if (total < 3) return false;
  return left / total >= 0.75 || right / total >= 0.75;
}

/**
 * Infere o lado dominante da negligência (para spatialProfile.spatialNeglectSide).
 */
function inferNeglectSide(m: VisualSearchMetrics): string {
  const left  = m.totalLeftMisses  ?? 0;
  const right = m.totalRightMisses ?? 0;
  if (left === 0 && right === 0) return 'nenhum';
  return left > right ? 'esquerdo' : 'direito';
}

// ─── Mapeamento principal ─────────────────────────────────────────────────────
/**
 * Converte VisualSearchMetrics + VisualSearchTechnicalReport → EvaluatorInput.
 *
 * Fonte de cada campo:
 *   severity          ← technicalReport.severity          (SubscaleSeverity)
 *   commissionRate    ← metrics.commissionRate             (number)
 *   shapeErrorRate    ← metrics.shapeErrorRate             (number | undefined)
 *   colorErrorRate    ← metrics.colorErrorRate             (number | undefined)
 *   doubleErrorRate   ← metrics.doubleErrorRate            (number | undefined)
 *   leftMisses        ← metrics.totalLeftMisses            (number | null)
 *   rightMisses       ← metrics.totalRightMisses           (number | null)
 *   byQuadrant        ← metrics.quadrantErrorMap           (Record | undefined)
 */
export function buildEvaluatorInput(
  sessionId: string,
  metrics: VisualSearchMetrics,
  technicalReport: VisualSearchTechnicalReport,
  roundCount: number,
  totalClicks: number
): EvaluatorInput {
  const shapeErrorRate  = metrics.shapeErrorRate  ?? 0;
  const colorErrorRate  = metrics.colorErrorRate  ?? 0;
  const doubleErrorRate = metrics.doubleErrorRate ?? 0;

  // shapeErrors/colorErrors/doubleErrors: reconstrói a contagem absoluta
  // a partir da taxa × total de erros (melhor estimativa disponível)
  const totalErrors = metrics.totalErrors;
  const shapeErrors  = Math.round(shapeErrorRate  * totalErrors);
  const colorErrors  = Math.round(colorErrorRate  * totalErrors);
  const doubleErrors = Math.round(doubleErrorRate * totalErrors);

  // byQuadrant: quadrantErrorMap existe em VisualSearchMetrics (opcional)
  // converte Record<string, number> → Record<string, {hits, errors, errorRate}>
  const rawQuadrant = metrics.quadrantErrorMap ?? {};
  const byQuadrant: EvaluatorInput['spatialProfile']['byQuadrant'] =
    Object.fromEntries(
      Object.entries(rawQuadrant).map(([k, errorCount]) => [
        k,
        {
          hits: 0,          // hits por quadrante não disponível em VisualSearchMetrics
          errors: errorCount,
          errorRate: totalErrors > 0 ? errorCount / totalErrors : 0,
        },
      ])
    );

  return {
    sessionId,
    attentionType: 'seletiva',
    roundCount,
    totalClicks,
    commissionRate: metrics.commissionRate,
    dominantErrorAttribute: inferDominantErrorAttribute(metrics),
    problemRegion: inferProblemRegion(metrics),
    spatialNeglect: inferSpatialNeglect(metrics),
    severity: technicalReport.severity,
    errorProfile: {
      shapeErrors,
      colorErrors,
      doubleErrors,
      shapeErrorRate,
      colorErrorRate,
      doubleErrorRate,
    },
    spatialProfile: {
      byQuadrant,
      spatialNeglectSide: inferNeglectSide(metrics),
      leftMisses:  metrics.totalLeftMisses  ?? 0,
      rightMisses: metrics.totalRightMisses ?? 0,
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
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return null;
    return res.json() as Promise<EnrichedReport>;
  } catch {
    return null;
  }
}
