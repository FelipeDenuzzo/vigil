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
    flagImpulsividade,
    flagLentificacao,
    flagSwitchCost,
    flagFadigaAtencional,
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
  const score = Math.round(accuracyRate * 100);

  // --- DERIVAÇÃO DO NÍVEL DE SEVERIDADE BASEADO EM FLAGS ---
  let activeFlagsCount = 0;
  if (flagImpulsividade) activeFlagsCount++;
  if (flagLentificacao) activeFlagsCount++;
  if (flagSwitchCost) activeFlagsCount++;
  if (flagFadigaAtencional) activeFlagsCount++;

  let level: 'mínimo' | 'leve' | 'moderado' | 'importante';

  if (activeFlagsCount === 0) {
    // Nenhuma flag -> 'mínimo' ou 'leve' (depende do score global)
    level = score >= 85 ? 'mínimo' : 'leve';
  } else if (activeFlagsCount === 1) {
    // 1 flag -> 'leve' ou 'moderado'
    level = score >= 80 ? 'leve' : 'moderado';
  } else {
    // 2+ flags ou flag de fadiga associada a baixo rendimento
    // 2+ flags -> 'moderado' ou 'importante'
    level = score < 60 || spatialAsymmetry.asymmetryRatio >= 0.8 ? 'importante' : 'moderado';
  }

  // Em caso de fadiga atencional ativada com baixa taxa de acertos geral
  if (flagFadigaAtencional && score < 70) {
    level = 'importante';
  }

  // --- TEXTOS DO LAUDO BASEADOS NAS FLAGS ---
  let accuracyNote = '';
  const notes: string[] = [];

  if (flagFadigaAtencional) {
    notes.push('Sinais proeminentes de oscilação atencional por fadiga cognitiva (Time-on-Task). O usuário iniciou com desempenho adequado, mas apresentou declínio acentuado de precisão e aumento de omissões nas fases finais.');
  }
  if (flagImpulsividade) {
    notes.push('Padrão de resposta impulsivo com falha no controle inibitório. O usuário responde de forma rápida nas fases de maior complexidade discriminativa, incorrendo em elevado índice de comissões (falsos positivos).');
  }
  if (flagLentificacao) {
    notes.push('Lentificação no processamento visual e na busca ativa. O tempo médio de rastreamento foi prolongado desde as primeiras rodadas do teste, impactando a produtividade geral.');
  }
  if (flagSwitchCost) {
    notes.push('Prejuízo na flexibilidade cognitiva e custo de transição (Switch Cost). O usuário demonstrou desorganização e lentificação acentuada ao transitar para o bloco misto de estímulos (Fase 10).');
  }
  if (spatialAsymmetry.asymmetryRatio >= 0.5 && spatialAsymmetry.dominant !== 'insufficient-data') {
    notes.push(`Suspeita de assimetria atencional visuoespacial com dominância no hemicampo ${spatialAsymmetry.dominant === 'left' ? 'esquerdo' : 'direito'}.`);
  }

  if (notes.length === 0) {
    if (level === 'mínimo') {
      accuracyNote = 'Rastreio visual sistemático e eficiente. Excelente capacidade de discriminação com controle inibitório preservado. Velocidade e precisão dentro do padrão esperado.';
    } else {
      accuracyNote = 'Desempenho atencional dentro do padrão funcional normativo, com oscilações normais e sem sinais clínicos de desatenção ou fadiga.';
    }
  } else {
    accuracyNote = notes.join(' ');
  }

  // --- VELOCIDADE/RITMO ---
  let speedNote = '';
  if (flagLentificacao) {
    speedNote = 'Velocidade de busca significativamente lenta, com necessidade de tempo prolongado para processar os estímulos.';
  } else if (flagImpulsividade) {
    speedNote = 'Tempo de resposta acelerado associado a falhas frequentes de precisão (perfil impulsivo).';
  } else if (flagSwitchCost) {
    speedNote = 'Custo de alternância (Switch Cost) elevado, indicando lentificação específica ao mudar o padrão de estímulos.';
  } else {
    speedNote = 'Velocidade e precisão equilibradas, sem sinais de fadiga ou lentificação atípica.';
  }

  return {
    score,
    level,
    accuracyNote,
    speedNote,
  };
}
