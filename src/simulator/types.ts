// src/simulator/types.ts
// Tipos centrais do Simulador de Payload Vigil

export type AttentionType = 'alternada' | 'seletiva' | 'sustentada' | 'dividida';

export interface SimulationLog {
  id: string;
  scenarioLabel: string;
  game: string;
  attentionType: AttentionType;
  inputPayload: Record<string, unknown>;
  httpStatus: number | null;
  responseBody: Record<string, unknown> | null;
  durationMs: number;
  error: string | null;
  timestamp: string;
  localScore: number | null;
  aiScore: number | null;
  /** true se httpStatus === expectedStatus */
  passed: boolean;
  expectedStatus: 200 | 400;
  dryRun: boolean;
}

export interface Scenario {
  id: string;
  label: string;
  description: string;
  game: string;
  attentionType: AttentionType;
  /** Status HTTP esperado: 200 para válidos, 400 para inválidos */
  expectedStatus: 200 | 400;
  /** Gera o payload exatamente como o hook enviaria */
  buildPayload: () => Record<string, unknown>;
  /** Score calculado localmente (null para cenários inválidos) */
  localScore: number | null;
  /** Emoji de referência para o nível esperado */
  expectedLevelEmoji: string;
}

export interface GameGroup {
  id: string;
  label: string;
  attentionType: AttentionType;
  scenarios: Scenario[];
}
