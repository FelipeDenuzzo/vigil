export type AttentionType = 'selective' | 'sustained' | 'alternating' | 'divided';

export interface AttentionInfo {
  id: AttentionType;
  label: string;
  description: string;
  color: string;       // var CSS, ex: 'var(--color-selective)'
  icon: string;        // emoji ou nome de ícone
  gamesCount: number;
}

export interface GameSession {
  gameId: string;
  attentionType: AttentionType;
  hits: number;
  errors: number;
  totalTimeMs: number;
  completedAt: string; // ISO date
}

export interface GameProps {
  onEnd: (session: GameSession) => void;
}
