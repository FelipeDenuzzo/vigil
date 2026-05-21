export type AttentionType = 'selective' | 'sustained' | 'alternating' | 'divided';

export interface AttentionInfo {
  id: AttentionType;
  label: string;
  description: string;
  color: string;
  icon: string;
  gamesCount: number;
}

export interface GameProps {
  onEnd: (session: any) => void;
}

export type SessionStatus = "in_progress" | "completed" | "abandoned";

export type ClickAction = "mark" | "unmark";

export interface ClickEvent {
  timestamp: number;
  action: ClickAction;
  isTarget: boolean;
}

export interface RoundLog {
  roundIndex: number;
  level: number;
  startedAt: number;
  endedAt?: number;
  completed: boolean;
  accuracy?: number;
  reactionTimes?: number[];
  clicks: ClickEvent[];
}

export interface SessionLog {
  sessionId: string;
  gameId: string;
  attentionType: AttentionType;

  startedAt: number;
  completedAt: number | null;

  sessionStatus: SessionStatus;

  started: boolean;
  abandoned: boolean;
  completed: boolean;

  totalRoundsPlanned: number;
  completedRounds: number;
  startedRounds: number;

  lastRoundIndexReached: number;
  lastLevelReached: number;

  rounds: RoundLog[];
}

export interface GameResult {
  sessionId: string;
  gameId: string;
  attentionType: AttentionType;

  startedAt: number;
  completedAt: number | null;

  sessionStatus: SessionStatus;
  abandoned: boolean;
  completed: boolean;

  totalRoundsPlanned: number;
  completedRounds: number;
  startedRounds: number;
  lastRoundIndexReached: number;
  lastLevelReached: number;

  accuracy?: number;
  avgReactionTime?: number;
  score?: number;
}
