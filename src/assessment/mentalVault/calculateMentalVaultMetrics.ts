// src/assessment/mentalVault/calculateMentalVaultMetrics.ts

import { RegistroRodada, TentativaFase2 } from '../../attentions/divided/games/MentalVault/types';
import { MentalVaultRoundMetrics, MentalVaultSessionMetrics } from './types';

/**
 * Calcula a proporção de letras corretas na posição exata (Absolute Recall).
 */
export function calculateAbsoluteRecall(target: string[], typed: string[]): number {
  if (target.length === 0) return 0;
  let correctCount = 0;
  for (let i = 0; i < target.length; i++) {
    if (typed[i] === target[i]) {
      correctCount++;
    }
  }
  return correctCount / target.length;
}

/**
 * Calcula a acurácia de dígitos (acertos / total apresentado).
 */
export function calculateDigitAccuracy(tentativas: TentativaFase2[]): number {
  if (tentativas.length === 0) return 0;
  const hits = tentativas.filter(t => t.acertou).length;
  return hits / tentativas.length;
}

/**
 * Calcula a média do tempo de reação apenas para respostas válidas (não omitidas).
 */
export function calculateDigitMeanRt(tentativas: TentativaFase2[]): number {
  const valid = tentativas.filter(t => t.respostaUsuario !== 'omissao');
  if (valid.length === 0) return 0;
  const sum = valid.reduce((acc, t) => acc + t.tempoReacaoMs, 0);
  return sum / valid.length;
}

/**
 * Calcula a taxa de precisão: acertos / (total de dígitos apresentados + erros de comissão).
 */
export function calculateDigitPrecisionRate(tentativas: TentativaFase2[]): number {
  const correct = tentativas.filter(t => t.acertou).length;
  const commission = tentativas.filter(t => t.tipoErro === 'comissao').length;
  const denominator = tentativas.length + commission;
  if (denominator === 0) return 0;
  return correct / denominator;
}

/**
 * Calcula o Inverse Efficiency Score (IES): tempo médio de reação / taxa de precisão.
 */
export function calculateDigitIes(meanRt: number, precisionRate: number): number {
  if (precisionRate === 0) return 0;
  return meanRt / precisionRate;
}

/**
 * Calcula as métricas detalhadas de uma rodada individual.
 */
export function calculateRoundMetrics(round: RegistroRodada): MentalVaultRoundMetrics {
  const absoluteRecall = calculateAbsoluteRecall(round.sequenciaAlvo, round.sequenciaDigitada);
  const digitAccuracy = calculateDigitAccuracy(round.tentativas);
  const digitCommissionErrors = round.tentativas.filter(t => t.tipoErro === 'comissao').length;
  const digitOmissions = round.tentativas.filter(t => t.tipoErro === 'omissao').length;
  const digitMeanRtMs = calculateDigitMeanRt(round.tentativas);
  const digitPrecisionRate = calculateDigitPrecisionRate(round.tentativas);
  
  const digitIesRaw = calculateDigitIes(digitMeanRtMs, digitPrecisionRate);
  const digitIes = Math.round(digitIesRaw * 100) / 100; // Arredonda para 2 casas decimais

  return {
    sequenciaAlvo: round.sequenciaAlvo,
    sequenciaDigitada: round.sequenciaDigitada,
    condicaoRodada: round.condicaoRodada,
    absoluteRecall: Math.round(absoluteRecall * 10000) / 10000,
    digitAccuracy: Math.round(digitAccuracy * 10000) / 10000,
    digitCommissionErrors,
    digitOmissions,
    digitMeanRtMs: Math.round(digitMeanRtMs * 100) / 100,
    digitPrecisionRate: Math.round(digitPrecisionRate * 10000) / 10000,
    digitIes,
  };
}

/**
 * Calcula as métricas consolidadas de uma sessão inteira de treino.
 */
export function calculateSessionMetrics(
  nivelMaximo: number,
  rodadas: RegistroRodada[]
): MentalVaultSessionMetrics {
  const totalRodadas = rodadas.length;
  const calculatedRounds = rodadas.map(calculateRoundMetrics);
  
  const puras = calculatedRounds.filter(r => r.condicaoRodada === 'pura');
  const mistas = calculatedRounds.filter(r => r.condicaoRodada === 'mista');
  
  const rodadasPuras = puras.length;
  const rodadasMistas = mistas.length;
  
  // Média de Absolute Recall
  const avgAbsoluteRecall = totalRodadas > 0 
    ? calculatedRounds.reduce((acc, r) => acc + r.absoluteRecall, 0) / totalRodadas
    : 0;
    
  const avgAbsoluteRecallPuras = rodadasPuras > 0
    ? puras.reduce((acc, r) => acc + r.absoluteRecall, 0) / rodadasPuras
    : 0;
    
  const avgAbsoluteRecallMistas = rodadasMistas > 0
    ? mistas.reduce((acc, r) => acc + r.absoluteRecall, 0) / rodadasMistas
    : 0;
    
  // Custo TBRS (TBRS Cost) da sessão:
  // Média do recall absoluto nas puras menos a média nas mistas
  const tbrsCost = avgAbsoluteRecallPuras - avgAbsoluteRecallMistas;
  
  // Acurácia de dígitos
  const avgDigitAccuracy = totalRodadas > 0
    ? calculatedRounds.reduce((acc, r) => acc + r.digitAccuracy, 0) / totalRodadas
    : 0;
    
  // Erros acumulados
  const totalCommissionErrors = calculatedRounds.reduce((acc, r) => acc + r.digitCommissionErrors, 0);
  const totalOmissions = calculatedRounds.reduce((acc, r) => acc + r.digitOmissions, 0);
  
  // Média do tempo de reação (apenas rodadas com RT válido)
  const roundsWithRt = calculatedRounds.filter(r => r.digitMeanRtMs > 0);
  const avgDigitMeanRtMs = roundsWithRt.length > 0
    ? roundsWithRt.reduce((acc, r) => acc + r.digitMeanRtMs, 0) / roundsWithRt.length
    : 0;
    
  // Média do IES (apenas rodadas com IES válido)
  const roundsWithIes = calculatedRounds.filter(r => r.digitIes > 0);
  const avgDigitIes = roundsWithIes.length > 0
    ? roundsWithIes.reduce((acc, r) => acc + r.digitIes, 0) / roundsWithIes.length
    : 0;

  return {
    totalRodadas,
    rodadasPuras,
    rodadasMistas,
    nivelMaximo,
    
    avgAbsoluteRecall: Math.round(avgAbsoluteRecall * 10000) / 10000,
    avgAbsoluteRecallPuras: Math.round(avgAbsoluteRecallPuras * 10000) / 10000,
    avgAbsoluteRecallMistas: Math.round(avgAbsoluteRecallMistas * 10000) / 10000,
    tbrsCost: Math.round(tbrsCost * 10000) / 10000,
    
    avgDigitAccuracy: Math.round(avgDigitAccuracy * 10000) / 10000,
    totalCommissionErrors,
    totalOmissions,
    avgDigitMeanRtMs: Math.round(avgDigitMeanRtMs * 100) / 100,
    avgDigitIes: Math.round(avgDigitIes * 100) / 100,
    
    rodadas: calculatedRounds,
  };
}


