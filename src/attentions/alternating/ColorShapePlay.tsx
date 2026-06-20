// src/attentions/alternating/ColorShapePlay.tsx
// Página wrapper do jogo ColorShape — espelha VisualSearchPlay.

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../shared/components/Button';
import { ColorShapeGame } from '../alternated/games/ColorShape/ColorShapeGame';
import { ColorShapeEvaluationContainer } from '../alternated/games/ColorShape/ColorShapeEvaluationContainer';
import type { ColorShapeSessionLog } from '../alternated/games/ColorShape/types';
import { v4 as uuidv4 } from 'uuid';

const ColorShapePlay: React.FC = () => {
  const navigate = useNavigate();
  const [sessionId]   = useState(() => uuidv4());
  const [completedLog, setCompletedLog] = useState<ColorShapeSessionLog | null>(null);

  if (completedLog) {
    return (
      <div style={{ maxWidth: 920, margin: '0 auto', padding: 16 }}>
        <ColorShapeEvaluationContainer sessionLog={completedLog} />
      </div>
    );
  }

  return (
    <div style={{ padding: 'var(--space-6)' }}>
      <header style={{ marginBottom: 'var(--space-4)' }}>
        <Button
          variant='ghost'
          onClick={() => navigate('/treinar/alternada')}
          style={{ marginBottom: 'var(--space-2)' }}
        >
          ← Voltar
        </Button>
      </header>
      <ColorShapeGame
        sessionId={sessionId}
        onComplete={(log) => setCompletedLog(log)}
        onClose={() => navigate('/treinar/alternada')}
      />
    </div>
  );
};

export default ColorShapePlay;
