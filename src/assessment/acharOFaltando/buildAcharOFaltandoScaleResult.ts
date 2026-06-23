// src/assessment/acharOFaltando/buildAcharOFaltandoScaleResult.ts
import { AcharOFaltandoMetrics, AcharOFaltandoScaleResult } from './types';

/**
 * Aplica os limites científicos e gera o score global e o nível de severidade clínica.
 */
export function buildAcharOFaltandoScaleResult(
  metrics: AcharOFaltandoMetrics
): AcharOFaltandoScaleResult {
  const {
    totalCorrectRounds,
    roundsPlayed,
    totalOmissions,
    totalFalsePositives,
    accuracyPerMinute,
    speedStyle,
    hasFatigue,
    spatialAsymmetry,
  } = metrics;
  
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

  // --- ÁRVORE DE DECISÃO DE SEVERIDADE ---
  let level: 'mínimo' | 'leve' | 'moderado' | 'importante';

  // 1. Severe (importante)
  if (
    accuracyPerMinute < 0.5 ||
    totalOmissions > roundsPlayed * 0.6 ||
    spatialAsymmetry.asymmetryRatio >= 0.8
  ) {
    level = 'importante';
  }
  // 2. Moderate (moderado)
  else if (
    accuracyPerMinute < 1.5 &&
    (totalFalsePositives > 2 || totalOmissions > 2) &&
    (speedStyle === 'disorganized' || hasFatigue === true)
  ) {
    level = 'moderado';
  }
  // 3. Minimal (mínimo)
  else if (
    accuracyPerMinute >= 3.0 &&
    totalFalsePositives <= 1 &&
    totalOmissions === 0 &&
    speedStyle === 'efficient'
  ) {
    level = 'mínimo';
  }
  // 4. Default / Mild (leve)
  else {
    level = 'leve';
  }

  // --- TEXTOS DO LAUDO POR SEVERIDADE ---
  let accuracyNote = '';
  if (level === 'mínimo') {
    accuracyNote = 'Rastreio visual sistemático e eficiente. Excelente capacidade de discriminação com controle inibitório preservado. Velocidade e precisão dentro do padrão esperado.';
  } else if (level === 'leve') {
    if (speedStyle === 'impulsive') {
      accuracyNote = 'Desempenho oscilante na relação velocidade-precisão. O usuário apresenta precipitação motora para processar os estímulos visuais, com performance ainda funcional.';
    } else if (speedStyle === 'slow') {
      accuracyNote = 'Desempenho oscilante na relação velocidade-precisão. O usuário apresenta necessidade de tempo prolongado para processar os estímulos visuais, com performance ainda funcional.';
    } else {
      accuracyNote = 'Desempenho oscilante na relação velocidade-precisão. O usuário apresenta oscilação no ritmo para processar os estímulos visuais, com performance ainda funcional.';
    }
  } else if (level === 'moderado') {
    accuracyNote = 'Filtro atencional comprometido. A carga de distratores visuais desorganizou a estratégia de busca, resultando em dificuldade para reter o padrão de referência e identificar diferenças morfológicas.';
  } else {
    // level === 'importante'
    if (spatialAsymmetry.asymmetryRatio >= 0.8) {
      accuracyNote = 'Colapso da atenção seletiva visuoespacial. Suspeita de assimetria atencional (negligência espacial) — padrão compatível com omissões unilaterais sistemáticas. Incapacidade severa de inibir distratores de fundo.';
    } else {
      accuracyNote = 'Colapso da atenção seletiva visuoespacial. Incapacidade severa de inibir distratores de fundo.';
    }
  }

  let speedNote = '';
  if (speedStyle === 'efficient') {
    speedNote = 'Velocidade e precisão dentro do padrão esperado (Rastreio eficiente).';
  } else if (speedStyle === 'impulsive') {
    speedNote = 'Velocidade de processamento visual rápida, porém com prejuízo na precisão por precipitação motora.';
  } else if (speedStyle === 'slow') {
    speedNote = 'Velocidade de busca visual notavelmente lenta ou com tempo de busca prolongado, com foco preservado.';
  } else {
    // speedStyle === 'disorganized'
    speedNote = 'Velocidade oscilante acompanhada de alto índice de erros, indicando sobrecarga ou busca desorganizada.';
  }

  return {
    score,
    level,
    accuracyNote,
    speedNote,
  };
}
