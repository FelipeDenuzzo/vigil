// src/attentions/alternating/ColorShapePlay.tsx
// Página wrapper do jogo ColorShape — espelha VisualSearchPlay.

import React, { useState } from 'react';
import { ColorShapeGame } from '../alternated/games/ColorShape/ColorShapeGame';
import { ColorShapeEvaluationContainer } from '../alternated/games/ColorShape/ColorShapeEvaluationContainer';
import type { ColorShapeSessionLog } from '../alternated/games/ColorShape/types';
import { v4 as uuidv4 } from 'uuid';

interface Props {
  onClose?: () => void;
}

const ColorShapePlay: React.FC<Props> = ({ onClose }) => {
  const [sessionId]   = useState(() => uuidv4());
  const [completedLog, setCompletedLog] = useState<ColorShapeSessionLog | null>(null);

  if (completedLog) {
    return (
      <div style={{ maxWidth: 920, margin: '0 auto', padding: 16 }}>
        <ColorShapeEvaluationContainer 
          sessionLog={completedLog} 
          onClose={onClose}
          onRepeat={() => {
            setCompletedLog(null);
            // reset state logic will be added if needed, wait, ColorShapeGame has no instructions state inside Play?
            // Actually let's check what state ColorShapePlay has.
          }}
        />
      </div>
    );
  }

  return (
    <div style={{ width: '100%' }}>
      <ColorShapeGame
        sessionId={sessionId}
        onComplete={(log) => setCompletedLog(log)}
      />
    </div>
  );
};

export default ColorShapePlay;
