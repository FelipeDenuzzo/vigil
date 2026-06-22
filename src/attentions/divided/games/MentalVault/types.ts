// src/attentions/divided/games/MentalVault/types.ts

export type MentalVaultPhase = 'instructions' | 'encoding' | 'processing' | 'recall' | 'feedback' | 'summary';
export type RoundCondition = 'pure' | 'mixed';

export interface GameConfig {
  consonantsCount: number;      // Número de letras a memorizar (3 a 6)
  displayDurationMs: number;    // Duração de exibição de cada letra (padrão 1500ms)
  classificationTrials: number; // Número de trials de classificação na fase 2 (padrão 8)
  condition: RoundCondition;     // Condição: 'pure' ou 'mixed'
}

export interface ProcessingTrialResult {
  digit: number;
  color: 'blue' | 'red' | 'default';
  rule: 'even-odd' | 'greater-less';
  selectedAnswer: 'left' | 'right' | 'timeout';
  correctAnswer: 'left' | 'right';
  isCorrect: boolean;
  reactionTimeMs: number;
}

export interface RoundResult {
  roundNumber: number;
  config: GameConfig;
  targetLetters: string[];
  userRecallLetters: string[];
  isRecallCorrect: boolean;
  processingAccuracy: number;
  processingAvgRtMs: number;
}
