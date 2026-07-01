// src/attentions/sustained/games/FruitWatch/types.ts

export interface FigureDefinition {
  id: string;
  imagePath: string;
  category: 'yellow' | 'purple' | 'green' | 'red' | 'different';
}

// Uma figura voando na tela
export interface FlyingFigure {
  id: string;               // uuid único da instância
  figureId: string;         // ID da figura no catálogo
  isTarget: boolean;
  launchX: number;          // 10-90 (% da largura inicial da tela)
  endX: number;             // X final de aterrissagem
  peakY: number;            // altura máxima da parábola (65-85% da tela)
  launchAt: number;         // timestamp em ms para o início do voo
  flightDurationMs: number; // duração do voo (slower agora)
}

export type PhaseMode =
  | 'single'            // fases 1–2: itens visualmente contrastantes
  | 'conjunction'       // fases 3–4: itens parecidos (mesma categoria de cor)
  | 'bonus_after'       // fase 5: pergunta surpresa sobre um item bônus ao final
  | 'bonus_before';     // fase 6: pergunta surpresa sobre um item bônus antes da principal

export interface PhaseConfig {
  phase: 1 | 2 | 3 | 4 | 5 | 6;
  mode: PhaseMode;
  durationMs: number;
  simultaneousFigures: 1 | 2 | 3;
  interItemIntervalMs: [number, number]; // [min, max]
  flightDurationMs: [number, number];    // [min, max]
}

// Resultado bruto de cada uma das 6 fases
export interface PhaseRawResult {
  phase: number;
  targetFigureId: string;     // ID da figura alvo da fase
  targetCount: number;        // quantas vezes o alvo realmente apareceu
  userAnswer: number;         // o que o usuário respondeu
  bonusFigureId?: string;     // apenas nas fases 5 e 6
  bonusRealCount?: number;    // contagem real do bônus
  bonusUserAnswer?: number;   // resposta do usuário para o bônus
  commissionErrors: number;   // toques inadvertidos na tela durante o jogo
}

// Resultado final compilado do jogo
export interface FruitWatchScore {
  focoContinuo: number;       // 0–100 — omissões fases 1+2
  controleCalma: number;      // 0–100 — falsos positivos fases 3+4 e comissões
  focoMultitarefa: number;    // 0–100 — Custo de Dupla Tarefa (DTC) fase 5 vs 6
  conquistaSecreta: boolean;  // verdadeiro se acertou o bônus da fase 5
  rawResults: PhaseRawResult[];
}

export interface FruitWatchFullSessionLog {
  sessionId: string;
  createdAt: string;
  game: 'fruit-watch';
  attentionType: 'sustentada';
  score: number; // focoContinuo (média principal)
  results: PhaseRawResult[];
}
