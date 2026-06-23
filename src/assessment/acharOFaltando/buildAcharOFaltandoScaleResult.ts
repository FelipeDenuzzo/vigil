// src/assessment/acharOFaltando/buildAcharOFaltandoScaleResult.ts
import { AcharOFaltandoMetrics, AcharOFaltandoScaleResult } from './types';
import { ACHAR_O_FALTANDO_SCALE } from './acharOFaltandoScaleDefinitions';

/**
 * Aplica os limites científicos e gera o score global e o nível de severidade clínica.
 */
export function buildAcharOFaltandoScaleResult(
  metrics: AcharOFaltandoMetrics
): AcharOFaltandoScaleResult {
  const { totalCorrectRounds, roundsPlayed, averageResponseMs, totalOmissions } = metrics;
  
  if (totalOmissions === roundsPlayed || roundsPlayed === 0) {
    return {
      score: 0,
      level: 'importante',
      accuracyNote: 'A sessão não foi respondida (100% de omissão).',
      speedNote: 'Sem tempo de resposta disponível devido à ausência de cliques.',
    };
  }

  const accuracyRate = totalCorrectRounds / roundsPlayed;

  // Pontuação de 0 a 100 baseada principalmente na taxa de acerto das rodadas
  const score = Math.round(accuracyRate * 100);

  let level: 'mínimo' | 'leve' | 'moderado' | 'importante';
  const scale = ACHAR_O_FALTANDO_SCALE.accuracyRate;

  if (accuracyRate >= scale.excellent) {
    level = 'mínimo';
  } else if (accuracyRate >= scale.good) {
    level = 'leve';
  } else if (accuracyRate >= scale.regular) {
    level = 'moderado';
  } else {
    level = 'importante';
  }

  let accuracyNote = '';
  if (accuracyRate >= scale.excellent) {
    accuracyNote = 'Precisão excelente. Capacidade impecável de escanear grades visuais e identificar diferenças.';
  } else if (accuracyRate >= scale.good) {
    accuracyNote = 'Precisão satisfatória. Consegue focar e achar os itens modificados na maior parte das rodadas.';
  } else if (accuracyRate >= scale.regular) {
    accuracyNote = 'Precisão intermediária. Apresentou algumas falhas de varredura ou cliques precipitados em distratores.';
  } else {
    accuracyNote = 'Precisão baixa. Dificuldade marcante em focar e discriminar diferenças nas imagens.';
  }

  let speedNote = '';
  const rtScale = ACHAR_O_FALTANDO_SCALE.responseTime;
  if (averageResponseMs <= rtScale.fast) {
    speedNote = 'Velocidade de processamento visual muito rápida.';
  } else if (averageResponseMs <= rtScale.adequate) {
    speedNote = 'Velocidade de processamento adequada.';
  } else {
    speedNote = 'Velocidade notavelmente lenta ou com tempo de busca prolongado.';
  }

  return {
    score,
    level,
    accuracyNote,
    speedNote,
  };
}
