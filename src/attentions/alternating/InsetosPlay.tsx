// src/attentions/alternating/InsetosPlay.tsx
// Página wrapper do jogo Insetos — espelha ColorShapePlay.

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../shared/components/Button';
import { InsetosGame } from './games/Insetos/InsetosGame';
import { InsetosInstructions } from './games/Insetos/InsetosInstructions';
import { InsetosEvaluationContainer, persistInsetosLog } from './games/Insetos/InsetosEvaluationContainer';
import type { InsetosSessionLog } from './games/Insetos/types';
import { v4 as uuidv4 } from 'uuid';

type Screen = 'instructions' | 'playing' | 'result';

const InsetosPlay: React.FC = () => {
  const navigate = useNavigate();
  const [sessionId]    = useState(() => uuidv4());
  const [screen, setScreen] = useState<Screen>('instructions');
  const [completedLog, setCompletedLog] = useState<InsetosSessionLog | null>(null);

  if (screen === 'result' && completedLog) {
    return (
      <div style={{ maxWidth: 920, margin: '0 auto', padding: 16 }}>
        <InsetosEvaluationContainer sessionLog={completedLog} />
      </div>
    );
  }

  if (screen === 'playing') {
    return (
      <div style={{ padding: 'var(--space-4)' }}>
        <InsetosGame
          sessionId={sessionId}
          onComplete={(log) => {
            persistInsetosLog(log);
            setCompletedLog(log);
            setScreen('result');
          }}
          onClose={() => setScreen('instructions')}
        />
      </div>
    );
  }

  return (
    <div style={{ padding: 'var(--space-6)' }}>
      <Button
        variant="ghost"
        onClick={() => navigate('/treinar/alternada')}
        style={{ marginBottom: 'var(--space-2)' }}
      >
        ← Voltar
      </Button>
      <InsetosInstructions
        onStart={() => setScreen('playing')}
        onBack={() => navigate('/treinar/alternada')}
      />
    </div>
  );
};

export default InsetosPlay;
