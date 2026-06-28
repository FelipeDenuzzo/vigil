export interface LampadaEvent {
  id: string;
  activatedAt: number;       // timestamp ms — quando a lâmpada piscou
  respondedAt: number | null; // null = omissão
  isFalseAlarm: boolean;      // toque fora de janela ativa
}

export interface SalaDeVigiliaRawSession {
  sessionId: string;
  startedAt: number;           // timestamp ms início da sessão
  endedAt: number;
  durationMs: number;
  events: LampadaEvent[];
  falseAlarms: number[];       // timestamps de toques sem lâmpada ativa
  totalTargets: number;        // quantas lâmpadas piscaram
  responseWindowMs: number;    // janela de resposta configurada (ex: 1200ms)
}

export interface SalaDeVigiliaMetrics {
  omissions: number;           // erros de omissão
  commissions: number;         // falsos alarmes (comissão)
  hits: number;
  hitRate: number;             // hits / totalTargets
  meanRT: number;              // tempo de reação médio (ms)
  sdRT: number;                // desvio padrão do RT → mind-wandering
  block1HitRate: number;       // 1ª metade da sessão
  block2HitRate: number;       // 2ª metade da sessão
  vigilanceDecrement: number;  // block1HitRate - block2HitRate (positivo = piora)
  block1MeanRT: number;
  block2MeanRT: number;
  rtDecrement: number;         // block2MeanRT - block1MeanRT (positivo = lentidão)
}

export interface SalaDeVigiliaScaleResult {
  omissionSeverity: 'normal' | 'mild' | 'moderate' | 'severe';
  commissionSeverity: 'normal' | 'mild' | 'moderate' | 'severe';
  vigilanceDecrementSeverity: 'none' | 'mild' | 'moderate' | 'severe';
  rtVariabilitySeverity: 'low' | 'moderate' | 'high';
  score: number;               // 0–100
  level: string;               // ex: "Vigilância Estável"
}
