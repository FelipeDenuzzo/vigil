export interface BaseTrainingSessionLog {
  sessionId: string;
  gameId: string;
  attentionType: string;
  startedAt: number;
  completedAt?: number;
  sessionStatus: "started" | "abandoned" | "completed";
  schemaVersion: number;
}

export type SessionLog = BaseTrainingSessionLog & {
  // detalhes específicos de cada treino podem ser adicionados localmente
  [key: string]: any;
};

export interface GameResult {
  sessionId: string;
  gameId: string;
  attentionType: string;
  startedAt: number;
  completedAt: number;
  sessionStatus?: string;
  abandoned?: boolean;
  completed?: boolean;
  totalRoundsPlanned?: number;
  completedRounds?: number;
  startedRounds?: number;
  lastRoundIndexReached?: number;
  lastLevelReached?: number;
  accuracy?: number;
  [key: string]: any;
}