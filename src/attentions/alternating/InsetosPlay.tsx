// src/attentions/alternating/InsetosPlay.tsx
// Página wrapper do jogo Insetos — espelha ColorShapePlay.
// Fluxo: instructions → simulation → playing → result

import React, { useState } from 'react';
import { InsetosGame } from './games/Insetos/InsetosGame';
import { InsetosInstructions } from './games/Insetos/InsetosInstructions';
import InsetosSimulation from './games/Insetos/InsetosSimulation';
import { InsetosEvaluationContainer, persistInsetosLog } from './games/Insetos/InsetosEvaluationContainer';
import type { InsetosSessionLog } from './games/Insetos/types';
import { v4 as uuidv4 } from 'uuid';

type Screen = 'instructions' | 'simulation' | 'playing' | 'result';

interface Props {
  onClose?: () => void;
}

const InsetosPlay: React.FC<Props> = ({ onClose }) => {
  const [sessionId]    = useState(() => uuidv4());
  const [screen, setScreen] = useState<Screen>('instructions');
  const [completedLog, setCompletedLog] = useState<InsetosSessionLog | null>(null);

  if (screen === 'result' && completedLog) {
    return (
      <div style={{ maxWidth: 920, margin: '0 auto', padding: 16 }}>
        <InsetosEvaluationContainer 
          sessionLog={completedLog} 
          onClose={onClose} 
          onRepeat={() => {
            setCompletedLog(null);
            setScreen('instructions');
          }}
        />
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
          />
      </div>
    );
  }

  if (screen === 'simulation') {
    return (
      <InsetosSimulation
        onDone={() => setScreen('playing')}
        onBack={() => setScreen('instructions')}
      />
    );
  }

  return (
    <div style={{ width: '100%' }}>
      <InsetosInstructions
        onStart={() => setScreen('simulation')}
        onBack={onClose ?? (() => {})}
      />
    </div>
  );
};

export default InsetosPlay;
