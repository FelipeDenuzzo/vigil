// src/attentions/divided/MentalVaultPlay.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../shared/components/Button';
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

const MentalVaultPlay: React.FC = () => {
  const navigate = useNavigate();
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
    <div style={{ padding: 'var(--space-6)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{ marginBottom: 'var(--space-4)' }}>
        <Button
          variant="ghost"
          onClick={() => navigate('/treinar/dividida')}
          style={{ marginBottom: 'var(--space-2)' }}
        >
          ← Voltar
        </Button>
      </header>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <MentalVaultGame
          sessionId={sessionId}
          onClose={() => navigate('/treinar/dividida')}
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
