// src/lib/evaluatorClient.ts
// Atualizado: tipagem refletindo os 3 níveis do vigil-evaluator (ludic, general, clinical)

import type {
  VisualSearchTechnicalReport,
  VisualSearchMetrics,
} from '../attentions/selective/games/VisualSearchHunt/assessment/visualSearchScale.types';

// ─── Tipos de entrada ────────────────────────────────────────────────────────
export interface EvaluatorInput {
  game: 'visual-search';
  sessionId: string;
  attentionType: 'seletiva' | 'sustentada' | 'alternada' | 'dividida';
  roundCount: number;
  totalClicks: number;
  totalHits: number;
  totalTargets: number;
  totalMissedTargets?: number;
  commissionRate: number;
  omissionRate?: number;
  dPrime?: number | null;
  meanReactionTimeMs?: number | null;
  reactionTimeStdDev?: number | null;
  meanOrganizationIndex?: number | null;
  predominantScanPattern?: string | null;
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

// ─── Tipos de retorno — 3 níveis ─────────────────────────────────────────────
export interface LudicReport {
  score: number;    // 0-100
  label: string;   // ex: "Muito bom!"
  emoji: string;   // ex: "⭐"
}

export interface GeneralReport {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  recommendation: string;
}

export interface ClinicalReport {
  strengths: string[];
  weaknesses: string[];
  recommendation: string;
  clinicalNote: string;
}

export interface EvaluationReport {
  score: number;
  level: 'mínimo' | 'leve' | 'moderado' | 'importante';
  ludic: LudicReport;
  general: GeneralReport;
  clinical: ClinicalReport;
}

// ─── Tipo raw retornado pelo Cloud Run ────────────────────────────────────────
interface RawEvaluatorResponse {
  score: number;
  severity: string;
  report: {
    ludic: LudicReport;
    general: GeneralReport;
    clinical: ClinicalReport;
  };
}

// ─── Helpers internos ─────────────────────────────────────────────────────────

const VALID_LEVELS: EvaluationReport['level'][] = ['mínimo', 'leve', 'moderado', 'importante'];

function parseSeverity(raw: string): EvaluationReport['level'] {
  if ((VALID_LEVELS as string[]).includes(raw)) return raw as EvaluationReport['level'];
  console.warn(`[callEvaluator] severity inesperado do Cloud Run: "${raw}" — usando "leve" como fallback`);
  return 'leve';
}

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

function inferSpatialNeglect(m: VisualSearchMetrics): boolean {
  const left  = m.totalLeftMisses  ?? 0;
  const right = m.totalRightMisses ?? 0;
  const total = left + right;
  if (total < 3) return false;
  return left / total >= 0.75 || right / total >= 0.75;
}

function inferNeglectSide(m: VisualSearchMetrics): string {
  const left  = m.totalLeftMisses  ?? 0;
  const right = m.totalRightMisses ?? 0;
  if (left === 0 && right === 0) return 'nenhum';
  return left > right ? 'esquerdo' : 'direito';
}

// ─── Mapeamento principal ─────────────────────────────────────────────────────
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

  const totalErrors = metrics.totalErrors;
  const shapeErrors  = Math.round(shapeErrorRate  * totalErrors);
  const colorErrors  = Math.round(colorErrorRate  * totalErrors);
  const doubleErrors = Math.round(doubleErrorRate * totalErrors);

  const rawQuadrant = metrics.quadrantErrorMap ?? {};
  const byQuadrant: EvaluatorInput['spatialProfile']['byQuadrant'] =
    Object.fromEntries(
      Object.entries(rawQuadrant).map(([k, errorCount]) => [
        k,
        {
          hits: 0,
          errors: errorCount,
          errorRate: totalErrors > 0 ? errorCount / totalErrors : 0,
        },
      ])
    );

  return {
    game: 'visual-search',
    sessionId,
    attentionType: 'seletiva',
    roundCount,
    totalClicks,
    totalHits: metrics.totalHits,
    totalTargets: metrics.totalTargets,
    totalMissedTargets: metrics.totalMissedTargets,
    commissionRate: metrics.commissionRate,
    omissionRate: metrics.omissionRate,
    dPrime: metrics.dPrime,
    meanReactionTimeMs: metrics.meanReactionTimeMs,
    reactionTimeStdDev: metrics.reactionTimeStdDev,
    meanOrganizationIndex: metrics.meanOrganizationIndex,
    predominantScanPattern: metrics.predominantScanPattern,
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
): Promise<EvaluationReport | null> {
  const url    = import.meta.env.VITE_EVALUATOR_URL;
  const secret = import.meta.env.VITE_EVALUATOR_SECRET;
  
  if (!url || !secret) {
    console.warn('[callEvaluator] VITE_EVALUATOR_URL ou VITE_EVALUATOR_SECRET não configurados');
    return null;
  }

  try {
    console.log('[callEvaluator] chamando', url);
    const res = await fetch(`${url}/evaluate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-evaluator-secret': secret,
      },
      body: JSON.stringify(input),
      signal: AbortSignal.timeout(45_000),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(`[callEvaluator] HTTP ${res.status}: ${text}`);
      return null;
    }

    const raw = await res.json() as RawEvaluatorResponse;

    const report: EvaluationReport = {
      score:    raw.score,
      level:    parseSeverity(raw.severity),
      ludic:    raw.report.ludic,
      general:  raw.report.general,
      clinical: raw.report.clinical,
    };

    console.log('[callEvaluator] sucesso', report);
    return report;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[callEvaluator] erro:', msg);
    return null;
  }
}
