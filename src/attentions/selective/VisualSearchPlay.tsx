import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../shared/components/Button';
import VisualSearchHunt from './games/VisualSearchHunt/VisualSearchHunt';

const VisualSearchPlay: React.FC = () => {
  const navigate = useNavigate();

  function handleEnd() {
    navigate('/treinar/seletiva');
  }

  return (
    <div style={{ padding: 'var(--space-6)' }}>
      <header style={{ marginBottom: 'var(--space-4)' }}>
        <Button
          variant="ghost"
          onClick={() => navigate('/treinar/seletiva')}
          style={{ marginBottom: 'var(--space-2)' }}
        >
          ← Voltar
        </Button>
      </header>
      <VisualSearchHunt onEnd={handleEnd} />
    </div>
  );
};

export default VisualSearchPlay;
