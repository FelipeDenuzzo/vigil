// src/attentions/divided/MentalVaultPlay.tsx
import React, { useState } from 'react';
// removed imports
import { MentalVaultGame } from './games/MentalVault/MentalVaultGame';
import { MentalVaultEvaluationContainer } from './games/MentalVault/MentalVaultEvaluationContainer';
import { v4 as uuidv4 } from 'uuid';
import type { RegistroRodada } from './games/MentalVault/types';

interface MentalVaultSessionLog {
  sessionId: string;
  startedAt: string;
  nivelMaximo: number;
  rodadas: RegistroRodada[];
}

interface Props {
  onClose?: () => void;
}

const MentalVaultPlay: React.FC<Props> = () => {
  const [sessionId] = useState(() => uuidv4());
  const [completedLog, setCompletedLog] = useState<MentalVaultSessionLog | null>(null);

  if (completedLog) {
    return (
      <div style={{ maxWidth: 920, margin: '0 auto', padding: 16 }}>
        <MentalVaultEvaluationContainer
          sessionId={completedLog.sessionId}
          startedAt={completedLog.startedAt}
          nivelMaximo={completedLog.nivelMaximo}
          rodadas={completedLog.rodadas}
        />
      </div>
    );
  }

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', paddingTop: '24px' }}>
        <MentalVaultGame
          sessionId={sessionId}
          onComplete={(res) => {
            setCompletedLog({
              sessionId,
              startedAt: res.startedAt,
              nivelMaximo: res.nivelMaximo,
              rodadas: res.rodadas,
            });
          }}
        />
      </div>
    </div>
  );
};

export default MentalVaultPlay;
