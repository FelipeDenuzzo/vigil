// src/attentions/alternating/TrilhaZigueZaguePlay.tsx

import React, { useState } from 'react';
import { TrilhaZigueZague } from './games/TrilhaZigueZague/TrilhaZigueZague';
import { TrilhaZigueZagueEvaluationContainer } from './games/TrilhaZigueZague/TrilhaZigueZagueEvaluationContainer';
import type { TrilhaZigueZagueSessionLog } from './games/TrilhaZigueZague/types';
import { v4 as uuidv4 } from 'uuid';

interface Props {
  onClose?: () => void;
}

const TrilhaZigueZaguePlay: React.FC<Props> = ({ onClose }) => {
  const [sessionId, setSessionId] = useState(() => uuidv4());
  const [completedLog, setCompletedLog] = useState<TrilhaZigueZagueSessionLog | null>(null);

  if (completedLog) {
    return (
      <div style={{ maxWidth: 920, margin: '0 auto', padding: 16 }}>
        <TrilhaZigueZagueEvaluationContainer 
          sessionLog={completedLog} 
          onClose={onClose}
          onRepeat={() => {
            setSessionId(uuidv4());
            setCompletedLog(null);
          }}
        />
      </div>
    );
  }

  return (
    <div style={{ width: '100%' }}>
      <TrilhaZigueZague
        sessionId={sessionId}
        onComplete={(log) => setCompletedLog(log)}
        onClose={onClose}
      />
    </div>
  );
};

export default TrilhaZigueZaguePlay;
