// src/assessment/acharOFaltando/acharOFaltandoScaleDefinitions.ts

export interface AcharOFaltandoScaleConfig {
  accuracyRate: {
    excellent: number; // >= 0.90
    good: number;      // >= 0.70
    regular: number;   // >= 0.50
  };
  responseTime: {
    fast: number;      // < 5000 ms
    adequate: number;  // < 10000 ms
  };
}

/**
 * Faixas científicas de corte de normalidade do treino Achar o Faltando.
 */
export const ACHAR_O_FALTANDO_SCALE: AcharOFaltandoScaleConfig = {
  accuracyRate: {
    excellent: 0.90,
    good: 0.70,
    regular: 0.50,
  },
  responseTime: {
    fast: 5000,
    adequate: 10000,
  },
};
