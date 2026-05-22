import React from 'react';
import { useNavigate } from 'react-router-dom';
import VisualSearchHunt from './games/VisualSearchHunt/VisualSearchHunt';

const VisualSearchPlay: React.FC = () => {
  const navigate = useNavigate();

  function handleEnd() {
    navigate('/treinar/seletiva');
  }

  return (
    <div style={{ padding: 'var(--space-6)' }}>
      <VisualSearchHunt onEnd={handleEnd} />
    </div>
  );
};

export default VisualSearchPlay;
