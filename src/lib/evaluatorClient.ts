// src/lib/evaluatorClient.ts

import type {
  VisualSearchTechnicalReport,
  VisualSearchMetrics,
} from '../attentions/selective/games/VisualSearchHunt/assessment/visualSearchScale.types';
import { auth } from './firebase';

// ── Tipos de entrada ───────────────────────────────────────────────────────────────
export interface EvaluatorInput {
  sessionId: string;
  attentionType: 'seletiva' | 'sustentada' | 'alternada' | 'dividida' | 'onboarding';
  severity?: 'minimo' | 'leve' | 'moderado' | 'importante';
  [key: string]: any;
  game?: 'visual-search' | 'color-shape' | 'cofre-mental' | 'long-mazes' | 'escuta-seletiva' | 'achar-o-faltando';
  roundCount?: number;
  totalClicks?: number;
  totalHits?: number;
  totalTargets?: number;
  totalMissedTargets?: number;
  commissionRate?: number;
  omissionRate?: number;
  dPrime?: number | null;
  meanReactionTimeMs?: number | null;
  reactionTimeStdDev?: number | null;
  meanOrganizationIndex?: number | null;
  predominantScanPattern?: string | null;
  dominantErrorAttribute?: 'forma' | 'cor' | 'duplo' | 'indeterminado';
  problemRegion?: 'esquerda' | 'direita' | 'centro' | 'distribuido' | 'indeterminado';
  spatialNeglect?: boolean;
  errorProfile?: {
    shapeErrors: number;
    colorErrors: number;
    doubleErrors: number;
    shapeErrorRate: number;
    colorErrorRate: number;
    doubleErrorRate: number;
  };
  spatialProfile?: {
    byQuadrant: Record<string, { hits: number; errors: number; errorRate: number }>;
    spatialNeglectSide: string;
    leftMisses: number;
    rightMisses: number;
  };

  completedPhases?: number;
  totalPhases?: number;
  avgEfficiencyPct?: number;
  totalRevisits?: number;
  totalDeadEndEntries?: number;
  totalLongStops?: number;
  avgPostErrorPauseMs?: number;
  phaseDetail?: {
    levelId: number;
    success: boolean;
    efficiencyPct: number;
    revisits: number;
    deadEndEntries: number;
    longStops: number;
    postErrorPauseMs: number;
    elapsedSec: number;
  }[];
}

// ── Tipos de retorno ───────────────────────────────────────────────────────────────
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

export interface OnboardingReport {
  mensagem_ux: {
    titulo: string;
    paragrafo_boas_vindas: string;
    superpoder: string;
    foco_de_treino: string;
  };
  dados_grafico_teia: {
    "Agilidade Mental": number;
    "Foco Contínuo": number;
    "Controle e Calma": number;
    "Organização Visual": number;
  };
}

interface RawEvaluatorResponse {
  score: number;
  severity: string;
  report: {
    ludic: LudicReport;
    general: GeneralReport;
    clinical: ClinicalReport;
  };
}

// ── Helpers internos ─────────────────────────────────────────────────────────────────────
const VALID_LEVELS: EvaluationReport['level'][] = ['mínimo', 'leve', 'moderado', 'importante'];

function parseSeverity(raw: string): EvaluationReport['level'] {
  if ((VALID_LEVELS as string[]).includes(raw)) return raw as EvaluationReport['level'];
  return 'leve';
}

function inferDominantErrorAttribute(
  m: VisualSearchMetrics
): NonNullable<EvaluatorInput['dominantErrorAttribute']> {
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
): NonNullable<EvaluatorInput['problemRegion']> {
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

// ── Mapeamento principal (seletiva) ──────────────────────────────────────────────────────
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
  const byQuadrant: NonNullable<EvaluatorInput['spatialProfile']>['byQuadrant'] =
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

// ── Chamada ao Cloud Run ───────────────────────────────────────────────────────────────────────────
export async function callEvaluator(
  input: EvaluatorInput
): Promise<EvaluationReport | null> {
  const url    = import.meta.env.VITE_EVALUATOR_URL;
  const secret = import.meta.env.VITE_EVALUATOR_SECRET;

  if (!url || !secret) {
    if (import.meta.env.DEV) console.warn('[callEvaluator] VITE_EVALUATOR_URL ou VITE_EVALUATOR_SECRET não configurados');
    return null;
  }

  try {
    const res = await fetch(`${url}/evaluate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-evaluator-secret': secret,
      },
      body: JSON.stringify({ ...input, uid: auth.currentUser?.uid }),
      signal: AbortSignal.timeout(45_000),
    });

    if (!res.ok) {
      if (import.meta.env.DEV) {
        const text = await res.text();
        console.error(`[callEvaluator] HTTP ${res.status}: ${text}`);
      }
      return null;
    }

    const raw = await res.json() as RawEvaluatorResponse;

    return {
      score:    raw.score,
      level:    parseSeverity(raw.severity),
      ludic:    raw.report.ludic,
      general:  raw.report.general,
      clinical: raw.report.clinical,
    };
  } catch (err) {
    if (import.meta.env.DEV) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[callEvaluator] erro:', msg);
    }
    return null;
  }
}

export async function callOnboardingEvaluator(
  input: EvaluatorInput
): Promise<OnboardingReport | null> {
  const url    = import.meta.env.VITE_EVALUATOR_URL;
  const secret = import.meta.env.VITE_EVALUATOR_SECRET;

  if (!url || !secret) {
    if (import.meta.env.DEV) console.warn('[callOnboardingEvaluator] config ausente');
    return null;
  }

  try {
    const res = await fetch(`${url}/evaluate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-evaluator-secret': secret,
      },
      body: JSON.stringify({ ...input, uid: auth.currentUser?.uid }),
      signal: AbortSignal.timeout(45_000),
    });

    if (!res.ok) {
      if (import.meta.env.DEV) {
        const text = await res.text();
        console.error(`[callOnboardingEvaluator] HTTP ${res.status}: ${text}`);
      }
      return null;
    }

    // Retorna direto pois o payload bate 1:1 com a interface
    return await res.json() as OnboardingReport;
  } catch (err) {
    if (import.meta.env.DEV) console.error('[callOnboardingEvaluator] erro:', err);
    return null;
  }
}
