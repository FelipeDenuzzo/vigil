// src/assessment/insetos/types.ts

export interface InsetosRawEvent {
  type: 'hit' | 'omission' | 'commission_error' | 'direction_change' | 'switch';
  timestamp: number;
  phase: number;
  activeGroup: 'formiga' | 'joaninha';
  rt?: number;
  isPostSwitch?: boolean;
  alertState?: number;
}

export interface InsetosSessionData {
  sessionId: string;
  startedAt: string;
  rawEvents: InsetosRawEvent[];
}

export interface InsetosMetrics {
  meanRT: number | null;            // ms — média dos hits com RT registrado
  omissions: number;                // total de omissões
  commissionErrors: number;         // total de erros de comissão
  switchCostMs: number | null;      // RT médio pós-switch − RT médio geral (ms)
  multiTrackCostPct: number | null;  // queda de precisão fases 1–2 vs 3–6 (%)
  vigilanceDecayPct: number | null;  // omission rate 1º terço vs 3º terço (%)
  totalHits: number;
  totalTrials: number;              // hits + omissions
  accuracyPct: number | null;
}

export interface InsetosScaleResult {
  score: number;
  level: 'minimo' | 'leve' | 'moderado' | 'importante';
  accuracyNote: string;
  speedNote: string;
  switchCostNote: string;
}
