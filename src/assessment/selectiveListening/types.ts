// src/assessment/selectiveListening/types.ts

export type SelectiveListeningFase = 'instrucoes' | 'simulacao' | 'pronto' | 'reproducao' | 'resposta' | 'resumo';

export type VozAlvo = 'masculina' | 'feminina';

export interface TentativaRodada {
  roundNumber: number;            // 1-indexed (1 a 6)
  roundStartAt: string;           // Timestamp de início da rodada
  targetVoice: VozAlvo;           // Voz que o usuário deve escutar
  targetDigits: number[];         // Dígitos corretos
  distractorDigits: number[];     // Dígitos incorretos (da outra voz)
  responseDigits: number[];       // Dígitos informados pelo usuário
  responseLatencyMs: number;      // Tempo de resposta pós-reprodução
  playbackDurationMs: number;     // Duração do áudio concorrente
  replayCount: number;            // Quantidade de repetições (max 1)
  usedHeadphonesAcknowledged: boolean; // Confirmação de uso de fones
  submitted: boolean;             // Se confirmou a resposta
  omission: boolean;              // Se não respondeu nada
}

export interface SelectiveListeningMetrics {
  totalRounds: number;
  serialAccuracy: number;         // Proporção de dígitos na posição exata (0 a 1)
  itemAccuracy: number;           // Proporção de dígitos lembrados fora de ordem (0 a 1)
  omissions: number;              // Quantidade de omissões (rodadas sem resposta)
  meanResponseTimeMs: number;     // Tempo de reação médio pós-áudio
  distractorIntrusionRate: number; // Porcentagem de dígitos do distrator presentes na resposta (0 a 1)
  loadCost: number;               // Queda de precisão entre sequências menores (3) e maiores (4 ou 5)
  avgReplayCount: number;         // Média de repetições solicitadas
}

export interface SelectiveListeningScaleResult {
  score: number;                  // Pontuação global de 0 a 100
  level: 'mínimo' | 'leve' | 'moderado' | 'importante'; // Severidade atencional
  accuracyNote: string;           // Explicação curta da precisão
  intrusionNote: string;          // Explicação curta de intrusão do distrator
}
