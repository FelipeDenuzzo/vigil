import { SalaDeVigiliaMetrics } from './types';

// TODO: A equipe científica deve preencher estas faixas de corte
// com base nos artigos de referência do paradigma CPT / Mackworth Clock.

export function getOmissionSeverity(omissions: number): 'normal' | 'mild' | 'moderate' | 'severe' {
  // TODO: Definir cortes científicos
  if (omissions === 0) return 'normal';
  if (omissions <= 2) return 'mild';
  if (omissions <= 5) return 'moderate';
  return 'severe';
}

export function getCommissionSeverity(commissions: number): 'normal' | 'mild' | 'moderate' | 'severe' {
  // TODO: Definir cortes científicos
  if (commissions === 0) return 'normal';
  if (commissions <= 2) return 'mild';
  if (commissions <= 5) return 'moderate';
  return 'severe';
}

export function getVigilanceDecrementSeverity(vigilanceDecrement: number): 'none' | 'mild' | 'moderate' | 'severe' {
  // vigilanceDecrement = block1HitRate - block2HitRate (positivo = piora)
  // TODO: Definir cortes científicos
  if (vigilanceDecrement <= 0) return 'none';
  if (vigilanceDecrement <= 0.1) return 'mild';
  if (vigilanceDecrement <= 0.2) return 'moderate';
  return 'severe';
}

export function getRtVariabilitySeverity(sdRT: number): 'low' | 'moderate' | 'high' {
  // TODO: Definir cortes científicos
  if (sdRT < 100) return 'low';
  if (sdRT < 200) return 'moderate';
  return 'high';
}
