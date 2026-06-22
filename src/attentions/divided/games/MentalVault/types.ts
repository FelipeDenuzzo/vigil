// src/attentions/divided/games/MentalVault/types.ts

export type MentalVaultPhase = 'instructions' | 'encoding' | 'processing' | 'recall' | 'feedback' | 'summary';

export interface GameConfig {
  consonantsCount: number;      // Número de letras a memorizar (3 a 6)
  displayDurationMs: number;    // Duração de exibição de cada letra (padrão 1500ms)
  classificationTrials: number; // Número de trials de classificação na fase 2
}

export interface ProcessingTrialResult {
  digit: number;
  selectedAnswer: 'even' | 'odd' | 'timeout';
  correctAnswer: 'even' | 'odd';
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
