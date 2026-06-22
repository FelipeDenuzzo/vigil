// src/attentions/divided/MentalVaultPlay.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../shared/components/Button';
import { MentalVaultGame } from './games/MentalVault/MentalVaultGame';
import { v4 as uuidv4 } from 'uuid';

const MentalVaultPlay: React.FC = () => {
  const navigate = useNavigate();
  const [sessionId] = useState(() => uuidv4());

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
        />
      </div>
    </div>
  );
};

export default MentalVaultPlay;
