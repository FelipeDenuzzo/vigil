export type OnboardingStep =
  | 'welcome'
  | 'round-motor'      // Etapa 1 — Calibragem Motora/Alerta
  | 'round-inhibitory' // Etapa 2 — Controle Inibitório/Seletiva
  | 'round-flexible'   // Etapa 3 — Flexibilidade/Alternada
  | 'round-divided'    // Etapa 4 — Dupla-Tarefa/Dividida
  | 'result';

// Resultado bruto de cada etapa — coletado durante a tarefa
export interface MotorRoundResult {
  type: 'motor';
  reactionTimes: number[];   // ms por estímulo
  totalStimuli: number;
}

export interface InhibitoryRoundResult {
  type: 'inhibitory';
  commissionErrors: number;  // respondeu quando não deveria (No-Go)
  omissionErrors: number;    // não respondeu quando deveria (Go)
  reactionTimes: number[];   // ms apenas dos Go corretos
  totalGoStimuli: number;
  totalNoGoStimuli: number;
}

export interface FlexibleRoundResult {
  type: 'flexible';
  totalTimeMs: number;       // tempo total da tarefa
  sequenceErrors: number;    // cliques fora de ordem
  intervalsBetweenClicks: number[]; // ms entre cada clique consecutivo
  totalTargets: number;
}

export interface DividedRoundResult {
  type: 'divided';
  precisionBubblesOnly: number; // 0 a 1
  precisionDualTask: number;    // 0 a 1
  dualTaskCost: number;         // 0 a 1
}

export type RoundResult = MotorRoundResult | InhibitoryRoundResult | FlexibleRoundResult | DividedRoundResult;

// Score calculado pelo avaliador interno — nunca pelo Gemini
export type BaselineLevel = 'minimo' | 'leve' | 'moderado' | 'importante';

export interface BaselineEntry {
  score: number;           // 0–100
  level: BaselineLevel;
  doneAt: string;          // ISO 8601
}

// O que é gravado em users/{uid}.baseline
export interface UserBaseline {
  seletiva: BaselineEntry;
  sustentada: BaselineEntry;
  alternada: BaselineEntry;
  dividida: BaselineEntry;
}

// Estado interno do fluxo de onboarding
export interface OnboardingState {
  currentStep: OnboardingStep;
  motorResult: MotorRoundResult | null;
  inhibitoryResult: InhibitoryRoundResult | null;
  flexibleResult: FlexibleRoundResult | null;
  dividedResult: DividedRoundResult | null;
  baseline: UserBaseline | null;
}
