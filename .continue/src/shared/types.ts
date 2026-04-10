export type AttentionType = 'selective' | 'sustained' | 'alternating' | 'divided';

export interface AttentionInfo {
  id: AttentionType;
  label: string;
  description: string;
  color: string;
  icon: string;
  gamesCount: number;
}

export interface GameSession {
  gameId: string;
  attentionType: AttentionType;
  hits: number;
  errors: number;
  totalTimeMs: number;
  completedAt: string;
}

export interface GameProps {
  onEnd: (session: GameSession) => void;
}
