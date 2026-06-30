import React from 'react';
import { ReguaLudica } from './ReguaLudica';
import { Button } from './Button';
import { AttentionType } from '../../hooks/useProgressData';

interface GameResultUXProps {
  score: number;
  level: string;
  attentionType?: AttentionType;
  loaded: boolean;
  onRepeat: () => void;
  onBack: () => void;
}

export const GameResultUX: React.FC<GameResultUXProps> = ({
  score,
  level,
  attentionType = 'seletiva',
  loaded,
  onRepeat,
  onBack
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', alignItems: 'center' }}>
      {!loaded ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', border: '4px solid var(--color-border)', borderTopColor: 'var(--color-primary)', animation: 'spin 1s linear infinite', margin: '0 auto var(--space-4)' }} />
          <p style={{ color: 'var(--color-text-muted)' }}>Analisando desempenho...</p>
        </div>
      ) : (
        <>
          <ReguaLudica score={score} level={level} attentionType={attentionType} />
          <div style={{ display: 'flex', gap: 'var(--space-4)', marginTop: 'var(--space-4)' }}>
            <Button variant="secondary" onClick={onRepeat}>Jogar Novamente</Button>
            <Button variant="primary" onClick={onBack}>Voltar ao Menu</Button>
          </div>
        </>
      )}
    </div>
  );
};
