// src/lib/evaluatorClient.ts
// Atualizado: campos temporais e progressão por round adicionados ao EvaluatorInput

import type {
  VisualSearchTechnicalReport,
  VisualSearchMetrics,
} from '../attentions/selective/games/VisualSearchHunt/assessment/visualSearchScale.types';

// ─── Tipo de progressão por round ─────────────────────────────────────────────
export interface EvaluatorRoundProgression {
  round: number;
  commissionRate: number;
  avgRtMs: number | null;
  omissionRate?: number;
  organizationIndex?: number;
  scanPattern?: 'row-wise' | 'column-wise' | 'mixed' | 'chaotic';
}

// ─── Tipos de entrada ─────────────────────────────────────────────────────────
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
  // ─── Campos temporais e de progressão (opcionais) ────────────────────────
  avgRtMs?: number;
  ies?: number;
  searchStrategy?: 'organizado' | 'caotico' | 'indeterminado';
  roundProgression?: EvaluatorRoundProgression[];
}

// ─── Tipos de retorno — 3 níveis ───────────────────────────────────────────
export interface LudicReport {
  score: number;
  label: string;
  emoji: string;
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

// ─── Tipo raw retornado pelo Cloud Run ───────────────────────────────────────
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

/**
 * Mapeia o predominantScanPattern de VisualSearchMetrics (que não inclui 'chaotic')
 * para o union type do EvaluatorRoundProgression, que inclui 'chaotic'.
 * O valor 'chaotic' pode surgir por round individualmente mas não no agregado.
 */
function mapScanPattern(
  p: string | null | undefined
): EvaluatorRoundProgression['scanPattern'] {
  if (p === 'row-wise' || p === 'column-wise' || p === 'mixed') return p;
  return undefined;
}

/**
 * IES (Inverse Efficiency Score) = meanRT / accuracyRate.
 * Quanto menor, mais eficiente (rápido E preciso).
 * Retorna undefined se não houver RT ou se accuracyRate = 0.
 */
function calcIES(meanRtMs: number | null, accuracyRate: number): number | undefined {
  if (!meanRtMs || accuracyRate <= 0) return undefined;
  return Math.round(meanRtMs / accuracyRate);
}

/**
 * Infere a estratégia de varredura com base no organizationIndex médio
 * e no predominantScanPattern da sessão.
 */
function inferSearchStrategy(
  m: VisualSearchMetrics
): EvaluatorInput['searchStrategy'] {
  const orgIdx = m.meanOrganizationIndex;
  const pattern = m.predominantScanPattern;
  if (orgIdx === null && pattern === null) return 'indeterminado';
  const isOrganized =
    (pattern === 'row-wise' || pattern === 'column-wise') ||
    (orgIdx !== null && orgIdx >= 50);
  return isOrganized ? 'organizado' : 'caotico';
}

// ─── Mapeamento principal ───────────────────────────────────────────────────────
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

  // ─── Progressão por round ────────────────────────────────────────────────
  const roundProgression: EvaluatorRoundProgression[] = (metrics.rounds ?? []).map((r) => ({
    round: r.round,
    commissionRate: r.commissionRate,
    avgRtMs: r.meanReactionTimeMs ?? null,
    omissionRate: r.omissionRate,
    organizationIndex: r.organizationIndex,
    scanPattern: mapScanPattern(r.scanPattern),
  }));

  // ─── Média de RT e IES da sessão ──────────────────────────────────────────
  const avgRtMs = metrics.meanReactionTimeMs !== null
    ? Math.round(metrics.meanReactionTimeMs)
    : undefined;
  const ies = calcIES(metrics.meanReactionTimeMs, metrics.accuracyRate);

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
    // ─── Campos temporais e de progressão ──────────────────────────────────
    ...(avgRtMs !== undefined && { avgRtMs }),
    ...(ies     !== undefined && { ies }),
    searchStrategy: inferSearchStrategy(metrics),
    ...(roundProgression.length > 0 && { roundProgression }),
  };
}

// ─── Chamada ao Cloud Run ───────────────────────────────────────────────────────
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
