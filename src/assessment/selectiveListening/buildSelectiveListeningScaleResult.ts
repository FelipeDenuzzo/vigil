// src/assessment/selectiveListening/buildSelectiveListeningScaleResult.ts
import { SelectiveListeningMetrics, SelectiveListeningScaleResult } from './types';
import { SELECTIVE_LISTENING_SCALE } from './selectiveListeningScaleDefinitions';

export function buildSelectiveListeningScaleResult(
  metrics: SelectiveListeningMetrics
): SelectiveListeningScaleResult {
  const { serialAccuracy, distractorIntrusionRate, omissions, totalRounds } = metrics;

  // Se houve omissão total, classifica como importante
  if (omissions === totalRounds) {
    return {
      score: 0,
      level: 'importante',
      accuracyNote: 'A sessão não foi respondida (100% de omissão).',
      intrusionNote: 'Não foi possível analisar intrusões devido à ausência de respostas.',
    };
  }

  // Pontuação principal é baseada na precisão serial
  const score = metrics.ludicScore;

  // Determinação da severidade baseada na precisão serial
  let level: 'mínimo' | 'leve' | 'moderado' | 'importante';
  const scale = SELECTIVE_LISTENING_SCALE.serialAccuracy;

  if (serialAccuracy >= scale.excellent) {
    level = 'mínimo';
  } else if (serialAccuracy >= scale.good) {
    level = 'leve';
  } else if (serialAccuracy >= scale.regular) {
    level = 'moderado';
  } else {
    level = 'importante';
  }

  // Notas textuais curtas para a tela de resultados
  let accuracyNote = '';
  if (serialAccuracy >= scale.excellent) {
    accuracyNote = 'Precisão excelente. Capacidade impecável de foco na ordem correta.';
  } else if (serialAccuracy >= scale.good) {
    accuracyNote = 'Precisão satisfatória. Consegue reter e organizar a ordem das informações na maior parte do tempo.';
  } else if (serialAccuracy >= scale.regular) {
    accuracyNote = 'Precisão intermediária. Dificuldade moderada em manter a estrutura correta da sequência sob competição sonora.';
  } else {
    accuracyNote = 'Precisão baixa. Dificuldade marcante em focar e reter os números da voz-alvo.';
  }

  let intrusionNote = '';
  const intrusionScale = SELECTIVE_LISTENING_SCALE.distractorIntrusion;
  if (distractorIntrusionRate <= intrusionScale.low) {
    intrusionNote = 'Excelente filtragem de ruído. Baixa interferência do canal distrator.';
  } else if (distractorIntrusionRate <= intrusionScale.medium) {
    intrusionNote = 'Filtragem moderada. Algumas informações do canal distrator interferiram na resposta.';
  } else {
    intrusionNote = 'Alta taxa de intrusão. O canal distrator concorrente afetou significativamente as respostas.';
  }

  // Normaliza o retorno da acentuação de mínimo para consistência com o backend
  const displayLevel = level;

  return {
    score,
    level: displayLevel,
    accuracyNote,
    intrusionNote,
  };
}
