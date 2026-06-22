// src/assessment/selectiveListening/selectiveListeningScaleDefinitions.ts

export interface ScaleConfig {
  serialAccuracy: {
    excellent: number;
    good: number;
    regular: number;
  };
  distractorIntrusion: {
    low: number;
    medium: number;
  };
}

/**
 * Definições clínicas de faixas de normalidade para a Escuta Seletiva.
 * Serial Accuracy: proporção de acertos na ordem correta.
 * Distractor Intrusion: taxa de dígitos irrelevantes inseridos.
 */
export const SELECTIVE_LISTENING_SCALE: ScaleConfig = {
  serialAccuracy: {
    excellent: 0.85,
    good: 0.70,
    regular: 0.50,
  },
  distractorIntrusion: {
    low: 0.15,
    medium: 0.35,
  },
};
