// src/assessment/acharOFaltando/buildAcharOFaltandoTechnicalReport.ts
import { AcharOFaltandoMetrics, AcharOFaltandoScaleResult } from './types';

export interface AcharOFaltandoEvaluatorInput {
  attentionType: 'seletiva';
  game: 'achar-o-faltando';
  sessionId: string;
  severity?: 'minimo' | 'leve' | 'moderado' | 'importante';
  totalRounds?: number;
  totalHits?: number;
  totalOmissions?: number;
  totalFalsePositives?: number;
  totalCorrectRounds?: number;
  accuracyPerMinute?: number;
  averageResponseMs?: number;
  accuracyNote?: string;
  speedNote?: string;
  speedStyle?: 'efficient' | 'impulsive' | 'slow' | 'disorganized';
  hasFatigue?: boolean;
  leftOmissions?: number;
  rightOmissions?: number;
  asymmetryRatio?: number;
  spatialAsymmetryDominant?: 'left' | 'right' | 'symmetric' | 'insufficient-data';
  phaseMetrics?: Array<{
    phase: number;
    phaseLabel: string;
    roundsInPhase: number;
    hits: number;
    omissions: number;
    falsePositives: number;
    rtMean: number;
    rtSdrt: number;
    dPrime: number;
    postErrorSlowing: number | null;
  }>;
  flagImpulsividade?: boolean;
  flagLentificacao?: boolean;
  flagSwitchCost?: boolean;
  flagFadigaAtencional?: boolean;
  firstHalfRtMean?: number;
  secondHalfRtMean?: number;
  firstHalfSdrt?: number;
  secondHalfSdrt?: number;
}

/**
 * Constrói o log estruturado pronto para ser enviado ao Gemini.
 */
export function buildAcharOFaltandoTechnicalReport(
  sessionId: string,
  metrics: AcharOFaltandoMetrics,
  scaleResult: AcharOFaltandoScaleResult
): AcharOFaltandoEvaluatorInput {
  let rawSeverity: 'minimo' | 'leve' | 'moderado' | 'importante' = 'minimo';
  if (scaleResult.level === 'mínimo') {
    rawSeverity = 'minimo';
  } else {
    rawSeverity = scaleResult.level;
  }

  return {
    attentionType: 'seletiva',
    game: 'achar-o-faltando',
    sessionId,
    severity: rawSeverity,
    totalRounds: metrics.roundsPlayed,
    totalHits: metrics.totalHits,
    totalOmissions: metrics.totalOmissions,
    totalFalsePositives: metrics.totalFalsePositives,
    totalCorrectRounds: metrics.totalCorrectRounds,
    accuracyPerMinute: Number(metrics.accuracyPerMinute.toFixed(2)),
    averageResponseMs: Math.round(metrics.averageResponseMs),
    accuracyNote: scaleResult.accuracyNote,
    speedNote: scaleResult.speedNote,
    speedStyle: metrics.speedStyle,
    hasFatigue: metrics.hasFatigue,
    leftOmissions: metrics.spatialAsymmetry.leftOmissions,
    rightOmissions: metrics.spatialAsymmetry.rightOmissions,
    asymmetryRatio: Number(metrics.spatialAsymmetry.asymmetryRatio.toFixed(2)),
    spatialAsymmetryDominant: metrics.spatialAsymmetry.dominant,
    
    // Novas métricas avançadas
    phaseMetrics: metrics.phaseMetrics.map(pm => ({
      phase: pm.phase,
      phaseLabel: pm.phaseLabel,
      roundsInPhase: pm.roundsInPhase,
      hits: pm.hits,
      omissions: pm.omissions,
      falsePositives: pm.falsePositives,
      rtMean: Math.round(pm.rtMean),
      rtSdrt: Math.round(pm.rtSdrt),
      dPrime: Number(pm.dPrime.toFixed(3)),
      postErrorSlowing: pm.postErrorSlowing !== null ? Math.round(pm.postErrorSlowing) : null,
    })),
    flagImpulsividade: metrics.flagImpulsividade,
    flagLentificacao: metrics.flagLentificacao,
    flagSwitchCost: metrics.flagSwitchCost,
    flagFadigaAtencional: metrics.flagFadigaAtencional,
    firstHalfRtMean: Math.round(metrics.firstHalfRtMean),
    secondHalfRtMean: Math.round(metrics.secondHalfRtMean),
    firstHalfSdrt: Math.round(metrics.firstHalfSdrt),
    secondHalfSdrt: Math.round(metrics.secondHalfSdrt),
  };
}
