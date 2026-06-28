import React, { useState, useEffect, useRef } from 'react';

interface Lampada {
  id: string;
  x: number; // percentage (0-100)
  y: number; // percentage (0-100)
}

interface SalaDeVigiliaSimulationProps {
  onNext: () => void;
  onClose: () => void;
}

export const SalaDeVigiliaSimulation: React.FC<SalaDeVigiliaSimulationProps> = ({ onNext, onClose }) => {
  const [lampadas, setLampadas] = useState<Lampada[]>([]);
  const [activeLampId, setActiveLampId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<'acerto' | 'erro' | 'omisso' | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const sessionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Simulation setup
  useEffect(() => {
    // Generate 8 fixed lamps
    const initialLamps: Lampada[] = Array.from({ length: 8 }).map((_, i) => ({
      id: `lamp-${i}`,
      x: 10 + Math.random() * 80, // keep away from edges
      y: 10 + Math.random() * 80,
    }));
    setLampadas(initialLamps);

    // End simulation after 30s
    sessionTimeoutRef.current = setTimeout(() => {
      onNext();
    }, 30000);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (sessionTimeoutRef.current) clearTimeout(sessionTimeoutRef.current);
    };
  }, [onNext]);

  // Lamp scheduling logic for simulation
  useEffect(() => {
    if (lampadas.length === 0) return;
    
    const scheduleNextLamp = () => {
      const delay = 2000 + Math.random() * 4000; // faster for simulation (2-6s)
      timeoutRef.current = setTimeout(() => {
        const randomLamp = lampadas[Math.floor(Math.random() * lampadas.length)];
        setActiveLampId(randomLamp.id);
        setFeedback(null);

        // Turn off lamp after 250ms
        setTimeout(() => {
          setActiveLampId(null);
        }, 250);

        // Omission window (1200ms)
        timeoutRef.current = setTimeout(() => {
          setFeedback('omisso');
          scheduleNextLamp();
        }, 1200);

      }, delay);
    };

    scheduleNextLamp();

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [lampadas]);

  const handleContainerClick = () => {
    if (!activeLampId && feedback !== 'acerto' && feedback !== 'erro') {
      setFeedback('erro'); // False alarm
    }
  };

  const handleLampClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (activeLampId === id) {
      setFeedback('acerto');
      setActiveLampId(null);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      
      // Schedule next lamp after hit
      timeoutRef.current = setTimeout(() => {
        setFeedback(null);
        const randomLamp = lampadas[Math.floor(Math.random() * lampadas.length)];
        setActiveLampId(randomLamp.id);
      }, 3000);
    } else {
      setFeedback('erro');
    }
  };

  return (
    <div 
      style={{ flex: 1, position: 'relative', overflow: 'hidden' }}
      onClick={handleContainerClick}
    >
      <div style={{ position: 'absolute', top: '1rem', left: '1rem', zIndex: 10 }}>
        <button 
          onClick={onClose}
          style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1rem' }}
        >
          ← Sair
        </button>
      </div>

      <div style={{ position: 'absolute', top: '1rem', right: '1rem', textAlign: 'right', zIndex: 10 }}>
        <div style={{ color: 'white', opacity: 0.8 }}>SIMULAÇÃO (30s)</div>
        <button 
          onClick={onNext}
          style={{ marginTop: '8px', padding: '6px 12px', background: 'var(--color-sustained, #2563eb)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Pular Simulação
        </button>
      </div>

      {feedback && (
        <div style={{ 
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', 
          fontSize: '2rem', fontWeight: 'bold', zIndex: 20,
          color: feedback === 'acerto' ? '#4ade80' : feedback === 'erro' ? '#f87171' : '#fbbf24'
        }}>
          {feedback === 'acerto' ? 'MUITO BEM!' : feedback === 'erro' ? 'FALSO ALARME' : 'OMISSÃO'}
        </div>
      )}

      {lampadas.map((lamp) => {
        const isActive = lamp.id === activeLampId;
        return (
          <div
            key={lamp.id}
            onClick={(e) => handleLampClick(e, lamp.id)}
            style={{
              position: 'absolute',
              left: `${lamp.x}%`,
              top: `${lamp.y}%`,
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              backgroundColor: isActive ? '#fbbf24' : '#374151',
              boxShadow: isActive ? '0 0 20px 10px rgba(251, 191, 36, 0.5)' : 'none',
              transform: 'translate(-50%, -50%)',
              transition: 'background-color 0.1s, box-shadow 0.1s',
              cursor: 'pointer'
            }}
          />
        );
      })}
    </div>
  );
};
